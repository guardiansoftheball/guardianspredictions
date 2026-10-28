package marketshandlers

import (
	"testing"

	"socialpredict/handlers/markets/dto"
)

func relatedOverview(id, group, volume int64) *dto.MarketOverviewResponse {
	m := &dto.MarketResponse{ID: id}
	if group != 0 {
		m.MarketGroup = &dto.MarketGroupLink{ID: group}
	}
	return &dto.MarketOverviewResponse{Market: m, TotalVolume: volume}
}

func TestPickRelated_ExcludesSourceAndItsGroup(t *testing.T) {
	overviews := []*dto.MarketOverviewResponse{
		relatedOverview(1, 9, 0),  // source, group 9
		relatedOverview(2, 9, 50), // sibling in the same group
		relatedOverview(3, 0, 10),
	}

	got := pickRelated(overviews, map[int64]int{}, 4)

	if got.Total != 1 || got.Markets[0].Market.ID != 3 {
		t.Fatalf("expected only market 3, got %+v", got.Markets)
	}
}

func TestPickRelated_RanksBySharedTagsThenVolume(t *testing.T) {
	overviews := []*dto.MarketOverviewResponse{
		relatedOverview(1, 0, 0),
		relatedOverview(2, 0, 500), // no shared tags, high volume
		relatedOverview(3, 0, 10),  // shares a tag
		relatedOverview(4, 0, 20),  // shares a tag
	}

	got := pickRelated(overviews, map[int64]int{3: 1, 4: 1}, 4)

	want := []int64{4, 3, 2}
	if got.Total != len(want) {
		t.Fatalf("expected %d markets, got %d", len(want), got.Total)
	}
	for i, id := range want {
		if got.Markets[i].Market.ID != id {
			t.Fatalf("position %d: expected market %d, got %d", i, id, got.Markets[i].Market.ID)
		}
	}
}

func TestPickRelated_LimitCountsGroupsOnceAndKeepsAllChildren(t *testing.T) {
	overviews := []*dto.MarketOverviewResponse{
		relatedOverview(1, 0, 0),
		relatedOverview(2, 7, 100),
		relatedOverview(3, 7, 100),
		relatedOverview(4, 7, 100),
		relatedOverview(5, 0, 50),
	}

	got := pickRelated(overviews, map[int64]int{}, 1)

	if got.Total != 3 {
		t.Fatalf("expected the 3 children of group 7, got %d", got.Total)
	}
	for _, ov := range got.Markets {
		if groupID(ov) != 7 {
			t.Fatalf("unexpected market %d outside group 7", ov.Market.ID)
		}
	}
}
