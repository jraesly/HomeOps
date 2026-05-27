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