from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Veiculo, Configuracao
from pydantic import BaseModel, Field
from ..schemas import VeiculoCreate, VeiculoResponse

router = APIRouter(prefix="/api/veiculos", tags=["Veículos"])

class MetaFrota(BaseModel):
    meta_km_l: float = Field(gt=0)

@router.get("/meta-frota", response_model=MetaFrota)
def get_meta_frota(db: Session = Depends(get_db)):
    setting = db.get(Configuracao, "meta_frota_km_l")
    if setting:
        return MetaFrota(meta_km_l=setting.valor)
    vehicles = db.query(Veiculo).filter(Veiculo.ativo == True).all()
    return MetaFrota(meta_km_l=sum(v.meta_km_l or 3.0 for v in vehicles) / len(vehicles) if vehicles else 3.0)

@router.put("/meta-frota", response_model=MetaFrota)
def put_meta_frota(payload: MetaFrota, db: Session = Depends(get_db)):
    setting = db.get(Configuracao, "meta_frota_km_l")
    if setting is None:
        db.add(Configuracao(chave="meta_frota_km_l", valor=payload.meta_km_l))
    else:
        setting.valor = payload.meta_km_l
    db.commit()
    return payload

@router.get("", response_model=List[VeiculoResponse])
def list_veiculos(db: Session = Depends(get_db)):
    return db.query(Veiculo).filter(Veiculo.ativo == True).order_by(Veiculo.placa).all()

@router.post("", response_model=VeiculoResponse)
def create_veiculo(payload: VeiculoCreate, db: Session = Depends(get_db)):
    exist = db.query(Veiculo).filter(Veiculo.placa == payload.placa.strip().upper()).first()
    if exist:
        raise HTTPException(status_code=400, detail="Veículo com esta placa já cadastrado")

    v = Veiculo(
        placa=payload.placa.strip().upper(),
        modelo=payload.modelo or "Caminhão Scucel",
        ano=payload.ano,
        tipo=payload.tipo or "Cavalo Mecânico",
        meta_km_l=payload.meta_km_l if payload.meta_km_l is not None else 3.00,
        ativo=payload.ativo if payload.ativo is not None else True
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return v

@router.put("/{id}", response_model=VeiculoResponse)
def update_veiculo(id: int, payload: VeiculoCreate, db: Session = Depends(get_db)):
    v = db.query(Veiculo).filter(Veiculo.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")

    v.placa = payload.placa.strip().upper()
    v.modelo = payload.modelo
    v.ano = payload.ano
    v.tipo = payload.tipo
    v.meta_km_l = payload.meta_km_l
    v.ativo = payload.ativo
    db.commit()
    db.refresh(v)
    return v
