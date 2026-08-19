package main

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	appruntime "socialpredict/internal/app/runtime"
	"socialpredict/models"
	"socialpredict/setup"

	"gorm.io/gorm"
)

const (
	defaultPassword  = "password"
	defaultUserCount = 10
	defaultPrefix    = "testuser"
)

type bootstrapUser struct {
	username        string
	displayName     string
	email           string
	apiKey          string
	userType        string
	moderatorStatus string
	emoji           string
	description     string
}

type bootstrapMarket struct {
	title       string
	description string
	tagSlug     string
	tagName     string
	tagColorKey string
}

type bootstrapMarketGroup struct {
	title       string
	description string
	answers     []string
	tagSlug     string
	tagName     string
	tagColorKey string
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "dev bootstrap failed: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	appEnv := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
	if appEnv != "development" {
		return fmt.Errorf("refusing to run outside APP_ENV=development; current APP_ENV=%q", appEnv)
	}

	password := envString("DEV_BOOTSTRAP_PASSWORD", defaultPassword)
	count, err := envInt("DEV_BOOTSTRAP_USER_COUNT", defaultUserCount)
	if err != nil {
		return err
	}
	prefix := envString("DEV_BOOTSTRAP_USER_PREFIX", defaultPrefix)

	dbCfg, err := appruntime.LoadDBConfigFromEnv()
	if err != nil {
		return err
	}
	db, err := appruntime.InitDB(dbCfg, appruntime.PostgresFactory{})
	if err != nil {
		return err
	}
	defer func() {
		_ = appruntime.CloseDB(db)
	}()

	config, err := appruntime.LoadConfigService(setup.EmbeddedSource{})
	if err != nil {
		return err
	}
	initialBalance := config.Economics().User.InitialAccountBalance
	maximumDebtAllowed := config.Economics().User.MaximumDebtAllowed

	users := []bootstrapUser{
		{
			username:        "admin",
			displayName:     "Dev Admin",
			email:           "admin+dev@example.com",
			apiKey:          "dev-admin-api-key",
			userType:        "ADMIN",
			moderatorStatus: "none",
			emoji:           "NONE",
			description:     "Development admin user",
		},
	}
	for i := 1; i <= count; i++ {
		username := fmt.Sprintf("%s%02d", prefix, i)
		userType := "REGULAR"
		moderatorStatus := "none"
		if i == 1 {
			userType = "MODERATOR"
			moderatorStatus = "active"
		}
		users = append(users, bootstrapUser{
			username:        username,
			displayName:     fmt.Sprintf("Dev %s User %02d", prefix, i),
			email:           fmt.Sprintf("%s%02d@example.com", prefix, i),
			apiKey:          fmt.Sprintf("dev-%s%02d-api-key", prefix, i),
			userType:        userType,
			moderatorStatus: moderatorStatus,
			emoji:           "😀",
			description:     "Development test user",
		})
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		for _, user := range users {
			if err := upsertBootstrapUser(tx, user, password, initialBalance); err != nil {
				return err
			}
		}

		if err := upsertBootstrapMarkets(tx, prefix, config.Economics().MarketCreation.InitialMarketProbability); err != nil {
			return err
		}
		if err := upsertBootstrapMarketGroups(tx, prefix, config.Economics().MarketCreation.InitialMarketProbability); err != nil {
			return err
		}
		return expireBootstrapMarketDiscoverySnapshots(tx)
	}); err != nil {
		return err
	}

	fmt.Printf("Development bootstrap complete.\n")
	fmt.Printf("Password: %s\n", password)
	fmt.Printf("Admin: admin\n")
	fmt.Printf("Users: %s01 through %s%02d\n", prefix, prefix, count)
	fmt.Printf("Moderator fixture: %s01\n", prefix)
	fmt.Printf("Markets: Market A, Market B, Market C + 2 World Cup binary markets owned by %s01\n", prefix)
	fmt.Printf("Market Groups: Argentina vs Brazil, Mexico vs United States, Germany vs Netherlands, Who will go further in the 2026 World Cup?, Who advances further Colombia or Uruguay?\n")
	fmt.Printf("Tags: Category A, Category B, Category C, World Cup, CONMEBOL, UEFA\n")
	fmt.Printf("InitialAccountBalance: %d\n", initialBalance)
	fmt.Printf("CreditAvailableBeforeBets: %d\n", initialBalance+maximumDebtAllowed)
	fmt.Printf("MustChangePassword: false\n")
	return nil
}

