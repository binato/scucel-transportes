from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, desc
from typing import List, Optional
from ..database import get_db
from ..models import Despesa, Veiculo
from ..schemas import DespesaCreate, DespesaResponse

router = APIRouter(prefix="/api/despesas", tags=["Despesas"])

@router.get("", response_model=List[DespesaResponse])
def list_despesas(
    veiculo_id: Optional[int] = Query(None),
    categoria: Optional[str] = Query(None),
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    limit: int = Query(200),
    db: Session = Depends(get_db)
):
    q = db.query(Despesa)
    if veiculo_id:
        q = q.filter(Despesa.veiculo_id == veiculo_id)
    if categoria:
        q = q.filter(Despesa.categoria == categoria)
    if ano:
        q = q.filter(extract('year', Despesa.data) == ano)
    if mes:
        q = q.filter(extract('month', Despesa.data) == mes)

    items = q.order_by(desc(Despesa.data), desc(Despesa.id)).limit(limit).all()

    res = []
    for d in items:
        resp = DespesaResponse.model_validate(d)
        resp.placa = d.veiculo.placa if d.veiculo else ""
        res.append(resp)
    return res

@router.post("", response_model=DespesaResponse)
def create_despesa(payload: DespesaCreate, db: Session = Depends(get_db)):
    veiculo = db.query(Veiculo).filter(Veiculo.id == payload.veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")

    desp = Despesa(
        veiculo_id=payload.veiculo_id,
        motorista_id=payload.motorista_id,
        abastecimento_id=payload.abastecimento_id,
        data=payload.data,
        categoria=payload.categoria or "OUTROS",
        descricao=payload.descricao,
        valor=payload.valor
    )
    db.add(desp)
    db.commit()
    db.refresh(desp)

    resp = DespesaResponse.model_validate(desp)
    resp.placa = veiculo.placa
    return resp

@router.delete("/{id}")
def delete_despesa(id: int, db: Session = Depends(get_db)):
    d = db.query(Despesa).filter(Despesa.id == id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
    db.delete(d)
    db.commit()
    return {"status": "removido", "id": id}
