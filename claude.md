# 🤖 Claude Development Context

## Project Overview

**Money Making Machine** is a production-ready SaaS platform for automated lead generation and email campaign management targeting Quebec-based agencies. It combines web scraping from Pages Jaunes, Yelp, and Google Maps with AI-powered enrichment and personalized email outreach.

**Repository:** `endsi3g/money-making-machine`  
**Active Branch:** `claude/lead-generation-app-dfRmD`  
**Status:** Foundation complete (Phases 1-3), ready for Phases 4-7 implementation

---

## Tech Stack Quick Reference

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 14 + React + TypeScript |
| **Backend** | Next.js API Routes + Node.js |
| **Database** | PostgreSQL 15 + Prisma ORM |
| **Jobs** | BullMQ + Redis 7 |
| **Scraping** | Playwright + Cheerio |
| **Auth** | NextAuth.js v4 + Google OAuth |
| **AI** | Anthropic Claude API |
| **Email** | Gmail API + OAuth2 |
| **UI** | Tailwind CSS + shadcn/ui + next-themes |
| **Validation** | Zod |

---

## Critical Architecture Decisions

### 1. Worker Process Isolation
BullMQ workers run in a **separate Node.js process** (`src/server/worker-server.ts`), never in Next.js serverless functions. This is required for:
- Playwright browser automation (heavy memory footprint)
- Long-running jobs (scraping can take 10+ minutes)
- Persistent connections to Redis

**How to run:** Open two terminals:
```bash
npm run dev:app          # Terminal 1: Next.js frontend + API routes
npm run dev:worker       # Terminal 2: Standalone worker server
```

### 2. Multi-Tenant Isolation
Every data model has a `workspaceId` foreign key. The `requireWorkspaceAccess()` middleware verifies ownership on every API request:
```typescript
// Every API route must start with:
const { workspaceId } = await requireWorkspaceAccess(req, "OWNER"); // or ADMIN/AGENT
```

### 3. Deduplication Strategy
Leads are deduplicated via:
- **Redis SET fingerprint:** SHA-256 of `businessName.toLowerCase() + city.toLowerCase()`
- **Secondary check:** Phone number matching within same city
- **30-day TTL** on Redis keys to prevent stale fingerprints

### 4. Real-time Scraping Progress
Progress updates flow: `Worker` → `Redis pub/sub` → `SSE API route` → `Browser via SWR`

The `/api/scraping/[id]/progress` endpoint uses `ReadableStream` to push events every 2-5 seconds.

### 5. Email Tracking
- **Opens:** Unique `<img>` pixel injected in email body → `GET /api/tracking/pixel?t={trackingId}`
- **Clicks:** All links rewritten to `/api/tracking/lien?t={trackingId}&url={encodedUrl}` → 302 redirect
- Each `CampaignLead` has a unique `trackingId` for attribution

### 6. Gmail OAuth Token Storage
OAuth2 tokens are stored encrypted in `GmailToken` table using **AES-256-GCM**:
```typescript
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const encrypted = cipher.update(token, 'utf8', 'hex') + cipher.final('hex');
```
Tokens auto-refresh 5 minutes before expiration.

---

## Development Workflow

### Before Starting Work
1. **Check the plan:** Review `/root/.claude/plans/unified-drifting-metcalfe.md` for architecture details
2. **Read the docs:**
   - `README.md` — Feature overview and setup instructions
   - `NEXTEPS.md` — Detailed task list for each phase
   - This file (`claude.md`) — Context and critical decisions

### Code Quality Standards
- **Type Safety:** Strict TypeScript (`tsconfig.json` strict mode enabled)
- **Validation:** Zod schemas for all API inputs
- **Error Handling:** Try/catch in workers, graceful failures in API routes
- **Logging:** Use `console.log()` for worker logs, `logActivity()` helper for audit trail
- **Testing:** No unit tests required; focus on end-to-end validation

### Database Changes
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name {description}`
3. Migration auto-applies to local DB
4. For production: prepare migration file before deploying

### Adding New Fields to Leads
Example: Adding `customField: String?` to Lead model
```prisma
model Lead {
  // ... existing fields
  customField String?
  // ... rest of model
}
```
Then migrate: `npx prisma migrate dev --name add_custom_field_to_lead`

---

## Folder Structure & Responsibilities

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Public login/signup pages
│   ├── (app)/              # Authenticated pages (protected by middleware)
│   └── api/                # API routes (MUST check workspaceId)
│
├── lib/                    # Core utilities
│   ├── scrapers/           # Scraping implementations (never in API routes)
│   ├── enrichment/         # AI enrichment (Claude API)
│   ├── email/              # Gmail OAuth, email sending, tracking
│   ├── queues/             # BullMQ queue definitions
│   ├── workers/            # Job processors (run in separate process)
│   ├── auth-helpers.ts     # CRITICAL: requireWorkspaceAccess() middleware
│   ├── prisma.ts           # Singleton Prisma client
│   └── redis.ts            # Redis client factory
│
├── components/             # React components
│   ├── ui/                 # shadcn/ui primitives (auto-generated)
│   ├── layout/             # Sidebar, header, theme
│   ├── [feature]/          # Feature-specific components
│   └── shared/             # Reusable across features
│
├── types/                  # TypeScript definitions
│   ├── index.ts            # Re-exports all types
│   └── next-auth.d.ts      # Extended NextAuth types
│
└── server/
    ├── worker-server.ts    # STANDALONE process - initializes workers
    └── sse-manager.ts      # Redis pub/sub → SSE bridge (if needed)
```

