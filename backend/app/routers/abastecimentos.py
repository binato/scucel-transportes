from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import desc, extract
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Abastecimento, Despesa, Veiculo
from ..schemas import AbastecimentoCreate, AbastecimentoResponse, DespesaVinculada

router = APIRouter(prefix="/api/abastecimentos", tags=["Abastecimentos"])


class BulkLoteItem(BaseModel):
    data: date
    km_inicial: Optional[int] = None
    km_final: int = Field(ge=0)
    litros_diesel: float = Field(gt=0)
    litros_arla: float = Field(default=0, ge=0)
    valor_total_nota: float = Field(ge=0)
    despesa_descricao: Optional[str] = None
    despesa_valor: Optional[float] = None
    despesa_categoria: str = "OUTROS"


class BulkLoteCreate(BaseModel):
    veiculo_id: int
    origem: str = "MANUAL"
    foto_url: Optional[str] = None
    itens: List[BulkLoteItem]


def _response(item):
    response = AbastecimentoResponse.model_validate(item)
    response.placa = item.veiculo.placa if item.veiculo else ""
    if item.despesas:
        expense = item.despesas[0]
        response.despesa = DespesaVinculada(
            categoria=expense.categoria, descricao=expense.descricao,
            valor=expense.valor, foto_comprovante_url=expense.foto_comprovante_url,
        )
    return response


def _lock_vehicle(db, vehicle_id):
    vehicle = db.query(Veiculo).filter(Veiculo.id == vehicle_id).with_for_update().first()
    if not vehicle:
        raise HTTPException(404, "Veículo não encontrado")
    return vehicle


def _ordered(db, vehicle_id, exclude_id=None):
    q = db.query(Abastecimento).filter(Abastecimento.veiculo_id == vehicle_id)
    if exclude_id is not None:
        q = q.filter(Abastecimento.id != exclude_id)
    return q.order_by(Abastecimento.data, Abastecimento.km_final, Abastecimento.id).all()


def _neighbors(db, vehicle_id, entry_date, km_final, exclude_id=None):
    previous = None
    following = None
    for item in _ordered(db, vehicle_id, exclude_id):
        if (item.data, item.km_final) <= (entry_date, km_final):
            previous = item
        else:
            following = item
            break
    return previous, following


def _validate_position(db, vehicle_id, entry_date, km_final, exclude_id=None):
    previous, following = _neighbors(db, vehicle_id, entry_date, km_final, exclude_id)
    if previous and km_final <= previous.km_final:
        raise HTTPException(422, "KM deve ser maior que o lançamento anterior")
    if following and km_final >= following.km_final:
        raise HTTPException(422, "KM deve ser menor que o lançamento seguinte")
    return previous, following


def _recalculate(item, km_initial):
    item.km_inicial = km_initial
    item.km_rodado = item.km_final - km_initial
    item.media_km_l = round(item.km_rodado / item.litros_diesel, 2) if item.km_rodado > 0 and item.litros_diesel > 0 else None
    item.custo_km_diesel = round(item.valor_total_nota / item.km_rodado, 2) if item.km_rodado > 0 else None


def _initial(payload, previous):
    if previous:
        return previous.km_final
    if payload.km_inicial is not None:
        if payload.km_inicial < 0 or payload.km_inicial >= payload.km_final:
            raise HTTPException(422, "KM inicial deve ser menor que o KM final")
        return payload.km_inicial
    # The first odometer value is a baseline, not distance traveled.
    return payload.km_final


def _sync_expense(db, item, payload):
    linked = db.query(Despesa).filter(Despesa.abastecimento_id == item.id).order_by(Despesa.id).all()
    if payload is None:
        for expense in linked:
            db.delete(expense)
        return
    expense = linked[0] if linked else Despesa(abastecimento_id=item.id)
    expense.veiculo_id = item.veiculo_id
    expense.motorista_id = item.motorista_id
    expense.data = item.data
    expense.categoria = payload.categoria
    expense.descricao = payload.descricao
    expense.valor = payload.valor
    expense.foto_comprovante_url = payload.foto_comprovante_url
    db.add(expense)
    for extra in linked[1:]:
        db.delete(extra)


