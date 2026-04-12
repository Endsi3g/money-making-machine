# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development — both must run simultaneously
npm run dev:app          # Next.js app + API routes (port 3000)
npm run dev:worker       # BullMQ worker process (separate Node.js process)
npm run dev              # Both via concurrently

# Build & quality
npm run build
npm run lint
npm run format           # Prettier

# Database
npx prisma migrate dev --name <description>   # Schema change + migration
npm run db:push          # Push schema without migration (quick dev iteration)
npm run db:seed          # Seed with test data (admin@monagence.ca / admin123)
npm run db:studio        # Prisma Studio GUI
npm run db:generate      # Regenerate Prisma client after schema change

# First-time Playwright setup
npx playwright install
```

## Architecture

### Worker/App Process Split

BullMQ workers run in a **separate Node.js process** (`src/server/worker-server.ts`), never inside Next.js. This is required because Playwright browsers are memory-heavy and scraping jobs can run 10+ minutes — both incompatible with serverless functions. All scraping and enrichment logic lives in `src/lib/workers/` and is registered in `worker-server.ts`.

### Multi-Tenant Access Control

Every Prisma model has a `workspaceId` FK. Every API route must call `requireWorkspaceAccess()` from `src/lib/auth-helpers.ts`:

```typescript
// Correct usage — workspaceId comes from URL params or request body:
const { error, session, membership } = await requireWorkspaceAccess(workspaceId, "ADMIN");
if (error) return error; // returns NextResponse 401/403

// Role hierarchy: OWNER (3) > ADMIN (2) > AGENT (1)
```

A user can belong to multiple workspaces, so workspaceId is **not** read from the session — it must come from the request.

### Queue/Worker Pattern

1. Queue definition: `src/lib/queues/[feature]-queue.ts`
2. Processor: `src/lib/workers/[feature]-worker.ts`
3. Register in `src/server/worker-server.ts`

Publish real-time progress from workers:
```typescript
await redis.publish(`scraping:${jobId}`, JSON.stringify({ status: "EN_COURS", progress: 45 }));
```
This flows: Worker → Redis pub/sub → `/api/scraping/[id]/progress` (SSE `ReadableStream`) → Browser via SWR.

### Lead Deduplication

Scraping workers deduplicate via Redis SET: SHA-256 of `businessName.toLowerCase() + city.toLowerCase()` with 30-day TTL. Secondary check on phone number within city.

### Email Tracking

- **Opens:** 1×1 GIF at `GET /api/tracking/pixel?t={trackingId}` → sets `CampaignLead.openedAt`
- **Clicks:** All links rewritten to `/api/tracking/lien?t={trackingId}&url={encoded}` → 302 redirect

### Gmail OAuth Token Storage

Tokens stored AES-256-GCM encrypted in `GmailToken` table (one per workspace). Auto-refresh 5 minutes before expiration. Requires `GMAIL_ENCRYPTION_KEY` env var (32-byte hex).

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/auth-helpers.ts` | `requireWorkspaceAccess()`, `logActivity()` — used by every API route |
| `src/lib/prisma.ts` | Singleton Prisma client |
| `src/lib/redis.ts` | Redis client factory |
| `src/server/worker-server.ts` | Registers all BullMQ workers; entry point for `dev:worker` |
| `prisma/schema.prisma` | Full data model |
| `NEXTEPS.md` | Detailed task breakdown for phases 4-7 |

## Data Model

Lead pipeline: `NOUVEAU → ENRICHI → CONTACTE → REPONDU → CONVERTI → ARCHIVE`

Sources: `PAGES_JAUNES | YELP | GOOGLE_MAPS | MANUEL | IMPORT`

AI enrichment fields on `Lead`: `aiSummary`, `aiPersonalization`, `emailExtracted`, `enrichedAt`, `score` (0-100 rule-based).

## Current Status

Phases 1-3 complete (auth, lead CRUD, scraping pipeline, BullMQ queues, dashboard, multi-tenant). Phases 4-7 (AI enrichment, email campaigns, team management, polish) are documented in `NEXTEPS.md`.

### Phase 4 entry points (AI Enrichment — next to implement)
- Create `src/lib/enrichment/website-analyzer.ts` (Cheerio parsing)
- Create `src/lib/enrichment/claude-client.ts` (Anthropic SDK wrapper)
- Create `src/lib/enrichment/lead-scorer.ts` (rule-based 0-100)
- Add enrichment worker to `src/server/worker-server.ts`
- Create `src/app/api/prospects/[id]/enrich/route.ts`
