# Deploying HomeOps for untethered iPhone testing

Goal: run the app on your iPhone **without** it being plugged in or your Mac
running Metro. That means (1) host the backend, and (2) install a standalone
build on the phone.

> iOS note: installing a standalone app on a physical iPhone (TestFlight or
> ad-hoc internal distribution) requires an **Apple Developer Program**
> membership ($99/yr). A free Apple ID only supports 7-day cable installs.

## 1. Host the backend

The repo includes `api/Dockerfile` and a `render.yaml` blueprint. On boot the
container runs `alembic upgrade head`, then serves on `$PORT`. `DATABASE_URL`
is normalized to the psycopg3 driver automatically, so any plain
`postgresql://` connection string works as-is.

### Free path — Render (API) + Neon (Postgres), ~$0

Render's free web service is enough to run the API; use a free **Neon**
database (it doesn't expire the way Render's free Postgres does).

1. **Create the database.** Sign up at [neon.tech](https://neon.tech), create a
   project, and copy its Postgres connection string (looks like
   `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`).
   If migrations ever hang, use Neon's **direct** connection string (the host
   without `-pooler`) rather than the pooled one.
2. **Deploy the API.** Push this repo to GitHub, then in Render:
   **New → Blueprint**, select the repo. When prompted, paste the Neon string
   into the `DATABASE_URL` env var (it is `sync:false`, so it is set in the
   dashboard, not committed).
3. **Seed demo data** (optional): open the service **Shell** in Render and run
   `python -m app.seed`.
4. Note the public URL, e.g. `https://homeops-api.onrender.com`, and verify
   `GET /health` returns `{"status":"ok",...}`.

> Caveat: the free Render service **sleeps after ~15 min idle**, so the first
> request after a nap takes ~50s to wake, then it's fast.

### Always-warm path — Railway, ~$5/mo

If the cold start bugs you, Railway runs the same Dockerfile with no idle
spindown: create a project from the repo, add a Postgres plugin (it sets
`DATABASE_URL` for you), and deploy. Fly.io and Azure Container Apps work the
same way with this Dockerfile.

## 2. Build the app and install it on the iPhone

The hosted API URL is baked into the build via `EXPO_PUBLIC_API_URL` in
`eas.json` — **replace the `REPLACE-WITH-YOUR-API` placeholder** in all three
profiles with your Render URL first.

```bash
cd mobile
npm i -g eas-cli
eas login
eas init            # links/creates the EAS project (writes the project id)

# Standalone build that runs WITHOUT Metro or a cable:
eas build --profile preview --platform ios
```

`eas build` provisions signing for you (it will ask to register your device or
log in to your Apple Developer account). When it finishes, EAS gives you a QR
code / install link — open it on the iPhone to install the app over the air.
From then on the app runs on its own and talks to your hosted backend.

For broader testing, use `--profile production` and `eas submit` to push to
**TestFlight** instead.

## 3. First run

The app auto-creates an empty "My Home" on first launch. If you seeded the
backend (step 1.4), you'll instead see the **Davidsonville House** demo with
rooms, devices, an overdue filter task, and low-stock salt.

## Iterating later

- JS-only changes can ship to an existing build without rebuilding via
  `eas update` (set up EAS Update first).
- For fast local iteration on a Mac with a cable, a dev build still works:
  `eas build --profile development --platform ios` then
  `npx expo start --dev-client`.
