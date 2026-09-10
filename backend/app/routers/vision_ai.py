import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Veiculo
from ..schemas import ExtracaoIaResponse
from ..services.ai_vision import parse_image_with_ai

router = APIRouter(prefix="/api/vision", tags=["Visão Computacional IA"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/extrair-foto", response_model=ExtracaoIaResponse)
async def extrair_foto_abastecimento(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo enviado deve ser uma imagem (JPEG/PNG/WebP)")

    # save file locally
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    # run vision extractor
    extracted_data = parse_image_with_ai(contents, file.content_type)
    extracted_data["foto_url"] = f"/uploads/{filename}"

    # check if detected plate matches any existing vehicle in database
    if extracted_data.get("placa_detectada"):
        placa_clean = extracted_data["placa_detectada"].strip().upper()
        v = db.query(Veiculo).filter(Veiculo.placa == placa_clean).first()
        if v:
            extracted_data["placa_detectada"] = v.placa

    return extracted_data

@router.get("/carregar-amostra", response_model=ExtracaoIaResponse)
def carregar_foto_amostra(db: Session = Depends(get_db)):
    # Look for Planilha-Motorista.jpeg in assets or root
    base_backend = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    possible_paths = [
        os.path.join(base_backend, "assets", "Planilha-Motorista.jpeg"),
        os.path.join(os.path.dirname(base_backend), "Planilha-Motorista.jpeg"),
        "c:\\Users\\binato\\Documents\\AGATHA\\SCUCEL\\Planilha-Motorista.jpeg"
    ]
    sample_path = None
    for p in possible_paths:
        if os.path.exists(p):
            sample_path = p
            break

    if sample_path and os.path.exists(sample_path):
        # copy to uploads
        dest = os.path.join(UPLOAD_DIR, "amostra-motorista.jpeg")
        shutil.copy(sample_path, dest)
        with open(sample_path, "rb") as f:
            data = f.read()
        res = parse_image_with_ai(data, "image/jpeg")
        res["foto_url"] = "/uploads/amostra-motorista.jpeg"
        return res
    else:
        raise HTTPException(status_code=404, detail="Arquivo Planilha-Motorista.jpeg não encontrado")
