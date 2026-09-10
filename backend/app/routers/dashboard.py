from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date
from ..database import get_db
from ..models import Abastecimento, Despesa, Veiculo
from ..schemas import KpiSummary, RankingVeiculo, EvolucaoTemporal, CategoriaDespesa, AuditoriaArlaItem

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Analytics"])

@router.get("/kpis", response_model=KpiSummary)
def get_kpis(
    ano: Optional[int] = Query(None, description="Ano de filtro (ex: 2026)"),
    mes: Optional[int] = Query(None, description="Mês de filtro (1 a 12)"),
    veiculo_id: Optional[int] = Query(None, description="ID do veículo"),
    db: Session = Depends(get_db)
):
    # Query Abastecimentos
    q_abast = db.query(Abastecimento)
    q_desp = db.query(Despesa)

    if ano:
        q_abast = q_abast.filter(extract('year', Abastecimento.data) == ano)
        q_desp = q_desp.filter(extract('year', Despesa.data) == ano)
    if mes:
        q_abast = q_abast.filter(extract('month', Abastecimento.data) == mes)
        q_desp = q_desp.filter(extract('month', Despesa.data) == mes)
    if veiculo_id:
        q_abast = q_abast.filter(Abastecimento.veiculo_id == veiculo_id)
        q_desp = q_desp.filter(Despesa.veiculo_id == veiculo_id)

    abastecimentos = q_abast.all()
    despesas = q_desp.all()

    total_km = sum(a.km_rodado for a in abastecimentos if a.km_rodado)
    total_diesel_litros = sum(a.litros_diesel for a in abastecimentos if a.litros_diesel)
    total_arla_litros = sum(a.litros_arla for a in abastecimentos if a.litros_arla)
    total_valor_diesel = sum(a.valor_total_nota for a in abastecimentos if a.valor_total_nota)
    total_valor_despesas = sum(d.valor for d in despesas if d.valor)
    total_operacional = total_valor_diesel + total_valor_despesas

    # Media consumo
    consumo_medio = round(total_km / total_diesel_litros, 2) if total_diesel_litros > 0 else 0.0
    custo_km = round(total_operacional / total_km, 2) if total_km > 0 else 0.0
    proporcao_arla = round((total_arla_litros / total_diesel_litros) * 100, 2) if total_diesel_litros > 0 else 0.0

    # Meta media da frota
    veiculos_ativos = db.query(Veiculo).filter(Veiculo.ativo == True).all()
    meta_media = sum(v.meta_km_l for v in veiculos_ativos) / len(veiculos_ativos) if veiculos_ativos else 3.00

    return KpiSummary(
        consumo_medio_frota=consumo_medio,
        meta_consumo_frota=round(meta_media, 2),
        custo_por_km_total=custo_km,
        km_total_rodado=total_km,
        litros_diesel_total=round(total_diesel_litros, 2),
        litros_arla_total=round(total_arla_litros, 2),
        proporcao_arla_diesel_pct=proporcao_arla,
        valor_diesel_total=round(total_valor_diesel, 2),
        valor_despesas_total=round(total_valor_despesas, 2),
        valor_operacional_total=round(total_operacional, 2),
        qtd_veiculos_ativos=len(veiculos_ativos),
        qtd_abastecimentos=len(abastecimentos)
    )

