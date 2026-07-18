# Production Deployment Guide — Render + Supabase

This guide takes Kirana Konnect from this repository to a publicly available,
production application:

- **Supabase** — Postgres database, phone-OTP authentication, file storage
- **Render** — hosts the Express API server (and optionally the web build)
- **Expo / EAS** — builds the installable Android/iOS app users download

> **Read this first — where the project stands today.**
> The mobile app currently runs entirely on **mock data** stored on the device
> (`artifacts/kirana-konnect/context/AppContext.tsx`), the API server exposes
> only a health check (`/api/healthz`), and the database schema
> (`lib/db/src/schema/`) is empty. Deploying to Render + Supabase gives you
> real production **infrastructure**, but the app will not behave differently
> for users until the backend work in [Section 7](#7-what-must-be-built-before-real-users)
> is done. Deploy the infrastructure first (Sections 1–3), then build against
> it — that is the right order.

## Architecture

```
┌─────────────────────┐        ┌──────────────────────┐
│  Expo app (Android/ │ HTTPS  │  Render Web Service  │
│  iOS/Web)           ├───────▶│  Express API server  │
│  EXPO_PUBLIC_API_URL│        │  artifacts/api-server│
└─────────┬───────────┘        └──────────┬───────────┘
          │                               │ DATABASE_URL (TLS)
          │ Supabase JS SDK               ▼
          │ (Auth OTP, Storage)  ┌──────────────────────┐
          └──────────────────────▶  Supabase            │
                                 │  Postgres + Auth +   │
                                 │  Storage + RLS       │
                                 └──────────────────────┘
```

---

## 1. Supabase — database, auth, storage

### 1.1 Create the project

1. Sign up at [supabase.com](https://supabase.com) and create a project
   (choose a region close to your users — `ap-south-1` (Mumbai) for India).
2. Save the **database password** you set here; you'll need it for the
   connection string and it is only shown once.

### 1.2 Get the connection string

> This project is already created: `oxekfjyvboccekwjafcq`
> (https://oxekfjyvboccekwjafcq.supabase.co). The app's Supabase client
> (`artifacts/kirana-konnect/utils/supabase.ts`) is pre-configured with its
> URL and publishable key.

In the Supabase dashboard, click **Connect** (top bar) and copy the
**Transaction pooler** URI (port `6543`):

```
postgresql://postgres.oxekfjyvboccekwjafcq:<PASSWORD>@aws-1-<region>.pooler.supabase.com:6543/postgres
```

- **Do NOT use the "Direct connection" string**
  (`db.oxekfjyvboccekwjafcq.supabase.co:5432`) for Render. Direct connections
  are **IPv6-only** on Supabase, and Render's outbound network is IPv4 — the
  server would fail with `ENETUNREACH`/timeout. The poolers are
  IPv4-compatible.
- Use the **Transaction pooler (6543)** for the API server — it handles many
  short-lived connections well, which matches how `pg` Pool + Drizzle work here.
- Use the **Session pooler (5432)** when running migrations (`drizzle-kit`),
  which needs session-level features.
- The server code (`lib/db/src/index.ts`) enables TLS automatically when
  `NODE_ENV=production`; set `DATABASE_SSL=false` only against a local
  Postgres.

### 1.3 Create and migrate the schema

Define your tables in `lib/db/src/schema/` (one file per table, exported from
`index.ts` — the file documents the expected pattern). Then push the schema:

```bash
# From the repo root, using the SESSION pooler (port 5432) string:
DATABASE_URL="postgresql://postgres.oxekfjyvboccekwjafcq:<PASSWORD>@aws-1-<region>.pooler.supabase.com:5432/postgres" \
  pnpm --filter @workspace/db run push
```

`drizzle-kit push` is fine while iterating. Before real users, switch to
generated migration files (`drizzle-kit generate` + `drizzle-kit migrate`) so
schema changes are versioned, reviewable, and reversible.

**About the Supabase CLI** (`supabase login` / `init` / `link`): linking the
CLI is useful for managing Auth/Storage config and generating types, but it is
**not required** for this repo's workflow — the database schema is owned by
Drizzle (`lib/db`), not by Supabase CLI migrations. If you do use both, treat
Drizzle as the single source of truth for tables and don't create tables
through the CLI or dashboard, or the two will drift apart.

### 1.4 Authentication (phone OTP)

The app's login screen is built around phone + OTP, which maps directly onto
**Supabase Auth phone sign-in**:

1. **Authentication → Providers → Phone**: enable it.
2. Connect an SMS provider. Supabase supports **Twilio**, **MessageBird**,
   **Vonage**, and **Textlocal**. For India, Twilio works but check DLT
   registration requirements for SMS sender IDs; many Indian apps use an
   India-focused provider via Twilio Verify.
3. In the app, install `@supabase/supabase-js` and call
   `supabase.auth.signInWithOtp({ phone })` /
   `supabase.auth.verifyOtp({ phone, token, type: "sms" })` from
   `app/login.tsx` (replacing the current mock flow).
4. The client SDK needs only `SUPABASE_URL` and the **anon key**
   (Project Settings → API) — both are safe to embed in the app as
   `EXPO_PUBLIC_` variables.
5. The API server verifies requests by validating the Supabase JWT from the
   `Authorization: Bearer` header (the API client already attaches tokens via
   `setAuthTokenGetter` in `lib/api-client-react`). Verify with the project's
   JWT secret or JWKS endpoint in an Express middleware.

### 1.5 Storage (product & shop images)

1. **Storage → New bucket**: create `product-images` and `shop-images`.
   Make them **public** buckets (read-only to the world) so image URLs work
   without signed tokens.
2. Add Storage policies so only authenticated shopkeepers can upload/delete
   in their own folder (e.g. path prefix = their shop id).
3. In the app, upload via `supabase.storage.from("product-images").upload(...)`
   using the picked image from `expo-image-picker` (already a dependency).

### 1.6 Row Level Security

Supabase exposes Postgres over its own REST API (PostgREST) using the anon
key. Even though your traffic goes through the Express server, **enable RLS on
every table** so the anon key alone can't read or write anything. The Express
server connects with the database password (bypasses RLS), so this costs you
nothing and closes a real hole.

---

## 2. Render — deploy the API server

The repo contains a [`render.yaml`](./render.yaml) Blueprint that describes the
service. Deploying is:

1. Push this branch/repo to GitHub.
2. In the Render dashboard: **New → Blueprint**, pick this repository. Render
   reads `render.yaml` and creates the `kirana-api` web service.
3. When prompted for environment variables (both are `sync: false`):
   - `DATABASE_URL` — the Supabase **Transaction pooler** string from 1.2
   - `ALLOWED_ORIGINS` — leave empty for now; set it once you know your web
     app's domain (comma-separated origins)
4. First deploy runs:
   - build: `pnpm install` (server packages only) + esbuild bundle
   - start: `node artifacts/api-server/dist/index.mjs`
   - health check: `GET /api/healthz` — Render only routes traffic once this
     returns 200, and it restarts the service if it stops responding.
5. Verify: `curl https://kirana-api.onrender.com/api/healthz` → `{"status":"ok"}`.

Notes:

- **Plan**: `starter` ($7/mo) is the minimum for production — the `free` plan
  spins down after idle and cold-starts take ~1 min, which is unacceptable
  behind a consumer app. Edit `plan:` in `render.yaml` if you want to test on
  free first.
- **Custom domain**: Settings → Custom Domains → add `api.yourdomain.com`;
  Render provisions TLS automatically. Then set
  `EXPO_PUBLIC_API_URL=https://api.yourdomain.com` for app builds.
- **Auto-deploy** is on: every push to the connected branch redeploys. Point
  the Blueprint at `main` and treat `main` as your release branch.
- **Secrets** live only in Render's Environment tab and Supabase — never in
  git. `.gitignore` now blocks `.env` files; `.env.example` documents every
  variable.

### 2.1 Troubleshooting a failed deploy

Work through these in order — they cover the failures in likelihood order:

1. **Wrong branch (most common).** All deployment files live on the branch
   that added them — until that branch is merged, `main` has no `render.yaml`,
   no pnpm pin, and no Supabase wiring.
   - *Blueprint*: Render reads `render.yaml` from the repo's **default
     branch** only. If it isn't on `main`, Blueprint creation fails with
     "render.yaml not found". Fix: merge the branch into `main` first.
   - *Manual web service*: check **Settings → Branch** points at a branch
     that actually contains the deployment setup.
2. **Root directory set.** Settings → Root Directory must be **empty** (repo
   root). If it's `artifacts/api-server`, the pnpm workspace install fails
   (`pnpm-lock.yaml` not found / filter matches nothing).
3. **Build log says pnpm/corepack failed.** Confirm `NODE_VERSION=24` is set
   (Environment tab). The `packageManager` field in `package.json` pins
   pnpm 10.33.0 for corepack.
4. **Build succeeded but deploy timed out.** That means the health check
   failed. Confirm Health Check Path is exactly `/api/healthz` and the start
   command is `node --enable-source-maps artifacts/api-server/dist/index.mjs`.
5. **Read the log.** Events tab → failed deploy → the last ~30 lines of the
   build/runtime log name the real cause; everything above is a pattern to
   match against it.

**Verifying Render ↔ Supabase connectivity.** The server exposes an ops
endpoint that runs a real query through `DATABASE_URL`:

```bash
curl https://<your-service>.onrender.com/api/healthz      # server up?
curl https://<your-service>.onrender.com/api/healthz/db   # database reachable?
```

`/api/healthz/db` returns `{"status":"ok","database":"connected",...}` when
Render → Supabase works, and a 503 with the underlying error message
(`DATABASE_URL must be set`, `ECONNREFUSED`, TLS errors, auth failures) when
it doesn't. Common fixes: use the **Transaction pooler** string (the direct
`db.<ref>...` host is IPv6-only and unreachable from Render), and re-check
the password inside the URL.

### 2.2 (Optional) Deploy the web version on Render

Expo can export the app for the web. Add a **Static Site** on Render:

- Build command:
  `corepack enable && pnpm install --frozen-lockfile --filter "@workspace/kirana-konnect..." && cd artifacts/kirana-konnect && EXPO_PUBLIC_API_URL=https://kirana-api.onrender.com pnpm exec expo export --platform web`
- Publish directory: `artifacts/kirana-konnect/dist`
- Add a rewrite rule `/* → /index.html` (SPA routing).

Then add the static site's URL to `ALLOWED_ORIGINS` on the API service.
Note the web build uses the grid-mock map (`MapView.web.tsx`), not real maps.

---

## 3. Point the app at production

`app/_layout.tsx` now reads `EXPO_PUBLIC_API_URL` and routes all generated API
hooks (`lib/api-client-react`) to it. For any production build:

```bash
EXPO_PUBLIC_API_URL=https://kirana-api.onrender.com   # your actual Render URL
# Optional — utils/supabase.ts already defaults to this project:
EXPO_PUBLIC_SUPABASE_URL=https://oxekfjyvboccekwjafcq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable__MTgIhGcPX5QmLFlYFWv-g_X7BsYFq2
```

Put these in EAS build profiles (`eas.json` → `build.production.env`) or the
Render static-site environment — `EXPO_PUBLIC_*` values are baked into the
bundle at build time, so a changed URL requires a rebuild.

---

## 4. Distributing the app so anyone can download it

The Expo app ships through **EAS Build** (Expo's build service, free tier
available). Build profiles are already configured in
`artifacts/kirana-konnect/eas.json`: the `preview` profile produces a
directly installable **APK**, the `production` profile produces the `.aab`
for Google Play, and both bake in `EXPO_PUBLIC_API_URL` pointing at the
deployed Render API.

```bash
cd artifacts/kirana-konnect
pnpm dlx eas-cli login    # create an account at https://expo.dev first
pnpm dlx eas-cli build --platform android --profile preview
```

The first build prompts to create the EAS project (writes `projectId` into
`app.json` — commit that change) and to generate an Android keystore (say
yes; EAS stores it). When the build finishes (~10–20 min), EAS prints a
download link + QR code for the APK — open it on any Android phone, allow
"install unknown apps", and install.

> **Maps are free — no Google key needed.** The map screen uses
> **OpenStreetMap** (Leaflet in a WebView), which requires no API key, no
> billing account, and no configuration. If traffic ever grows large,
> switch the tile URL in `components/MapView.tsx` to a dedicated free-tier
> provider (e.g. MapTiler or Stadia Maps) to respect OpenStreetMap's
> fair-use policy.

**Android (the fast path in India):**

- **Google Play (recommended)**: `eas build --platform android --profile production`
  produces an `.aab`. Create a Google Play Console account ($25 one-time),
  upload, complete the listing (privacy policy URL required), and release.
  `eas submit --platform android` automates the upload.
- **Direct APK download** (sideload, no store): the `preview` profile above.
  Host the `.apk` behind a download link on your website. Fine for early
  testing; use Play for real distribution.

**iOS:** requires an Apple Developer account ($99/yr):
`eas build --platform ios` + `eas submit --platform ios` → App Store review.
Note `react-native-maps` on iOS uses Apple Maps by default — verify the map
experience before submitting.

**Web:** the Render static site from 2.2 gives you an instant public URL —
useful as a demo/landing page while store reviews are pending.

### Building from GitHub + real-time app updates

The repo ships two GitHub Actions workflows so day-to-day releases need no
local commands at all:

- **`EAS Android Build`** (`.github/workflows/eas-build.yml`) — GitHub →
  Actions → run it manually, pick `preview` (APK) or `production`
  (Play Store AAB). The build runs on EAS; download it from
  [expo.dev](https://expo.dev) when done.
- **`EAS OTA Update`** (`.github/workflows/eas-update.yml`) — fires
  automatically whenever app code lands on `main` and publishes an
  **over-the-air update**: installed APKs download the new app code on next
  launch (`expo-updates` is configured with `checkAutomatically: ON_LOAD`).
  Users get your changes without reinstalling — like a web deploy, but for
  the native app. Native-level changes (new plugins, permissions, SDK
  upgrades) don't travel over the air: run a fresh APK build for those and
  have users install it.

**One-time setup for both workflows:**

1. Create a free account at <https://expo.dev>, then create an access token
   at <https://expo.dev/settings/access-tokens>.
2. Add it to the GitHub repo as a secret named `EXPO_TOKEN`
   (repo → Settings → Secrets and variables → Actions → New repository
   secret).

That's all — the workflows link/create the EAS project and updates
configuration automatically on every run, so no local commands are needed.
(If the automatic `eas init` step ever fails in the Actions log, the manual
fallback is `pnpm dlx eas-cli init` + `pnpm dlx eas-cli update:configure`
locally in `artifacts/kirana-konnect/`, then commit `app.json`.)

---

## 5. Production hardening checklist

Before announcing the app publicly:

- [ ] **CORS locked down** — `ALLOWED_ORIGINS` set on Render (mobile apps
      don't send an Origin header, so this only needs your web domains).
- [ ] **Auth enforced** — every non-health API route validates the Supabase
      JWT; shopkeeper routes check the user actually owns the shop.
- [ ] **RLS enabled** on all Supabase tables and storage buckets.
- [ ] **Rate limiting** — add `express-rate-limit` (OTP endpoints especially:
      SMS costs money and OTP-flooding is a common abuse vector).
- [ ] **Input validation** — parse every request body with the Zod schemas
      from `@workspace/api-zod` (generated from `lib/api-spec/openapi.yaml`).
- [ ] **Backups** — Supabase includes daily backups; enable Point-in-Time
      Recovery (Pro plan) before real order data exists.
- [ ] **Migrations** — switch from `drizzle-kit push` to versioned migrations.
- [ ] **Error tracking** — add Sentry (`@sentry/node` on the server,
      `sentry-expo` in the app).
- [ ] **Uptime monitoring** — Render's health check restarts a dead service,
      but add an external monitor (UptimeRobot/Better Stack) on
      `/api/healthz` so *you* find out.
- [ ] **Logging** — pino is already wired; Render captures stdout. Add a log
      drain (e.g. Better Stack) if you need retention/search.
- [ ] **Payments** — "UPI" in checkout is currently a label, not an
      integration. For real UPI collection use Razorpay/Cashfree/PhonePe;
      COD needs no integration.
- [ ] **Legal** — privacy policy + terms URLs (required by Play/App Store),
      and a support email.

---

## 6. Local development against the same stack

```bash
cp .env.example .env          # fill in values
pnpm install
pnpm --filter @workspace/db run push          # after defining schema
pnpm --filter @workspace/api-server run dev   # API on $PORT
cd artifacts/kirana-konnect && pnpm exec expo start   # app
```

You can point local dev at the Supabase database directly, or run Postgres
locally (`DATABASE_SSL=false`) — the code supports both.

---

## 7. What must be built before real users

Infrastructure is now the easy part; the product still needs its backend.
In dependency order:

| # | Work | Where |
|---|------|-------|
| 1 | Define the real schema: users, shops, products, orders, order_items, addresses | `lib/db/src/schema/` |
| 2 | Extend the OpenAPI spec with real endpoints (shops, products, cart/orders, shopkeeper dashboard), then `pnpm --filter @workspace/api-spec run codegen` | `lib/api-spec/openapi.yaml` |
| 3 | Implement those routes in Express with Drizzle queries + Zod validation | `artifacts/api-server/src/routes/` |
| 4 | Replace mock OTP login with Supabase Auth phone sign-in | `app/login.tsx` |
| 5 | Replace `AppContext` mock data with the generated React Query hooks (`@workspace/api-client-react`) — shops, products, orders from the API | `context/AppContext.tsx` and screens |
| 6 | Real order lifecycle: shopkeeper actions drive status (the current timeline auto-advances on a timer) | server + app |
| 7 | Image upload to Supabase Storage for inventory management | shopkeeper screens |
| 8 | Real geolocation: `expo-location` for the user, shop coordinates from the DB, distance calculated server-side | map screens + API |

The architecture documents in the repo root (`03_ARCHITECTURE.md`,
`04_IMPLEMENTATION_PLAN.md`) go deeper on each of these.
