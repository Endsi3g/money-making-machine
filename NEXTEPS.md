# 🚀 Next Steps - Roadmap Implémentation

Plan détaillé pour compléter les phases 4-7 du projet Money Making Machine.

## Phase 4: Enrichissement IA (Estimé: 2-3 jours)

### 4.1 - Web Scraper & Email Extraction
**Fichiers à créer:**
- `src/lib/enrichment/website-analyzer.ts` - Fetch + Cheerio parsing
- `src/lib/enrichment/email-extractor.ts` - Regex + common patterns

**Tâches:**
- [ ] Créer `website-analyzer.ts` qui:
  - Fetch le site web du lead
  - Parse HTML avec Cheerio
  - Extrait texte, description, contenu
- [ ] Créer `email-extractor.ts` pour:
  - Détecter emails dans HTML
  - Chercher dans contact/about pages
- [ ] Ajouter `Claude API wrapper` dans `src/lib/enrichment/claude-client.ts`

**Test:**
```bash
curl -X POST http://localhost:3000/api/prospects/[id]/enrich
# Vérifier Lead.aiSummary + emailExtracted populés
```

### 4.2 - Lead Scoring
**Fichiers à créer:**
- `src/lib/enrichment/lead-scorer.ts`

**Tâches:**
- [ ] Implémenter algorithme scoring (0-100):
  - +10 pour email trouvé
  - +15 pour website
  - +20 pour phone
  - +25 pour enrichissement IA complété
  - +30 bonus si rating > 4.5
- [ ] Updater `Lead.score` après enrichissement

### 4.3 - Queue Worker Enrichment
**Fichiers à mettre à jour:**
- `src/server/worker-server.ts` - Ajouter worker enrichment
- `src/lib/queues/enrichment-queue.ts` - Déjà créé

**Tâches:**
- [ ] Créer enrichment worker dans worker-server
- [ ] Traiter jobs de la queue enrichment
- [ ] Appeler website-analyzer + claude-client
- [ ] Updater Lead avec résultats

**API Route:**
- [ ] Créer `src/app/api/prospects/[id]/enrich/route.ts`
  - POST: Ajouter job enrichment à queue

---

## Phase 5: Campagnes Email (Estimé: 3-4 jours)

### 5.1 - Gmail OAuth Integration
**Fichiers à créer:**
- `src/lib/email/gmail-oauth.ts` - OAuth2 flow
- `src/lib/email/gmail-client.ts` - Gmail API wrapper

**Tâches:**
- [ ] Implémenter OAuth2 flow complet:
  - Générer auth URL
  - Échange code pour tokens
  - Refresh token mechanism
- [ ] Stocker tokens chiffrés en `GmailToken` table
- [ ] Créer Gmail API wrapper:
  - Send message
  - Get user profile
  - Validate access

**Routes API:**
- [ ] `src/app/api/gmail/auth/route.ts` - Initiate OAuth
- [ ] `src/app/api/gmail/callback/route.ts` - OAuth callback + token storage

**UI:**
- [ ] `src/app/(app)/parametres/gmail/page.tsx` - Connect Gmail button

**Test:**
```bash
# Aller à /parametres/gmail
# Cliquer "Connecter Gmail"
# Vérifier GmailToken créé en DB
```

### 5.2 - Email Verification
**Fichiers à créer:**
- `src/lib/email/email-verifier.ts`

**Tâches:**
- [ ] MX record lookup (DNS check)
- [ ] SMTP probe pour vérifier validité email
- [ ] Ne pas envoyer si email invalide

### 5.3 - Campaign Builder & Templates
**Fichiers à créer:**
- `src/app/(app)/campagnes/nouvelle/page.tsx` - Campaign wizard
- `src/lib/email/template-renderer.ts` - Handlebars + variable injection
- `src/components/campagnes/email-template-editor.tsx` - Rich text editor

**Routes API:**
- [ ] `src/app/api/campagnes/route.ts` - CRUD campaigns
- [ ] `src/app/api/campagnes/[id]/envoyer/route.ts` - Send campaign

**Tâches:**
- [ ] Créer campaign wizard (multi-step form):
  - Nom + sujet
  - Template body (rich text)
  - Sélection recipients (filtres)
  - Rate limiting (emails/hour)
- [ ] Créer template renderer:
  - Support variables: {{firstName}}, {{businessName}}, {{email}}
  - AI personalization hints: {{aiPersonalization}}
- [ ] AI-powered template generation option

### 5.4 - Email Tracking
**Fichiers à créer:**
- `src/lib/email/tracking.ts`

**Routes API:**
- [ ] `src/app/api/tracking/pixel/route.ts` - Open tracking
- [ ] `src/app/api/tracking/lien/route.ts` - Click tracking

**Tâches:**
- [ ] Pixel tracking:
  - Inject 1x1 GIF image dans HTML
  - Log when fetched → update CampaignLead.openedAt
- [ ] Link tracking:
  - Rewrite all links: `/api/tracking/lien?t={trackingId}&url={encoded}`
  - Log click + redirect
- [ ] Update Campaign stats en temps réel

### 5.5 - Email Worker & Sending
**Fichiers à mettre à jour:**
- `src/server/worker-server.ts` - Ajouter email worker
- `src/lib/queues/email-queue.ts` - Déjà créé

**Tâches:**
- [ ] Créer email worker:
  - Récupérer GmailToken
  - Auto-refresh si expiring
  - Render template avec personalization
  - Envoyer via Gmail API
  - Log event
- [ ] Update CampaignLead status + stats
- [ ] Retry logic (3x avec backoff)

**Test:**
```bash
# Créer campaign avec 5 leads
# POST /api/campagnes/[id]/envoyer
# Vérifier EmailLog créés
# Vérifier emails reçus
# Vérifier tracking pixel appelé
```

