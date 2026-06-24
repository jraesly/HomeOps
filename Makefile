.PHONY: db-up db-down migrate api mobile test

db-up:
	docker compose up -d

db-down:
	docker compose down

migrate:
	cd api && alembic upgrade head

api:
	cd api && uvicorn app.main:app --reload

mobile:
	cd mobile && npx expo start

test:
	cd api && pytest