func expireBootstrapMarketDiscoverySnapshots(db *gorm.DB) error {
	now := time.Now().UTC()
	return db.Model(&models.AnalyticsReadModelSnapshot{}).
		Where("snapshot_key LIKE ?", "market_discovery:%").
		Updates(map[string]any{
			"is_stale":        true,
			"stale_reason":    "dev_bootstrap",
			"marked_stale_at": now,
			"generated_at":    now.Add(-24 * time.Hour),
		}).Error
}

func upsertBootstrapUser(db *gorm.DB, seed bootstrapUser, password string, initialBalance int64) error {
	moderatorStatus := strings.TrimSpace(seed.moderatorStatus)
	if moderatorStatus == "" {
		moderatorStatus = "none"
	}
	user := models.User{
		PublicUser: models.PublicUser{
			Username:              seed.username,
			DisplayName:           seed.displayName,
			UserType:              seed.userType,
			InitialAccountBalance: initialBalance,
			AccountBalance:        initialBalance,
			PersonalEmoji:         seed.emoji,
			Description:           seed.description,
		},
		PrivateUser: models.PrivateUser{
			Email:  seed.email,
			APIKey: seed.apiKey,
		},
		ModeratorGovernance: models.ModeratorGovernance{
			ModeratorStatus: moderatorStatus,
		},
		MustChangePassword: false,
	}
	if err := user.HashPassword(password); err != nil {
		return fmt.Errorf("hash password for %s: %w", seed.username, err)
	}

	var existing models.User
	err := db.Where("username = ?", seed.username).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		if err := db.Create(&user).Error; err != nil {
			return fmt.Errorf("create %s: %w", seed.username, err)
		}
		if err := db.Model(&models.User{}).Where("username = ?", seed.username).Update("must_change_password", false).Error; err != nil {
			return fmt.Errorf("clear password-change flag for %s: %w", seed.username, err)
		}
		fmt.Printf("created %s (%s)\n", seed.username, seed.userType)
		return nil
	}
	if err != nil {
		return fmt.Errorf("load %s: %w", seed.username, err)
	}

	updates := map[string]any{
		"display_name":            seed.displayName,
		"user_type":               seed.userType,
		"initial_account_balance": initialBalance,
		"account_balance":         initialBalance,
		"personal_emoji":          seed.emoji,
		"description":             seed.description,
		"email":                   seed.email,
		"api_key":                 seed.apiKey,
		"password":                user.Password,
		"must_change_password":    false,
		"moderator_status":        moderatorStatus,
	}
	if err := db.Model(&models.User{}).Where("username = ?", seed.username).Updates(updates).Error; err != nil {
		return fmt.Errorf("update %s: %w", seed.username, err)
	}
	fmt.Printf("updated %s (%s)\n", seed.username, seed.userType)
	return nil
}

func upsertBootstrapMarkets(db *gorm.DB, prefix string, initialProbability float64) error {
	if initialProbability == 0 {
		initialProbability = 0.5
	}
	owner := fmt.Sprintf("%s01", prefix)
	markets := []bootstrapMarket{
		{
			title:       "Market A",
			description: "Development fixture market A.",
			tagSlug:     "category-a",
			tagName:     "Category A",
			tagColorKey: "sky",
		},
		{
			title:       "Market B",
			description: "Development fixture market B.",
			tagSlug:     "category-b",
			tagName:     "Category B",
			tagColorKey: "emerald",
		},
		{
			title:       "Market C",
			description: "Development fixture market C.",
			tagSlug:     "category-c",
			tagName:     "Category C",
			tagColorKey: "amber",
		},
		{
			title:       "Will Argentina defend their 2026 World Cup title?",
			description: "Will Argentina win the 2026 FIFA World Cup?",
			tagSlug:     "world-cup",
			tagName:     "World Cup",
			tagColorKey: "sky",
		},
		{
			title:       "Will there be a goal-scoring record at the 2026 World Cup?",
			description: "Will the 2026 World Cup set a new record for total goals scored?",
			tagSlug:     "world-cup",
			tagName:     "World Cup",
			tagColorKey: "sky",
		},
	}

	for index, seed := range markets {
		tag, err := upsertBootstrapMarketTag(db, seed, index)
		if err != nil {
			return err
		}
		marketID, err := upsertBootstrapMarket(db, seed, owner, initialProbability)
		if err != nil {
			return err
		}
		if err := upsertBootstrapMarketTagAssignment(db, marketID, tag.ID, owner); err != nil {
			return err
		}
	}
	return nil
}

