# Money Making Machine 💰🤖

Écosystème complet de prospection commerciale pour automatiser la collecte de leads, leur enrichissement IA et l'envoi de campagnes email ultra-personnalisées.

## 🎯 Fonctionnalités

### ✅ Implémentées (Phase 1-3)

- **🔐 Authentification** - NextAuth avec credentials + Google OAuth
- **📊 Gestion des leads** - CRUD complet, filtres, export CSV
- **🕷️ Scraping automatisé** - Pages Jaunes.ca, Yelp.ca, Google Maps
- **🔄 File de jobs** - BullMQ + Redis pour tâches en arrière-plan
- **📝 Dashboard** - Vue d'ensemble avec stats en temps réel
- **👥 Multi-tenant** - Isolation par workspace avec rôles (Owner, Admin, Agent)

### 🚀 À implémenter (Phase 4-7)

- **🤖 Enrichissement IA** - Claude API pour analyse des sites web et génération de personnalisation
- **📧 Campagnes email** - Gmail OAuth, template personnalisés, tracking (opens/clicks)
- **👨‍💼 Gestion d'équipe** - Invitations, rôles, activity log
- **📱 SMS** - Twilio integration (placeholder)
- **✨ Polissage** - Dark mode optimisé, mobile responsive

## 🛠 Tech Stack

```
Frontend:      Next.js 14 + TypeScript + React
Styling:       Tailwind CSS + shadcn/ui + next-themes
Backend:       Next.js API Routes + Node.js
Database:      PostgreSQL + Prisma ORM
Jobs:          BullMQ + Redis
Scraping:      Playwright + Cheerio
Auth:          NextAuth.js v4 + PrismaAdapter
IA:            Anthropic Claude API
Email:         Gmail API + Nodemailer
```

## 📦 Installation

### Prérequis

- Node.js 20+ ou Bun
- PostgreSQL 15+
- Redis 7+
- Compte Google (pour OAuth)
- Clé API Anthropic Claude (pour IA)

### Setup

```bash
# Clone et dépendances
git clone https://github.com/endsi3g/money-making-machine.git
cd money-making-machine
npm install

# Variables d'environnement
cp .env.example .env.local
# Remplir les variables requises

# Database setup
npm run db:push          # Créer le schéma
npm run db:seed          # Seed avec données de test

# Démarrer (2 terminaux)
npm run dev:app          # Terminal 1: Next.js app
npm run dev:worker       # Terminal 2: BullMQ workers

# Aller à http://localhost:3000
# Connexion test: admin@monagence.ca / admin123
```

## 📖 Guide d'utilisation

### 1. Tableau de bord
Vue d'ensemble avec stats en temps réel et actions rapides.

### 2. Scraping
- Créer une tâche → Choisir source (Pages Jaunes/Yelp/Google Maps)
- Spécifier mots-clés et localisation (villes du Québec)
- Suivre la progression en temps réel
- Les leads sont dédupliqués automatiquement

### 3. Prospects
- Lister tous les leads avec filtres (statut, source, ville)
- Voir détails complets (coordonnées, réseaux sociaux, notes)
- Enrichir avec IA (analyse site web + personalization hints)
- Exporter en CSV

### 4. Campagnes (à venir)
- Créer campagnes email
- Générer templates personnalisés avec IA
- Envoyer via Gmail OAuth
- Tracker opens/clicks en temps réel

## 🏗 Architecture

```
money-making-machine/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # Pages de connexion/inscription
│   │   ├── (app)/        # App shell authentifiée
│   │   └── api/          # API routes
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui primitives
│   │   └── [feature]/    # Feature-specific components
│   ├── lib/              # Utilities + core logic
│   │   ├── queues/       # BullMQ queues setup
│   │   ├── workers/      # Job processors
│   │   ├── scrapers/     # Scraping implementations
│   │   ├── enrichment/   # AI & data enrichment
│   │   └── email/        # Email integration
│   ├── types/            # TypeScript types
│   ├── hooks/            # React hooks (SWR)
│   └── server/           # Standalone worker process
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Static assets
└── package.json
```

## 🔑 Variables d'environnement requises

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/money_making_machine

# Redis
REDIS_URL=redis://localhost:6379

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<openssl rand -base64 32>

# Google OAuth
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>

# Gmail OAuth (separate client)
GMAIL_OAUTH_CLIENT_ID=<from Google Cloud Console>
GMAIL_OAUTH_CLIENT_SECRET=<from Google Cloud Console>
GMAIL_OAUTH_REDIRECT_URI=http://localhost:3000/api/gmail/callback
GMAIL_ENCRYPTION_KEY=<openssl rand -hex 32>

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📊 Database Schema

### Modèles principaux:
- **User** - Utilisateurs avec OAuth support
- **Workspace** - Équipes/organisations isolées
- **Lead** - Prospects avec statut pipeline (NOUVEAU → ENRICHI → CONTACTÉ → RÉPONDU → CONVERTI)
- **ScrapingJob** - Tâches de scraping avec suivi d'état
- **Campaign** - Campagnes email
- **CampaignLead** - Suivi par lead (statut, tracking)
- **EmailLog** - Logs d'événements (sent, opened, clicked, etc.)
- **ActivityLog** - Audit trail

## 🔄 Processus de scraping

```
1. User crée job      → POST /api/scraping
2. Job ajouté à queue → BullMQ + Redis
3. Worker consomme    → Instancie scraper (Pages Jaunes/Yelp/Google Maps)
4. Scraper navigate   → Playwright avec rotation UA/viewport
5. Data extracted     → Dédupliqué via Redis SET (fingerprint)
6. Lead créé en DB    → Avec source + metadata
7. Progress publié    → Redis pub/sub → SSE au browser
8. Job marqué DONE    → Stats finales en DB
```

## 🤖 Architecture Multi-tenant

- Chaque workspace isolé en DB (WHERE workspaceId = ?)
- Rôles: OWNER (full access) | ADMIN (team mgmt) | AGENT (read-only)
- JWT contient workspaceId + role
- Chaque API route vérifie `requireWorkspaceAccess()`
- Activity log pour audit

## ✅ Checklist déploiement

- [ ] Configurer Google OAuth (API Console)
- [ ] Configurer Gmail OAuth (API Console + consentement)
- [ ] Générer NEXTAUTH_SECRET
- [ ] Setup PostgreSQL + Redis
- [ ] `npm run db:push` + `npm run db:seed`
- [ ] Vérifier .env.local complet
- [ ] `npm run build`
- [ ] Déployer (Vercel + separate worker dyno pour BullMQ)

## 📝 Logs & Monitoring

- Logs worker dans console
- Activity log en DB pour audit
- Email logs pour tracking
- Redis pub/sub pour events temps réel

## 🆘 Troubleshooting

### Scraping ne démarre pas
- Vérifier Redis est actif: `redis-cli ping`
- Vérifier workers tournent: `npm run dev:worker`
- Vérifier DATABASE_URL

### Erreur Playwright
- Installer browsers: `npx playwright install`
- Vérifier RAM disponible (headless Chromium ~100MB/instance)

### Emails ne s'envoient pas
- Vérifier Gmail OAuth tokens en DB
- Vérifier GMAIL_ENCRYPTION_KEY

## 📄 Licence

MIT

## 👤 Auteur

Created for lead generation automation in Quebec market (Pages Jaunes.ca, Yelp.ca, Google Maps).

---

**Next Steps:** Voir [NEXTEPS.md](./NEXTEPS.md) pour l'implémentation des phases 4-7.