@router.get("", response_model=List[AbastecimentoResponse])
def list_abastecimentos(veiculo_id: Optional[int] = None, ano: Optional[int] = None,
                        mes: Optional[int] = None, limit: int = Query(200, ge=1, le=1000),
                        offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    q = db.query(Abastecimento).options(joinedload(Abastecimento.veiculo), joinedload(Abastecimento.despesas))
    if veiculo_id:
        q = q.filter(Abastecimento.veiculo_id == veiculo_id)
    if ano:
        q = q.filter(extract("year", Abastecimento.data) == ano)
    if mes:
        q = q.filter(extract("month", Abastecimento.data) == mes)
    return [_response(item) for item in q.order_by(desc(Abastecimento.data), desc(Abastecimento.km_final), desc(Abastecimento.id)).offset(offset).limit(limit).all()]


@router.get("/ultimo-km/{veiculo_id}")
def get_ultimo_km(veiculo_id: int, db: Session = Depends(get_db)):
    last = db.query(Abastecimento).filter(Abastecimento.veiculo_id == veiculo_id).order_by(desc(Abastecimento.data), desc(Abastecimento.km_final)).first()
    return {"veiculo_id": veiculo_id, "ultimo_km": last.km_final if last else 0,
            "ultima_data": last.data.isoformat() if last else None}


@router.get("/contexto/{veiculo_id}")
def get_contexto(veiculo_id: int, data: date, km_final: int = 0, excluir_id: Optional[int] = None,
                 db: Session = Depends(get_db)):
    previous, following = _neighbors(db, veiculo_id, data, km_final, excluir_id)
    return {"anterior": _response(previous).model_dump(mode="json") if previous else None,
            "seguinte": _response(following).model_dump(mode="json") if following else None}


@router.post("", response_model=AbastecimentoResponse)
def create_abastecimento(payload: AbastecimentoCreate, db: Session = Depends(get_db)):
    if payload.client_id:
        existing = db.query(Abastecimento).filter(Abastecimento.client_id == payload.client_id).first()
        if existing:
            return _response(existing)
    _lock_vehicle(db, payload.veiculo_id)
    previous, following = _validate_position(db, payload.veiculo_id, payload.data, payload.km_final)
    initial = _initial(payload, previous)
    item = Abastecimento(**payload.model_dump(exclude={"despesa", "km_inicial"}))
    _recalculate(item, initial)
    try:
        db.add(item)
        db.flush()
        if following:
            _recalculate(following, item.km_final)
        if payload.despesa:
            _sync_expense(db, item, payload.despesa)
        db.commit()
    except IntegrityError:
        db.rollback()
        if payload.client_id:
            existing = db.query(Abastecimento).filter(Abastecimento.client_id == payload.client_id).first()
            if existing:
                return _response(existing)
        raise
    except Exception:
        db.rollback()
        raise
    db.refresh(item)
    return _response(item)


@router.put("/{id}", response_model=AbastecimentoResponse)
def update_abastecimento(id: int, payload: AbastecimentoCreate, db: Session = Depends(get_db)):
    item = db.get(Abastecimento, id)
    if not item:
        raise HTTPException(404, "Registro não encontrado")
    for vehicle_id in sorted({item.veiculo_id, payload.veiculo_id}):
        _lock_vehicle(db, vehicle_id)
    old_entries = _ordered(db, item.veiculo_id)
    position = next(i for i, entry in enumerate(old_entries) if entry.id == id)
    old_previous = old_entries[position - 1] if position > 0 else None
    old_following = old_entries[position + 1] if position + 1 < len(old_entries) else None
    if old_previous and old_following and old_previous.km_final >= old_following.km_final:
        raise HTTPException(422, "A sequência antiga de KM precisa ser corrigida antes de mover este registro")
    previous, following = _validate_position(db, payload.veiculo_id, payload.data, payload.km_final, id)
    initial = _initial(payload, previous)
    for key, value in payload.model_dump(exclude={"despesa", "km_inicial", "client_id"}).items():
        setattr(item, key, value)
    _recalculate(item, initial)
    try:
        if old_following and old_following.id != (following.id if following else None):
            _recalculate(old_following, old_previous.km_final if old_previous else (old_following.km_inicial or old_following.km_final))
        if following:
            _recalculate(following, item.km_final)
        _sync_expense(db, item, payload.despesa)
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(item)
    return _response(item)


@router.post("/bulk-lote")
def create_bulk_lote(payload: BulkLoteCreate, db: Session = Depends(get_db)):
    vehicle = _lock_vehicle(db, payload.veiculo_id)
    created = []
    try:
        for entry in sorted(payload.itens, key=lambda it: (it.data, it.km_final)):
            previous, following = _validate_position(db, payload.veiculo_id, entry.data, entry.km_final)
            item = Abastecimento(veiculo_id=payload.veiculo_id, data=entry.data,
                                 km_final=entry.km_final, litros_diesel=entry.litros_diesel,
                                 litros_arla=entry.litros_arla, valor_total_nota=entry.valor_total_nota,
                                 origem_registro=payload.origem, foto_comprovante_url=payload.foto_url)
            _recalculate(item, _initial(entry, previous))
            db.add(item)
            db.flush()
            if following:
                _recalculate(following, item.km_final)
            if entry.despesa_descricao and entry.despesa_valor and entry.despesa_valor > 0:
                db.add(Despesa(veiculo_id=payload.veiculo_id, abastecimento_id=item.id,
                               data=entry.data, categoria=entry.despesa_categoria,
                               descricao=entry.despesa_descricao, valor=entry.despesa_valor))
            created.append(item)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"status": "sucesso", "abastecimentos_criados": len(created),
            "despesas_criadas": sum(1 for entry in payload.itens if entry.despesa_descricao and entry.despesa_valor and entry.despesa_valor > 0),
            "placa": vehicle.placa}


@router.delete("/{id}")
def delete_abastecimento(id: int, db: Session = Depends(get_db)):
    item = db.get(Abastecimento, id)
    if not item:
        raise HTTPException(404, "Registro não encontrado")
    _lock_vehicle(db, item.veiculo_id)
    entries = _ordered(db, item.veiculo_id)
    position = next(i for i, entry in enumerate(entries) if entry.id == id)
    previous = entries[position - 1] if position > 0 else None
    following = entries[position + 1] if position + 1 < len(entries) else None
    if previous and following and previous.km_final >= following.km_final:
        raise HTTPException(422, "A sequência de KM ficará incoerente após a exclusão")
    try:
        for expense in db.query(Despesa).filter(Despesa.abastecimento_id == id).all():
            db.delete(expense)
        db.delete(item)
        if following:
            _recalculate(following, previous.km_final if previous else (following.km_inicial or following.km_final))
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"status": "removido", "id": id}
