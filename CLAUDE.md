# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SocialPredict** is an open-source prediction market platform. Users create and trade on binary/multi-choice markets using an LMSR (Logarithmic Market Scoring Rule) pricing mechanism.

## Development Commands

### Local Setup
```bash
./SocialPredict install    # First-time setup (choose Development, rebuild .env and images)
./SocialPredict up         # Start all containers
./SocialPredict down       # Stop all containers
./SocialPredict dev-bootstrap-users   # Seed test users/markets (dev only, requires APP_ENV=development)
```

Default dev credentials: `admin` / `password` at `localhost`

### Backend (Go)
```bash
cd backend && go test ./...        # Run all tests
cd backend && go test ./path/...   # Run tests in a specific package
```
The backend uses Air for hot-reload in dev (`backend/.air.toml`).

### Frontend (Node/React)
```bash
cd frontend && npm start           # Dev server (Vite, port 5173)
cd frontend && npm run build       # Production build
```
Requires Node >= 21.0.0.

### Logs & Debugging
```bash
./SocialPredict logs <service>     # Logs for a specific service
./SocialPredict logs options       # Show available service names
./SocialPredict logs all           # Logs from all containers
```

### Database Access
```bash
docker exec -it -e PGPASSWORD=password socialpredict-postgres-container psql -U user -d socialpredict_db
```
Reset dev database: `./SocialPredict down` → `rm -rf ./data/postgres/*` → `./SocialPredict up`

## Architecture

### Stack
- **Backend**: Go + Gorilla Mux + GORM (PostgreSQL) — port 8080
- **Frontend**: React 18 + Vite + Tailwind CSS — port 5173
- **Database**: PostgreSQL 16 (Alpine)
- **Reverse Proxy**: Nginx (port 80/443)
- **Orchestration**: Docker Compose (`scripts/docker-compose-dev.yaml` for dev)

### Backend Structure (`backend/`)
```
main.go                    # Entry point
server/server.go           # HTTP server, routing, middleware registration
handlers/                  # HTTP handlers by domain (admin, bets, markets, users, cms, stats...)
internal/
  domain/                  # Core business logic (markets, bets, math, users, analytics)
  repository/              # Data access layer (GORM queries)
  app/
    env/                   # Environment config loading
    runtime/               # DB init, service setup
    readmodelinvalidation/ # Cache invalidation
  service/
    auth/                  # JWT token management
    config/                # Configuration service (econConfig)
models/                    # GORM model definitions (DB schema)
migration/                 # Database migrations
docs/openapi.yaml          # API specification (served at /swagger/)
```

### Frontend Structure (`frontend/src/`)
```
App.jsx                    # Root component with React Router routes
config.js                  # API endpoint configuration
api/                       # Fetch wrappers for backend API
components/                # Reusable components (organized by domain)
pages/                     # Full-page route components
hooks/                     # Custom React hooks
helpers/ utils/            # Utility functions
```

### Request Flow
HTTP Request → Nginx → Go handler (handlers/) → domain logic (internal/domain/) → repository (internal/repository/) → PostgreSQL

Read-heavy paths use cached read-models (internal/readmodels/) that are invalidated on writes.

## Key Conventions

### Backend (Go)

**Handlers are strictly HTTP-layer**: A "handler" only means a function that responds to an HTTP request (the first function called when an API endpoint is hit). Do not name other functions "handlers."

**Handler pattern** — inject `db` and services via closure:
```go
func SomeHandler(db *gorm.DB, svc SomeService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) { ... }
}
```

**Public vs. Private user data**: Never return raw DB model structs in API responses. Use explicit `PublicUserType`-style structs with dedicated retrieval functions to prevent sensitive field leakage.

**Every handler should define its own response struct** to pre-designate what is included in the response.

**All monetary transactions start as integers** — no floats for bet amounts. Mathematical conventions handle fractional points downstream.

**Time-based validation must happen server-side** — never trust client-supplied time.

**32-bit compatibility (Convention CONV-32BIT-001)**: When converting `uint64` to `uint`, always validate the value fits:
```go
if valueUint64 > uint64(^uint(0)) {
    return errors.New("value exceeds allowed range for uint platform type")
}
valueUint := uint(valueUint64)
```
Search `"Convention CONV-32BIT-001"` to find all implementations.

**Stateless by design**: The system aims to derive state from the bet ledger rather than maintaining mutable state. User balances may be cached but should be verifiable ab initio.

### Frontend (React)
- Routing via React Router v5
- Styling via Tailwind CSS utility classes
- Charts use Chart.js, Recharts, and D3 depending on the component

## Configuration

Copy `.env.example` to `.env` before running. Key config areas:
- `APP_ENV` — must be `development` for dev-only features
- `setup.yaml` — initial user balances and economic parameters (configure before first install)
- `backend/docs/openapi.yaml` — canonical API spec

## Additional Documentation

Detailed docs live in `README/`:
- `README-CONVENTIONS.md` — coding conventions (authoritative source)
- `LOCAL_SETUP.md` — full local setup guide
- `MATH/` — LMSR pricing math and market flow documentation
- `PRODUCTION-NOTES/` — deep-dives on 14 production concerns
- `PRODUCTION-NOTES/FEATURES/` — feature design and planning docs