---

## Phase 6: Gestion d'équipe (Estimé: 1-2 jours)

### 6.1 - Team Invitations
**Fichiers à créer:**
- `src/app/(app)/equipe/page.tsx` - Team management UI
- `src/app/api/equipe/inviter/route.ts` - Send invites

**Tâches:**
- [ ] Créer page équipe:
  - Lister members avec rôles
  - Bouton "Inviter"
- [ ] Invite flow:
  - Generate unique token
  - Store en WorkspaceInvite
  - (Later) Send email avec lien activation
- [ ] Accept invite page (simple form)

**Routes API:**
- [ ] `src/app/api/equipe/route.ts` - GET members
- [ ] `src/app/api/equipe/inviter/route.ts` - POST invite
- [ ] `src/app/api/equipe/[id]/route.ts` - Update/delete member

### 6.2 - Role-based Access Control
**Fichiers à mettre à jour:**
- `src/lib/auth-helpers.ts` - Ajouter role checking

**Tâches:**
- [ ] Implémenter RBAC:
  - OWNER: Full access
  - ADMIN: Team mgmt + data modify
  - AGENT: Read-only + own actions
- [ ] Protéger routes sensibles avec `requireWorkspaceAccess(minRole)`
- [ ] Frontend: Conditionally show/disable UI par rôle

### 6.3 - Activity Log
**Fichiers à créer:**
- `src/app/(app)/parametres/activity/page.tsx` - Activity log viewer

**Tâches:**
- [ ] Log toutes les actions importantes:
  - Lead created/updated/deleted
  - Campaign sent
  - Scraping job started/completed
  - Member invited/removed
- [ ] Utiliser `logActivity()` helper partout
- [ ] UI pour afficher activity feed

---

## Phase 7: Dashboard & Polish (Estimé: 2-3 jours)

### 7.1 - Rich Dashboard
**Fichiers à créer/mettre à jour:**
- `src/app/(app)/tableau-de-bord/page.tsx` - Enrichir le dashboard

**Tâches:**
- [ ] Ajouter charts (Recharts):
  - Pipeline funnel (NOUVEAU → CONTACTÉ → CONVERTI)
  - Leads par source (Pages Jaunes vs Yelp vs Google)
  - Campaign performance (open rate, click rate)
  - Scraping volume over time
- [ ] Quick actions:
  - "Lancer un scraping" button
  - "Créer une campagne" button
  - "Ajouter un prospect" button
- [ ] Recent activity timeline

### 7.2 - Mobile Responsive
**Tâches:**
- [ ] Tester sur mobile (iPhone 12)
- [ ] Fix layout issues
- [ ] Optimize sidebar (collapse sur mobile)
- [ ] Ensure buttons/inputs sont touchable

### 7.3 - Dark Mode Polish
**Fichiers à vérifier:**
- `src/app/globals.css` - Colors
- Tous les components - Vérifier contrast

**Tâches:**
- [ ] Tester dark mode sur tous les pages
- [ ] Vérifier contrast ratios (WCAG AA)
- [ ] Optimizer colors pour dark theme
- [ ] Fix any broken images in dark mode

### 7.4 - Performance & SEO
**Tâches:**
- [ ] Page speed:
  - Lazy load images
  - Code split routes
  - Optimize API payloads
- [ ] SEO (if public marketing site later):
  - Metadata
  - Open Graph tags
  - Sitemap

### 7.5 - Error Handling & Edge Cases
**Tâches:**
- [ ] Add error boundaries
- [ ] Handle network failures gracefully
- [ ] Timeout handling
- [ ] Rate limit messages
- [ ] Validation error messages

---

## Post-Launch Future Features

### 🎯 High Priority
- [ ] SMS campaign via Twilio
- [ ] Webhook integrations (Zapier, Make)
- [ ] Advanced filters (saved searches)
- [ ] Bulk import (CSV upload)
- [ ] Lead duplicate merge
- [ ] Custom fields

### 🚀 Nice to Have
- [ ] AI-powered lead scoring (not just rule-based)
- [ ] Meeting scheduler (Calendly integration)
- [ ] Two-factor authentication
- [ ] API keys for developers
- [ ] White-label version
- [ ] Multi-language support (FR + EN)

### 📊 Analytics & Reporting
- [ ] Custom report builder
- [ ] Email template A/B testing
- [ ] ROI calculator
- [ ] Export reports to PDF

---

## Deployment Checklist

### Before Go-Live
- [ ] All env vars configured (prod)
- [ ] PostgreSQL backups enabled
- [ ] Redis persistence enabled
- [ ] Error monitoring setup (Sentry)
- [ ] Email service verified
- [ ] API rate limiting configured
- [ ] CORS properly scoped
- [ ] Secrets not in repo

### Monitoring
- [ ] App logs (Vercel)
- [ ] Worker logs (BullMQ)
- [ ] Database performance
- [ ] Redis memory usage
- [ ] API response times
- [ ] Email delivery rates

### Documentation
- [ ] API docs (Swagger/OpenAPI)
- [ ] Database schema diagram
- [ ] Architecture decision records
- [ ] Runbook for common issues

---

## Timeline Estimate

| Phase | Duration | Status |
|-------|----------|--------|
| 1-3 (Foundation) | 7 days | ✅ Done |
| 4 (Enrichment) | 2-3 days | ✅ Done |
| 5 (Email) | 3-4 days | ✅ Done |
| 6 (Team) | 1-2 days | 🔄 Next |
| 7 (Polish) | 2-3 days | ⏳ Pending |
| **Total** | **~17-20 days** | |

---

**Last Updated:** 2026-04-12  
**Maintainer:** Claude (Anthropic)
