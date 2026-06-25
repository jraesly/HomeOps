# Deploying HomeOps for untethered iPhone testing

Goal: run the app on your iPhone **without** it being plugged in or your Mac
running Metro. That means (1) host the backend, and (2) install a standalone
build on the phone.

> iOS note: installing a standalone app on a physical iPhone (TestFlight or
> ad-hoc internal distribution) requires an **Apple Developer Program**
> membership ($99/yr). A free Apple ID only supports 7-day cable installs.

## 1. Host the backend

The repo includes `api/Dockerfile` and a `render.yaml` blueprint.

**Render (easiest):**
1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, select the repo. It creates a Dockerized
   web service (`homeops-api`) + a managed Postgres database and wires
   `DATABASE_URL` automatically.
3. On boot the container runs `alembic upgrade head`, then serves on `$PORT`.
4. (Optional) Seed demo data once: open the service **Shell** in Render and run
   `python -m app.seed`.
5. Note the public URL, e.g. `https://homeops-api.onrender.com`. Verify
   `GET /health` returns `{"status":"ok",...}`.

`DATABASE_URL` is normalized to the psycopg3 driver automatically, so the
plain `postgresql://` URL Render provides works as-is.

Any Docker host works the same way (Fly.io, Railway, Azure Container Apps).

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
