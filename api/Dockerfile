# HomeOps API container. Build context: ./api
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Hosts (Render/Fly/etc.) provide $PORT. Run migrations, then serve.
ENV PORT=8000
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
