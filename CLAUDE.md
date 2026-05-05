# Server & Infrastructure Notes

## Linux Home Server (almari)
- Production repo: `~/home_server/playground` (main branch)
- Staging repo: `~/home_server/staging` (staging branch)
- OS: Linux

## Docker
- Compose file lives in the production repo folder
- Containers: `playground-nginx-1`, `playground-nginx-staging-1`, `playground-cloudflared-1`, `playground-umami-1`, `playground-umami-db-1`, `playground-jobhunt-1`

## Cloudflare
- Tunnel name: `home-server`
- Tunnel ID: `7152d93c-b09b-48c3-b7f2-13ea67e2a60e`
- Production hostname: `saniajamil.com → http://nginx:80`
- Staging hostname: `staging.saniajamil.com → http://nginx-staging:80`
- Analytics hostname: `analytics.saniajamil.com → http://umami:3000`

## Job Hunt App — "naukri" (naukri.almari)
- Local-only, not exposed via Cloudflare
- Frontend: React 19 + Vite 8 (rolldown) + TypeScript 6 — `apps/jobhunt/client/`
- Backend: Express + Node.js (node:sqlite, no ORM) — `apps/jobhunt/server/`
- DB: SQLite, persisted in Docker volume `jobhunt-data`
- Routed via traefik on almari (`traefik-public` network, labels in `docker-compose.yml`) directly to `jobhunt:3001` — no nginx hop
- Hostname: `naukri.almari` → add `<almari-LAN-IP> naukri.almari` to `/etc/hosts` on each local machine (not `127.0.0.1` — traefik runs on almari)
- HTTPS via the local `*.almari` self-signed wildcard cert; trust `/opt/almari/repo/stacks/traefik/certs/rootCA.pem` once
- API ingest endpoint: `POST https://naukri.almari/api/jobs` (for scraper integration)

### Design system
- Pakistani truck-art aesthetic: terracotta, teal, saffron palette
- 4 themes (Dark·Vault, Warm·Bazaar, Light·Parchment, Dusk·Charagh) — runtime-switched via ThemeContext, persisted in localStorage
- Colors in oklch() for perceptual uniformity
- Inline styles with theme objects (not Tailwind classes) — lets SVG motifs receive color props directly
- Motifs: Medallion (phool), OrnamentStrip (triangle bands), SnowFloral, TriangleBand — `src/components/motifs.tsx`
- Font: Geist Mono Variable

### Known gotchas

**Vite 8 / rolldown — CRITICAL**
Rolldown enforces strict ES module named exports at runtime. TypeScript interfaces and type aliases compile away to nothing, so importing them as values causes a silent blank page:
- **Always use `import type { Foo }` for interfaces, type aliases, and enums**
- Never use inline `import('...').TypeName` in type positions — rolldown treats it as a runtime dynamic import
- Affects: `api/index.ts`, `pages/Board.tsx`, `pages/Docs.tsx`, `lib/rung/engine.ts`, `lib/rung/ai.ts`, etc.

**Docker / tsc strict mode vs local dev**
The Dockerfile runs `tsc` with full strictness. Local `vite dev` is more lenient. Known issues hit in production build:
- `node:sqlite` `.get()` returns `Record<string, SQLOutputValue> | undefined` — cast via `as unknown as YourType`, not directly
- `Array.reduce` on typed union arrays (e.g. `PlayerIndex[]`) — always annotate the accumulator: `reduce<number>(..., 0)`
- SQLite booleans are `0 | 1` integers, not `boolean` — match your form state types accordingly (e.g. `is_default: 0` not `false`)
- Discriminated union property access — use `'prop' in obj` guard, not `obj.prop ?? fallback`

### Feature: Rupee wallet
- Earn ₨ by doing job-hunt actions (log job +10, advance status +15, interview +50, offer +200)
- Daily check-in bonus with streak multiplier: 1× (1–2 days), 1.5× (3–6 days), 2× (7+ days)
- Single-row wallet table (id=1) in SQLite — `server/src/routes/wallet.ts`
- Context: `src/context/WalletContext.tsx` — exposes `earn(action)`, `settle(bet, won)`, `toast`
- Toast: bottom-right slideUp, shows breakdown (action + daily bonus)

### Feature: Rung card game
- Full Pakistani Rung (4-player 2v2 trick-taking): You vs 3 rule-based AI bots
- Zero API cost — deterministic rule-based AI (`src/lib/rung/ai.ts`)
- Bet ₨ before each game; win → +bet, lose → -bet (via `POST /api/wallet/rung`)
- Files: `src/lib/rung/cards.ts`, `engine.ts`, `ai.ts`, `src/components/rung/CardView.tsx`, `src/pages/Rung.tsx`
- 4 screens: Bet → Call Rung (pick trump) → Play → Result

### API routes
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/wallet` | Balance, streak, multiplier |
| POST | `/api/wallet/earn` | Award rupees for job-hunt action |
| POST | `/api/wallet/rung` | Settle rung bet (win/lose) |
| POST | `/api/jobs` | Ingest job from scraper |
| GET | `/api/jobs` | List jobs with filters |
| PUT | `/api/jobs/:id` | Update job (status change, etc.) |
| GET | `/api/stats` | Dashboard stats |
| GET/POST | `/api/documents` | CV / cover letter docs |
| GET/POST | `/api/cv-versions` | CV version history |

### Roadmap
**Phase 1 — Polish (next)**
- [ ] Rung: better table layout, animate card plays, show last trick
- [ ] Rung: AI trump-calling should also consider void suits (defensive play)
- [ ] Wallet: show history of earnings in a log panel
- [ ] Dashboard: streak graph / activity heatmap

**Phase 2 — Low friction capture**
- [ ] Browser extension: right-click any job posting → save to naukri (sends to `POST /api/jobs`)
- [ ] Extension fills: company, title, URL, auto-detects location from page text
- [ ] Quick-add modal accessible via keyboard shortcut

**Phase 3 — Intelligence**
- [ ] AI cover letter draft: paste JD → get tailored draft referencing your CV versions
- [ ] Job match score: compare JD keywords against your skills
- [ ] Weekly digest email: activity summary, streak status, upcoming follow-ups

**Phase 4 — Expose externally (optional)**
- [ ] Auth (single-user password or passkey) before exposing via Cloudflare
- [ ] Mobile-friendly layout for on-the-go logging

### Dev (local Mac)
```bash
# Terminal 1 — server on :3001
cd apps/jobhunt/server && npm run dev

# Terminal 2 — client on :5173 (proxied to :3001)
cd apps/jobhunt/client && npm run dev
```

### Deploy to almari
```bash
# From local Mac — push, pull on server, rebuild container
git push origin main
ssh almari "cd ~/home_server/playground && git pull && docker compose up -d --build jobhunt"

# Reload nginx if nginx.conf changed
ssh almari "docker exec playground-nginx-1 nginx -s reload"
```

> **Access**: add `<almari-LAN-IP> naukri.almari` to `/etc/hosts` on each local machine, then visit https://naukri.almari

## Common commands
```bash
# Restart nginx after config change
docker exec playground-nginx-1 nginx -s reload

# Bring up all containers
cd ~/home_server/playground
docker compose up -d

# Rebuild jobhunt after code change
docker compose up -d --build jobhunt

# Check logs
docker logs playground-nginx-1 --tail 20
docker logs playground-cloudflared-1 --tail 10
docker logs playground-umami-1 --tail 20
docker logs playground-jobhunt-1 --tail 20
```
