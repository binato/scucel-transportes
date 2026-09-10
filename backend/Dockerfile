# ─── Estágio único de produção ────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Dependências de sistema mínimas
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependências Python (inclui psycopg2 para PostgreSQL)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código-fonte
COPY . .

EXPOSE 8000

# Aguardar saúde do banco antes de subir (handled via depends_on no compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
