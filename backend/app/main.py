import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base, SessionLocal
from sqlalchemy import inspect, text
from .models import Veiculo
from .routers import dashboard, abastecimentos, despesas, veiculos, uploads
from .services.excel_importer import import_excel_data

# Create database tables
Base.metadata.create_all(bind=engine)
# Small additive migration for databases created before receipt support.
with engine.begin() as connection:
    inspector = inspect(connection)
    additions = {
        "abastecimentos": {"client_id": "VARCHAR(100)"},
        "despesas": {"foto_comprovante_url": "VARCHAR(255)"},
    }
    for table, columns in additions.items():
        existing = {column["name"] for column in inspector.get_columns(table)}
        for name, definition in columns.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {definition}"))
    connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_abastecimentos_client_id ON abastecimentos (client_id)"))

app = FastAPI(
    title="Scucel Transportes API",
    description="Sistema de Controle de Consumo, Despesas & Automação para Frota Rodoviária",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Uploads directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(dashboard.router)
app.include_router(abastecimentos.router)
app.include_router(despesas.router)
app.include_router(veiculos.router)
app.include_router(uploads.router)

@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        # Check if excel file exists in assets or parent dir
        base_backend = os.path.dirname(os.path.dirname(__file__))
        possible_paths = [
            os.path.join(base_backend, "assets", "Abastecimentos - Despesas 2026.xlsx"),
            os.path.join(os.path.dirname(base_backend), "Abastecimentos - Despesas 2026.xlsx"),
            "c:\\Users\\binato\\Documents\\AGATHA\\SCUCEL\\Abastecimentos - Despesas 2026.xlsx"
        ]
        for p in possible_paths:
            if os.path.exists(p):
                import_excel_data(db, p)
                break
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Scucel Transportes API",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "Scucel Transportes API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