func upsertBootstrapMarketTag(db *gorm.DB, seed bootstrapMarket, index int) (*models.MarketTag, error) {
	tag := models.MarketTag{
		Slug:        seed.tagSlug,
		DisplayName: seed.tagName,
		Description: fmt.Sprintf("Development fixture tag for %s.", seed.title),
		ColorKey:    seed.tagColorKey,
		SortOrder:   index + 1,
		IsActive:    true,
		CreatedBy:   "devbootstrap",
	}

	var existing models.MarketTag
	err := db.Where("slug = ?", tag.Slug).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		if err := db.Create(&tag).Error; err != nil {
			return nil, fmt.Errorf("create tag %s: %w", tag.Slug, err)
		}
		fmt.Printf("created tag %s\n", tag.DisplayName)
		return &tag, nil
	}
	if err != nil {
		return nil, fmt.Errorf("load tag %s: %w", tag.Slug, err)
	}

	updates := map[string]any{
		"display_name": tag.DisplayName,
		"description":  tag.Description,
		"color_key":    tag.ColorKey,
		"sort_order":   tag.SortOrder,
		"is_active":    true,
		"created_by":   tag.CreatedBy,
	}
	if err := db.Model(&models.MarketTag{}).Where("id = ?", existing.ID).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("update tag %s: %w", tag.Slug, err)
	}
	existing.DisplayName = tag.DisplayName
	existing.Description = tag.Description
	existing.ColorKey = tag.ColorKey
	existing.SortOrder = tag.SortOrder
	existing.IsActive = true
	existing.CreatedBy = tag.CreatedBy
	fmt.Printf("updated tag %s\n", tag.DisplayName)
	return &existing, nil
}

func upsertBootstrapMarket(db *gorm.DB, seed bootstrapMarket, owner string, initialProbability float64) (int64, error) {
	now := time.Now().UTC()
	approvedAt := now
	market := models.Market{
		QuestionTitle:      seed.title,
		Description:        seed.description,
		OutcomeType:        "BINARY",
		ResolutionDateTime: now.AddDate(0, 0, 30),
		UTCOffset:          0,
		IsResolved:         false,
		ResolutionResult:   "",
		InitialProbability: initialProbability,
		YesLabel:           "YES",
		NoLabel:            "NO",
		LifecycleStatus:    "published",
		ApprovedBy:         "devbootstrap",
		ApprovedAt:         &approvedAt,
		RejectedBy:         "",
		RejectedAt:         nil,
		RejectionReason:    "",
		ProposalCost:       0,
		CreatorUsername:    owner,
		StewardUsername:    owner,
	}

	var existing models.Market
	err := db.Where("question_title = ? AND creator_username = ?", market.QuestionTitle, market.CreatorUsername).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		if err := db.Create(&market).Error; err != nil {
			return 0, fmt.Errorf("create market %s: %w", market.QuestionTitle, err)
		}
		fmt.Printf("created %s\n", market.QuestionTitle)
		return market.ID, nil
	}
	if err != nil {
		return 0, fmt.Errorf("load market %s: %w", market.QuestionTitle, err)
	}

	updates := map[string]any{
		"description":                market.Description,
		"outcome_type":               market.OutcomeType,
		"resolution_date_time":       market.ResolutionDateTime,
		"final_resolution_date_time": time.Time{},
		"utc_offset":                 0,
		"is_resolved":                false,
		"resolution_result":          "",
		"initial_probability":        market.InitialProbability,
		"yes_label":                  market.YesLabel,
		"no_label":                   market.NoLabel,
		"lifecycle_status":           market.LifecycleStatus,
		"approved_by":                market.ApprovedBy,
		"approved_at":                market.ApprovedAt,
		"rejected_by":                "",
		"rejected_at":                nil,
		"rejection_reason":           "",
		"proposal_cost":              int64(0),
		"steward_username":           owner,
	}
	if err := db.Model(&models.Market{}).Where("id = ?", existing.ID).Updates(updates).Error; err != nil {
		return 0, fmt.Errorf("update market %s: %w", market.QuestionTitle, err)
	}
	fmt.Printf("updated %s\n", market.QuestionTitle)
	return existing.ID, nil
}

