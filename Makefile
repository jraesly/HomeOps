.PHONY: db-up db-down api mobile test

db-up:
	docker compose up -d

db-down:
	docker compose down

api:
	cd api && uvicorn app.main:app --reload

mobile:
	cd mobile && npx expo start

test:
	cd api && pytest