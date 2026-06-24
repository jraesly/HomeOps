# HomeOps

HomeOps is a mobile-first home operations app for tracking rooms, devices/assets, recurring maintenance, service logs, consumables, documents, warranties, and eventually AI-backed household knowledge.

## Stack

### Mobile

- React Native
- Expo
- TypeScript

### Backend

- Python
- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic

## MVP Loop

Create Home
  → Add Room
    → Add Device
      → Add Recurring Task
        → Complete Task
          → Auto-create Maintenance Log
            → Auto-generate Next Due Date
              → Dashboard Updates

## Local Development

### Start Database

```bash
docker compose up -d
```

### Backend (FastAPI)

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Apply database migrations
alembic upgrade head

# Run the API (http://localhost:8000, docs at /docs)
uvicorn app.main:app --reload
```

The backend reads its database URL from `DATABASE_URL` (defaults to the local
Docker Compose Postgres). Phase 1 skips authentication: every home is owned by a
fixed seeded test user.

### Run the tests

```bash
cd api
source .venv/bin/activate
pytest
```

Tests run against an in-memory SQLite database, so Postgres does not need to be
running.

### Mobile (Expo)

```bash
cd mobile
npx expo start
```

## API (Phase 1)

The backend implements the full Phase 1 maintenance loop:

- `Homes`, `Areas`, `Rooms`, `Devices` CRUD
- `MaintenanceTask` CRUD plus `POST /tasks/{task_id}/complete`
- `MaintenanceLog` history (auto-created on completion, plus manual logs)
- Backend-owned recurrence engine that auto-computes the next due date
- `GET /homes/{home_id}/dashboard` with overdue / due-soon / upcoming buckets
  and a home-health score

Interactive API docs are available at `/docs` when the server is running.