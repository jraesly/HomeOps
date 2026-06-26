.PHONY: db-up db-down migrate seed openapi api mobile test

db-up:
	docker compose up -d

db-down:
	docker compose down

migrate:
	cd api && alembic upgrade head

seed:
	cd api && python -m app.seed

# Dump the OpenAPI schema, then regenerate the mobile API types from it.
openapi:
	cd api && python -c "from app.main import app; import json; open('openapi.json','w').write(json.dumps(app.openapi()))"
	cd mobile && npm run generate:api

api:
	cd api && uvicorn app.main:app --reload

mobile:
	cd mobile && npx expo start

test:
	cd api && pytest