@router.get("/ranking", response_model=List[RankingVeiculo])
def get_ranking_veiculos(
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    veiculos = db.query(Veiculo).filter(Veiculo.ativo == True).all()
    ranking = []

    for v in veiculos:
        q_abast = db.query(Abastecimento).filter(Abastecimento.veiculo_id == v.id)
        q_desp = db.query(Despesa).filter(Despesa.veiculo_id == v.id)

        if ano:
            q_abast = q_abast.filter(extract('year', Abastecimento.data) == ano)
            q_desp = q_desp.filter(extract('year', Despesa.data) == ano)
        if mes:
            q_abast = q_abast.filter(extract('month', Abastecimento.data) == mes)
            q_desp = q_desp.filter(extract('month', Despesa.data) == mes)

        abasts = q_abast.all()
        desps = q_desp.all()

        km_tot = sum(a.km_rodado for a in abasts if a.km_rodado)
        litros = sum(a.litros_diesel for a in abasts if a.litros_diesel)
        v_diesel = sum(a.valor_total_nota for a in abasts if a.valor_total_nota)
        v_desp = sum(d.valor for d in desps if d.valor)

        media_km_l = round(km_tot / litros, 2) if litros > 0 else 0.0
        custo_km = round((v_diesel + v_desp) / km_tot, 2) if km_tot > 0 else 0.0

        # Status
        if media_km_l >= (v.meta_km_l or 3.0):
            status = 'OTIMO'
        elif media_km_l >= ((v.meta_km_l or 3.0) * 0.92):
            status = 'NORMAL'
        else:
            status = 'ALERTA'

        if km_tot > 0 or litros > 0 or v_desp > 0:
            ranking.append(RankingVeiculo(
                placa=v.placa,
                modelo=v.modelo or "Caminhão Scucel",
                km_total=km_tot,
                litros_diesel=round(litros, 2),
                consumo_medio_km_l=media_km_l,
                meta_km_l=v.meta_km_l or 3.0,
                valor_diesel=round(v_diesel, 2),
                valor_despesas=round(v_desp, 2),
                custo_por_km=custo_km,
                desempenho_status=status
            ))

    # Ordenar por melhor média desc
    ranking.sort(key=lambda x: x.consumo_medio_km_l, reverse=True)
    return ranking

@router.get("/evolucao", response_model=List[EvolucaoTemporal])
def get_evolucao_temporal(
    veiculo_id: Optional[int] = Query(None),
    ano: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    meses_nomes = {
        1: 'Jan', 2: 'Fev', 3: 'Mar', 4: 'Abr', 5: 'Mai', 6: 'Jun',
        7: 'Jul', 8: 'Ago', 9: 'Set', 10: 'Out', 11: 'Nov', 12: 'Dez'
    }
    
    # scan distinct months present in database
    q_abast = db.query(Abastecimento)
    q_desp = db.query(Despesa)

    if veiculo_id:
        q_abast = q_abast.filter(Abastecimento.veiculo_id == veiculo_id)
        q_desp = q_desp.filter(Despesa.veiculo_id == veiculo_id)
    if ano:
        q_abast = q_abast.filter(extract('year', Abastecimento.data) == ano)
        q_desp = q_desp.filter(extract('year', Despesa.data) == ano)

    abasts = q_abast.all()
    desps = q_desp.all()

    # group by year-month
    buckets = {}
    for a in abasts:
        if a.data:
            key = (a.data.year, a.data.month)
            if key not in buckets:
                buckets[key] = {'km': 0, 'litros': 0.0, 'v_diesel': 0.0, 'v_desp': 0.0}
            buckets[key]['km'] += (a.km_rodado or 0)
            buckets[key]['litros'] += (a.litros_diesel or 0.0)
            buckets[key]['v_diesel'] += (a.valor_total_nota or 0.0)

    for d in desps:
        if d.data:
            key = (d.data.year, d.data.month)
            if key not in buckets:
                buckets[key] = {'km': 0, 'litros': 0.0, 'v_diesel': 0.0, 'v_desp': 0.0}
            buckets[key]['v_desp'] += (d.valor or 0.0)

    result = []
    for (y, m) in sorted(buckets.keys()):
        b = buckets[(y, m)]
        km = b['km']
        litros = b['litros']
        v_d = b['v_diesel']
        v_dp = b['v_desp']
        v_tot = v_d + v_dp
        media = round(km / litros, 2) if litros > 0 else 0.0
        custo = round(v_tot / km, 2) if km > 0 else 0.0

        result.append(EvolucaoTemporal(
            mes_ano=f"{y}-{m:02d}",
            mes_nome=f"{meses_nomes.get(m, str(m))}/{y}",
            km_total=km,
            litros_diesel=round(litros, 2),
            consumo_medio_km_l=media,
            valor_diesel=round(v_d, 2),
            valor_despesas=round(v_dp, 2),
            valor_total=round(v_tot, 2),
            custo_por_km=custo
        ))

    return result

@router.get("/despesas-categorias", response_model=List[CategoriaDespesa])
def get_despesas_categorias(
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    veiculo_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Despesa)
    if ano:
        q = q.filter(extract('year', Despesa.data) == ano)
    if mes:
        q = q.filter(extract('month', Despesa.data) == mes)
    if veiculo_id:
        q = q.filter(Despesa.veiculo_id == veiculo_id)

    despesas = q.all()
    total_val = sum(d.valor for d in despesas if d.valor)

    cats = {}
    for d in despesas:
        c = d.categoria or 'OUTROS'
        if c not in cats:
            cats[c] = {'valor': 0.0, 'qtd': 0}
        cats[c]['valor'] += (d.valor or 0.0)
        cats[c]['qtd'] += 1

    result = []
    for c, v in cats.items():
        pct = round((v['valor'] / total_val) * 100, 2) if total_val > 0 else 0.0
        result.append(CategoriaDespesa(
            categoria=c,
            valor_total=round(v['valor'], 2),
            percentual=pct,
            quantidade=v['qtd']
        ))

    result.sort(key=lambda x: x.valor_total, reverse=True)
    return result

@router.get("/auditoria-arla", response_model=List[AuditoriaArlaItem])
def get_auditoria_arla(
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    veiculos = db.query(Veiculo).filter(Veiculo.ativo == True).all()
    result = []

    for v in veiculos:
        q = db.query(Abastecimento).filter(Abastecimento.veiculo_id == v.id)
        if ano:
            q = q.filter(extract('year', Abastecimento.data) == ano)
        if mes:
            q = q.filter(extract('month', Abastecimento.data) == mes)

        abasts = q.all()
        l_diesel = sum(a.litros_diesel for a in abasts if a.litros_diesel)
        l_arla = sum(a.litros_arla for a in abasts if a.litros_arla)

        pct = round((l_arla / l_diesel) * 100, 2) if l_diesel > 0 else 0.0
        if pct >= 4.0 and pct <= 9.0:
            st = 'CONFORME'
        elif pct < 4.0:
            st = 'BAIXO'
        else:
            st = 'ALTO'

        if l_diesel > 0 or l_arla > 0:
            result.append(AuditoriaArlaItem(
                placa=v.placa,
                litros_diesel=round(l_diesel, 2),
                litros_arla=round(l_arla, 2),
                proporcao_pct=pct,
                status=st
            ))

    return result
