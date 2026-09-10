from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime

# Veículo
class VeiculoBase(BaseModel):
    placa: str
    modelo: Optional[str] = "Caminhão Scucel"
    ano: Optional[int] = None
    tipo: Optional[str] = "Cavalo Mecânico"
    meta_km_l: Optional[float] = 3.00
    ativo: Optional[bool] = True

class VeiculoCreate(VeiculoBase):
    pass

class VeiculoResponse(VeiculoBase):
    id: int
    class Config:
        from_attributes = True

# Motorista
class MotoristaBase(BaseModel):
    nome: str
    telefone: Optional[str] = None
    ativo: Optional[bool] = True

class MotoristaCreate(MotoristaBase):
    pass

class MotoristaResponse(MotoristaBase):
    id: int
    class Config:
        from_attributes = True

# Abastecimento
class AbastecimentoBase(BaseModel):
    veiculo_id: int
    motorista_id: Optional[int] = None
    data: date
    km_inicial: Optional[int] = None
    km_final: int
    litros_diesel: float
    litros_arla: Optional[float] = 0.0
    valor_total_nota: float
    origem_registro: Optional[str] = "MANUAL"
    foto_comprovante_url: Optional[str] = None
    aprovado: Optional[bool] = True
    observacoes: Optional[str] = None

class AbastecimentoCreate(AbastecimentoBase):
    km_rodado: Optional[int] = None
    media_km_l: Optional[float] = None
    custo_km_diesel: Optional[float] = None

class AbastecimentoResponse(AbastecimentoBase):
    id: int
    km_rodado: int
    media_km_l: Optional[float] = None
    custo_km_diesel: Optional[float] = None
    placa: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Despesa
class DespesaBase(BaseModel):
    veiculo_id: int
    motorista_id: Optional[int] = None
    abastecimento_id: Optional[int] = None
    data: date
    categoria: Optional[str] = "OUTROS"
    descricao: str
    valor: float

class DespesaCreate(DespesaBase):
    pass

class DespesaResponse(DespesaBase):
    id: int
    placa: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Lote com IA / Manual
class ExtracaoLinhaAbastecimento(BaseModel):
    data: Optional[str] = None
    km_atual: Optional[int] = None
    litros_diesel: Optional[float] = None
    litros_arla: Optional[float] = 0.0
    valor_total_nota: Optional[float] = None
    despesa_descricao: Optional[str] = None
    despesa_valor: Optional[float] = None
    confianca: Optional[float] = 1.0

class ExtracaoIaResponse(BaseModel):
    placa_detectada: Optional[str] = None
    data_documento: Optional[str] = None
    linhas: List[ExtracaoLinhaAbastecimento]
    foto_url: Optional[str] = None
    tempo_processamento_ms: Optional[int] = None
    aviso: Optional[str] = None

# Dashboard Aggregations
class KpiSummary(BaseModel):
    consumo_medio_frota: float
    meta_consumo_frota: float
    custo_por_km_total: float
    km_total_rodado: int
    litros_diesel_total: float
    litros_arla_total: float
    proporcao_arla_diesel_pct: float
    valor_diesel_total: float
    valor_despesas_total: float
    valor_operacional_total: float
    qtd_veiculos_ativos: int
    qtd_abastecimentos: int

class RankingVeiculo(BaseModel):
    placa: str
    modelo: str
    km_total: int
    litros_diesel: float
    consumo_medio_km_l: float
    meta_km_l: float
    valor_diesel: float
    valor_despesas: float
    custo_por_km: float
    desempenho_status: str # 'OTIMO', 'NORMAL', 'ALERTA'

class EvolucaoTemporal(BaseModel):
    mes_ano: str # '2026-01'
    mes_nome: str # 'Jan/2026'
    km_total: int
    litros_diesel: float
    consumo_medio_km_l: float
    valor_diesel: float
    valor_despesas: float
    valor_total: float
    custo_por_km: float

class CategoriaDespesa(BaseModel):
    categoria: str
    valor_total: float
    percentual: float
    quantidade: int

class AuditoriaArlaItem(BaseModel):
    placa: str
    litros_diesel: float
    litros_arla: float
    proporcao_pct: float
    status: str # 'CONFORME', 'BAIXO', 'ALTO'