---

## Running Locally

### 1. Environment Setup
```bash
cp .env.example .env.local
# Fill in all required variables (see README.md for details)
```

### 2. Database & Redis
```bash
# PostgreSQL must be running
# Redis must be running
redis-cli ping  # Should return PONG

# Create schema and seed data
npx prisma migrate dev
npm run db:seed
```

### 3. Development Servers
```bash
# Terminal 1: Next.js app + API routes
npm run dev:app

# Terminal 2: BullMQ worker server (in parallel)
npm run dev:worker
```

Visit `http://localhost:3000` and login with:
- **Email:** `admin@monagence.ca`
- **Password:** `admin123`

---

## Common Tasks & How To Do Them

### Adding an API Route
1. Create file: `src/app/api/[feature]/[action]/route.ts`
2. Start with authentication check:
   ```typescript
   import { requireWorkspaceAccess } from "@/lib/auth-helpers";
   
   export async function POST(req: Request) {
     const { workspaceId } = await requireWorkspaceAccess(req, "ADMIN");
     // ... rest of handler
   }
   ```
3. Use Zod for input validation
4. Return `NextResponse.json()` with proper status codes

### Creating a Queue Worker
1. Define the queue in `src/lib/queues/[feature]-queue.ts`
2. Implement processor in `src/lib/workers/[feature]-worker.ts`
3. Register in `src/server/worker-server.ts`:
   ```typescript
   createWorker('queue-name', processor, { defaultJobOptions });
   ```

### Publishing Progress Updates
Use in worker for real-time updates:
```typescript
await redis.publish(`scraping:${jobId}`, JSON.stringify({
  status: "EN_COURS",
  progress: 45,
  message: "Scraped 450 leads..."
}));
```

### Testing Email Sending Locally
Gmail OAuth won't work in local dev (requires HTTPS redirect). For testing:
1. Create dummy `GmailToken` in DB
2. Use Nodemailer's test account (provided in README)
3. Check emails at `https://ethereal.email`

---

## Debugging Tips

### Worker Not Starting
1. Check Redis is running: `redis-cli ping`
2. Check worker logs in Terminal 2
3. Verify `DATABASE_URL` and `REDIS_URL` in `.env.local`

### Scraping Hangs
1. Check Playwright browser pool size (default: 3 concurrent browsers)
2. Monitor RAM usage (each browser ~100MB headless)
3. Check rate limiter not being too aggressive

### API Route Returns 403
1. Verify `requireWorkspaceAccess()` is being called
2. Check `session?.user?.workspaceId` exists in NextAuth session
3. Ensure JWT secret hasn't changed

### Database Migration Fails
1. Check no running `prisma generate` or other Prisma processes
2. Verify PostgreSQL is running and `DATABASE_URL` is correct
3. Roll back with `npx prisma migrate resolve --rolled-back {migration-name}`

---

## Next Phase: Enrichment (Phase 4)

When starting Phases 4-7 implementation:

1. **Review NEXTEPS.md** — Each phase has detailed file list and tasks
2. **Claude API Integration:** 
   - Create `src/lib/enrichment/claude-client.ts` with prompt engineering
   - Use structured outputs for consistent AI responses
3. **Website Analysis:**
   - `src/lib/enrichment/website-analyzer.ts` — Fetch + Cheerio parsing
   - Extract text, description, company structure
4. **Lead Scoring:**
   - `src/lib/enrichment/lead-scorer.ts` — Rule-based 0-100 score
   - Factor in: email found, website quality, AI analysis, ratings
5. **Worker Integration:**
   - Add enrichment worker to `src/server/worker-server.ts`
   - Process jobs from enrichment queue
   - Update Lead records with `aiSummary` and `score`

---

## Production Deployment Checklist

- [ ] All env vars configured in hosting platform
- [ ] PostgreSQL backups enabled
- [ ] Redis persistence enabled (Appendonly)
- [ ] Error monitoring (Sentry/LogRocket)
- [ ] Email rate limiting configured
- [ ] CORS properly scoped (no wildcard *)
- [ ] Secrets rotated (NEXTAUTH_SECRET, GMAIL_ENCRYPTION_KEY)
- [ ] Database indexes created (`EXPLAIN ANALYZE` queries)
- [ ] BullMQ worker deployed as separate dyno/service
- [ ] SSL certificate configured
- [ ] Analytics enabled (tracking pixel + email events)

---

## Getting Help

- **Architecture Questions:** Read `README.md` Architecture section
- **Implementation Tasks:** Check `NEXTEPS.md` phase breakdown
- **Code Patterns:** Search existing components in `src/components/` for examples
- **Database Schema:** View `prisma/schema.prisma` for data model
- **Type Definitions:** Check `src/types/` for TypeScript interfaces

---

**Last Updated:** 2026-04-12  
**Maintainer:** Claude (Anthropic)  
**Status:** Phases 1-3 complete ✅ | Phases 4-7 ready to implement 🚀
