from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, desc
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from ..database import get_db
from ..models import Abastecimento, Veiculo, Despesa
from ..schemas import AbastecimentoCreate, AbastecimentoResponse

router = APIRouter(prefix="/api/abastecimentos", tags=["Abastecimentos"])

class BulkLoteItem(BaseModel):
    data: date
    km_inicial: Optional[int] = None
    km_final: int
    litros_diesel: float
    litros_arla: Optional[float] = 0.0
    valor_total_nota: float
    despesa_descricao: Optional[str] = None
    despesa_valor: Optional[float] = None
    despesa_categoria: Optional[str] = "OUTROS"

class BulkLoteCreate(BaseModel):
    veiculo_id: int
    origem: Optional[str] = "IA_VISION"
    foto_url: Optional[str] = None
    itens: List[BulkLoteItem]

@router.get("", response_model=List[AbastecimentoResponse])
def list_abastecimentos(
    veiculo_id: Optional[int] = Query(None),
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    limit: int = Query(200, le=1000),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    q = db.query(Abastecimento)
    if veiculo_id:
        q = q.filter(Abastecimento.veiculo_id == veiculo_id)
    if ano:
        q = q.filter(extract('year', Abastecimento.data) == ano)
    if mes:
        q = q.filter(extract('month', Abastecimento.data) == mes)

    items = q.order_by(desc(Abastecimento.data), desc(Abastecimento.id)).offset(offset).limit(limit).all()

    # attach placa for convenience
    res = []
    for item in items:
        resp = AbastecimentoResponse.model_validate(item)
        resp.placa = item.veiculo.placa if item.veiculo else ""
        res.append(resp)
    return res

@router.get("/ultimo-km/{veiculo_id}")
def get_ultimo_km(veiculo_id: int, db: Session = Depends(get_db)):
    last = db.query(Abastecimento).filter(Abastecimento.veiculo_id == veiculo_id).order_by(desc(Abastecimento.data), desc(Abastecimento.km_final)).first()
    return {
        "veiculo_id": veiculo_id,
        "ultimo_km": last.km_final if last else 0,
        "ultima_data": last.data.strftime("%Y-%m-%d") if last else None
    }

@router.post("", response_model=AbastecimentoResponse)
def create_abastecimento(payload: AbastecimentoCreate, db: Session = Depends(get_db)):
    veiculo = db.query(Veiculo).filter(Veiculo.id == payload.veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")

    # calculate km_rodado and media
    km_ini = payload.km_inicial
    if km_ini is None:
        last = db.query(Abastecimento).filter(Abastecimento.veiculo_id == payload.veiculo_id).order_by(desc(Abastecimento.data), desc(Abastecimento.km_final)).first()
        km_ini = last.km_final if last else 0

    km_rod = max(0, payload.km_final - km_ini) if payload.km_rodado is None else payload.km_rodado
    media = round(km_rod / payload.litros_diesel, 2) if payload.litros_diesel > 0 and km_rod > 0 else None
    custo_km = round(payload.valor_total_nota / km_rod, 2) if km_rod > 0 else None

    abast = Abastecimento(
        veiculo_id=payload.veiculo_id,
        motorista_id=payload.motorista_id,
        data=payload.data,
        km_inicial=km_ini,
        km_final=payload.km_final,
        km_rodado=km_rod,
        litros_diesel=payload.litros_diesel,
        litros_arla=payload.litros_arla or 0.0,
        valor_total_nota=payload.valor_total_nota,
        media_km_l=media,
        custo_km_diesel=custo_km,
        origem_registro=payload.origem_registro or "MANUAL",
        foto_comprovante_url=payload.foto_comprovante_url,
        aprovado=payload.aprovado,
        observacoes=payload.observacoes
    )
    db.add(abast)
    db.commit()
    db.refresh(abast)

    resp = AbastecimentoResponse.model_validate(abast)
    resp.placa = veiculo.placa
    return resp

@router.post("/bulk-lote")
def create_bulk_lote(payload: BulkLoteCreate, db: Session = Depends(get_db)):
    veiculo = db.query(Veiculo).filter(Veiculo.id == payload.veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")

    created_count = 0
    despesas_count = 0

    # sort items by date and km
    sorted_items = sorted(payload.itens, key=lambda x: (x.data, x.km_final))

    prev_km = None
    for it in sorted_items:
        km_ini = it.km_inicial
        if km_ini is None:
            if prev_km is not None:
                km_ini = prev_km
            else:
                last = db.query(Abastecimento).filter(Abastecimento.veiculo_id == payload.veiculo_id).order_by(desc(Abastecimento.data), desc(Abastecimento.km_final)).first()
                km_ini = last.km_final if last else 0

        km_rod = max(0, it.km_final - km_ini)
        media = round(km_rod / it.litros_diesel, 2) if it.litros_diesel > 0 and km_rod > 0 else None
        custo_km = round(it.valor_total_nota / km_rod, 2) if km_rod > 0 else None

        abast = Abastecimento(
            veiculo_id=payload.veiculo_id,
            data=it.data,
            km_inicial=km_ini,
            km_final=it.km_final,
            km_rodado=km_rod,
            litros_diesel=it.litros_diesel,
            litros_arla=it.litros_arla or 0.0,
            valor_total_nota=it.valor_total_nota,
            media_km_l=media,
            custo_km_diesel=custo_km,
            origem_registro=payload.origem or "IA_VISION",
            foto_comprovante_url=payload.foto_url,
            aprovado=True
        )
        db.add(abast)
        db.flush()
        created_count += 1
        prev_km = it.km_final

        if it.despesa_descricao and it.despesa_valor and it.despesa_valor > 0:
            desp = Despesa(
                veiculo_id=payload.veiculo_id,
                abastecimento_id=abast.id,
                data=it.data,
                categoria=it.despesa_categoria or "OUTROS",
                descricao=it.despesa_descricao,
                valor=it.despesa_valor
            )
            db.add(desp)
            despesas_count += 1

    db.commit()
    return {
        "status": "sucesso",
        "abastecimentos_criados": created_count,
        "despesas_criadas": despesas_count,
        "placa": veiculo.placa
    }

@router.delete("/{id}")
def delete_abastecimento(id: int, db: Session = Depends(get_db)):
    item = db.query(Abastecimento).filter(Abastecimento.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    db.delete(item)
    db.commit()
    return {"status": "removido", "id": id}