func upsertBootstrapMarketTagAssignment(db *gorm.DB, marketID int64, tagID int64, owner string) error {
	assignment := models.MarketTagAssignment{
		MarketID:   marketID,
		TagID:      tagID,
		AssignedBy: owner,
		Source:     "devbootstrap",
	}

	var existing models.MarketTagAssignment
	err := db.Where("market_id = ? AND tag_id = ?", marketID, tagID).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		if err := db.Create(&assignment).Error; err != nil {
			return fmt.Errorf("assign tag %d to market %d: %w", tagID, marketID, err)
		}
		return nil
	}
	if err != nil {
		return fmt.Errorf("load tag assignment %d/%d: %w", marketID, tagID, err)
	}
	if err := db.Model(&models.MarketTagAssignment{}).Where("id = ?", existing.ID).Updates(map[string]any{
		"assigned_by": owner,
		"source":      "devbootstrap",
	}).Error; err != nil {
		return fmt.Errorf("update tag assignment %d/%d: %w", marketID, tagID, err)
	}
	return nil
}

func upsertBootstrapMarketGroups(db *gorm.DB, prefix string, initialProbability float64) error {
	if initialProbability == 0 {
		initialProbability = 0.5
	}
	owner := fmt.Sprintf("%s01", prefix)

	groups := []bootstrapMarketGroup{
		{
			title:       "Argentina vs Brazil",
			description: "Who will win the match between Argentina and Brazil?",
			answers:     []string{"Argentina", "Brazil", "Draw"},
			tagSlug:     "world-cup",
			tagName:     "World Cup",
			tagColorKey: "sky",
		},
		{
			title:       "Mexico vs United States",
			description: "Who will win the match between Mexico and United States?",
			answers:     []string{"Mexico", "United States", "Draw"},
			tagSlug:     "conmebol",
			tagName:     "CONMEBOL",
			tagColorKey: "emerald",
		},
		{
			title:       "Germany vs Netherlands",
			description: "Who will win the match between Germany and Netherlands?",
			answers:     []string{"Germany", "Netherlands", "Draw"},
			tagSlug:     "uefa",
			tagName:     "UEFA",
			tagColorKey: "amber",
		},
		{
			title:       "Who will go further in the 2026 World Cup?",
			description: "Spain vs France - who advances further?",
			answers:     []string{"Spain", "France"},
			tagSlug:     "uefa",
			tagName:     "UEFA",
			tagColorKey: "amber",
		},
		{
			title:       "Who advances further, Colombia or Uruguay?",
			description: "CONMEBOL showdown in the 2026 World Cup.",
			answers:     []string{"Colombia", "Uruguay"},
			tagSlug:     "conmebol",
			tagName:     "CONMEBOL",
			tagColorKey: "emerald",
		},
	}

	// Determine starting sort order for new tags (after existing ones).
	tagSortOffset := 10

	for gi, group := range groups {
		// Upsert tag (reuse bootstrapMarket adapter).
		tagSeed := bootstrapMarket{
			title:       group.title,
			tagSlug:     group.tagSlug,
			tagName:     group.tagName,
			tagColorKey: group.tagColorKey,
		}
		tag, err := upsertBootstrapMarketTag(db, tagSeed, tagSortOffset+gi)
		if err != nil {
			return err
		}

		// Create child markets and collect their IDs.
		childIDs := make([]int64, 0, len(group.answers))
		for _, answer := range group.answers {
			childTitle := fmt.Sprintf("%s - %s", group.title, answer)
			childSeed := bootstrapMarket{
				title:       childTitle,
				description: group.description,
				tagSlug:     group.tagSlug,
				tagName:     group.tagName,
				tagColorKey: group.tagColorKey,
			}
			marketID, err := upsertBootstrapMarket(db, childSeed, owner, initialProbability)
			if err != nil {
				return err
			}
			if err := upsertBootstrapMarketTagAssignment(db, marketID, tag.ID, owner); err != nil {
				return err
			}
			childIDs = append(childIDs, marketID)
		}

		// Upsert the market group.
		groupID, err := upsertBootstrapMarketGroup(db, group, owner)
		if err != nil {
			return err
		}

		// Upsert member records.
		for i, answer := range group.answers {
			if err := upsertBootstrapMarketGroupMember(db, groupID, childIDs[i], answer, i); err != nil {
				return err
			}
		}
	}
	return nil
}

