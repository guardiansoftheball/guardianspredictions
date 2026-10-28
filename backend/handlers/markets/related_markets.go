package marketshandlers

import (
	"net/http"
	"sort"
	"strconv"

	"github.com/gorilla/mux"

	"socialpredict/handlers/markets/dto"
	dmarkets "socialpredict/internal/domain/markets"
	"socialpredict/logger"
	"socialpredict/security"
)

const (
	relatedDefaultLimit   = 4
	relatedMaxLimit       = 12
	relatedCandidatesPage = 50
)

// RelatedMarketsResponse lists active markets related to a given market.
// Grouped markets are returned with all their child markets so the client can
// render them as one card; Limit counts cards (a group counts once).
type RelatedMarketsResponse struct {
	Markets []*dto.MarketOverviewResponse `json:"markets"`
	Total   int                           `json:"total"`
}

// RelatedMarkets handles GET /v0/markets/{id}/related?limit=4
func (h *Handler) RelatedMarkets(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}

	id, err := strconv.ParseInt(mux.Vars(r)["id"], 10, 64)
	if err != nil || id <= 0 {
		writeInvalidRequest(w)
		return
	}
	limit := security.ParseBoundedIntParam(r.URL.Query().Get("limit"), relatedDefaultLimit, 1, relatedMaxLimit)

	market, err := h.service.GetMarket(r.Context(), id)
	if err != nil {
		writeDetailsError(w, err)
		return
	}

	candidates, sharedTags, err := h.relatedCandidates(r, market)
	if err != nil {
		if isRequestCanceled(err) {
			return
		}
		logger.LogError("RelatedMarkets", "ListCandidates", err)
		writeInternalError(w)
		return
	}

	overviews, err := buildMarketOverviewResponses(r.Context(), h.service, append([]*dmarkets.Market{market}, candidates...))
	if err != nil {
		if isRequestCanceled(err) {
			return
		}
		logger.LogError("RelatedMarkets", "BuildMarketOverviewResponses", err)
		writeInternalError(w)
		return
	}

	_ = writeJSON(w, http.StatusOK, pickRelated(overviews, sharedTags, limit))
}

// relatedCandidates returns active markets sharing at least one tag with market,
// topped up with other active markets, plus how many tags each one shares.
func (h *Handler) relatedCandidates(r *http.Request, market *dmarkets.Market) ([]*dmarkets.Market, map[int64]int, error) {
	seen := map[int64]bool{market.ID: true}
	sharedTags := map[int64]int{}
	var candidates []*dmarkets.Market

	add := func(list []*dmarkets.Market, countTag bool) {
		for _, m := range list {
			if m == nil {
				continue
			}
			if countTag {
				sharedTags[m.ID]++
			}
			if !seen[m.ID] {
				seen[m.ID] = true
				candidates = append(candidates, m)
			}
		}
	}

	for _, tag := range market.Tags {
		if tag.Slug == "" {
			continue
		}
		list, err := h.service.ListMarkets(r.Context(), dmarkets.ListFilters{
			Status:  "active",
			TagSlug: tag.Slug,
			Limit:   relatedCandidatesPage,
		})
		if err != nil {
			return nil, nil, err
		}
		add(list, true)
	}

	others, err := h.service.ListByStatus(r.Context(), "active", dmarkets.Page{Limit: relatedCandidatesPage})
	if err != nil {
		return nil, nil, err
	}
	add(others, false)

	return candidates, sharedTags, nil
}

// pickRelated drops the source market and its group, ranks the rest by shared
// tags then volume, and keeps the first `limit` cards (all children of a group).
// overviews[0] is the source market.
func pickRelated(overviews []*dto.MarketOverviewResponse, sharedTags map[int64]int, limit int) RelatedMarketsResponse {
	if len(overviews) == 0 || overviews[0] == nil || overviews[0].Market == nil {
		return RelatedMarketsResponse{Markets: []*dto.MarketOverviewResponse{}}
	}
	source := overviews[0].Market
	sourceGroup := groupID(overviews[0])

	type card struct {
		key     string
		shared  int
		volume  int64
		members []*dto.MarketOverviewResponse
	}
	cards := map[string]*card{}
	var order []*card

	for _, ov := range overviews[1:] {
		if ov == nil || ov.Market == nil || ov.Market.ID == source.ID {
			continue
		}
		gid := groupID(ov)
		if sourceGroup != 0 && gid == sourceGroup {
			continue
		}
		key := "m" + strconv.FormatInt(ov.Market.ID, 10)
		if gid != 0 {
			key = "g" + strconv.FormatInt(gid, 10)
		}
		c, ok := cards[key]
		if !ok {
			c = &card{key: key}
			cards[key] = c
			order = append(order, c)
		}
		c.members = append(c.members, ov)
		c.volume += ov.TotalVolume
		if s := sharedTags[ov.Market.ID]; s > c.shared {
			c.shared = s
		}
	}

	sort.SliceStable(order, func(i, j int) bool {
		if order[i].shared != order[j].shared {
			return order[i].shared > order[j].shared
		}
		return order[i].volume > order[j].volume
	})

	out := []*dto.MarketOverviewResponse{}
	for i, c := range order {
		if i >= limit {
			break
		}
		out = append(out, c.members...)
	}
	return RelatedMarketsResponse{Markets: out, Total: len(out)}
}

func groupID(ov *dto.MarketOverviewResponse) int64 {
	if ov == nil || ov.Market == nil || ov.Market.MarketGroup == nil {
		return 0
	}
	return ov.Market.MarketGroup.ID
}
