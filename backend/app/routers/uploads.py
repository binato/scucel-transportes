import os
import uuid
from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter(prefix="/api/uploads", tags=["Comprovantes"])
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_BYTES = 5 * 1024 * 1024
EXTENSIONS = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


@router.post("/comprovante")
async def upload_comprovante(file: UploadFile = File(...)):
    if file.content_type not in EXTENSIONS:
        raise HTTPException(400, "Envie uma imagem JPEG, PNG ou WebP")
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Imagem acima de 5 MB")
    signatures = {
        "image/jpeg": data.startswith(b"\xff\xd8\xff"),
        "image/png": data.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/webp": data.startswith(b"RIFF") and data[8:12] == b"WEBP",
    }
    if not signatures[file.content_type]:
        raise HTTPException(400, "Conteúdo de imagem inválido")
    filename = f"{uuid.uuid4().hex}{EXTENSIONS[file.content_type]}"
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as output:
        output.write(data)
    return {"url": f"/uploads/{filename}"}