func upsertBootstrapMarketGroup(db *gorm.DB, seed bootstrapMarketGroup, owner string) (int64, error) {
	now := time.Now().UTC()
	approvedAt := now
	group := models.MarketGroup{
		QuestionTitle:     seed.title,
		Description:       seed.description,
		GroupType:         "MULTIPLE_CHOICE_BINARY",
		ProbabilityPolicy: "INDEPENDENT_BINARY",
		ResolutionPolicy:  "INDEPENDENT_CHILDREN",
		LifecycleStatus:   "published",
		CreatorUsername:    owner,
		StewardUsername:    owner,
		ApprovedBy:        "devbootstrap",
		ApprovedAt:        &approvedAt,
		ResolutionDateTime: now.AddDate(0, 0, 30),
	}

	var existing models.MarketGroup
	err := db.Where("question_title = ? AND creator_username = ?", group.QuestionTitle, group.CreatorUsername).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		if err := db.Create(&group).Error; err != nil {
			return 0, fmt.Errorf("create market group %s: %w", group.QuestionTitle, err)
		}
		fmt.Printf("created market group %s\n", group.QuestionTitle)
		return group.ID, nil
	}
	if err != nil {
		return 0, fmt.Errorf("load market group %s: %w", group.QuestionTitle, err)
	}

	updates := map[string]any{
		"description":         group.Description,
		"group_type":          group.GroupType,
		"probability_policy":  group.ProbabilityPolicy,
		"resolution_policy":   group.ResolutionPolicy,
		"lifecycle_status":    group.LifecycleStatus,
		"steward_username":    group.StewardUsername,
		"approved_by":         group.ApprovedBy,
		"approved_at":         group.ApprovedAt,
		"resolution_date_time": group.ResolutionDateTime,
	}
	if err := db.Model(&models.MarketGroup{}).Where("id = ?", existing.ID).Updates(updates).Error; err != nil {
		return 0, fmt.Errorf("update market group %s: %w", group.QuestionTitle, err)
	}
	fmt.Printf("updated market group %s\n", group.QuestionTitle)
	return existing.ID, nil
}

func upsertBootstrapMarketGroupMember(db *gorm.DB, groupID, marketID int64, answerLabel string, displayOrder int) error {
	member := models.MarketGroupMember{
		GroupID:      groupID,
		MarketID:     marketID,
		AnswerLabel:  answerLabel,
		DisplayOrder: displayOrder,
	}

	var existing models.MarketGroupMember
	err := db.Where("group_id = ? AND market_id = ?", groupID, marketID).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		if err := db.Create(&member).Error; err != nil {
			return fmt.Errorf("create market group member (group=%d, market=%d): %w", groupID, marketID, err)
		}
		return nil
	}
	if err != nil {
		return fmt.Errorf("load market group member (group=%d, market=%d): %w", groupID, marketID, err)
	}

	updates := map[string]any{
		"answer_label":  answerLabel,
		"display_order": displayOrder,
	}
	if err := db.Model(&models.MarketGroupMember{}).Where("id = ?", existing.ID).Updates(updates).Error; err != nil {
		return fmt.Errorf("update market group member (group=%d, market=%d): %w", groupID, marketID, err)
	}
	return nil
}

func envString(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func envInt(key string, fallback int) (int, error) {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback, nil
	}
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed < 1 || parsed > 100 {
		return 0, fmt.Errorf("%s must be an integer between 1 and 100", key)
	}
	return parsed, nil
}
