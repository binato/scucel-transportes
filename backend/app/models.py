from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Veiculo(Base):
    __tablename__ = "veiculos"

    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String(10), unique=True, index=True, nullable=False)
    modelo = Column(String(50), default="Caminhão Scucel")
    ano = Column(Integer, nullable=True)
    tipo = Column(String(30), default="Cavalo Mecânico")
    meta_km_l = Column(Float, default=3.00)
    ativo = Column(Boolean, default=True)

    abastecimentos = relationship("Abastecimento", back_populates="veiculo", cascade="all, delete-orphan")
    despesas = relationship("Despesa", back_populates="veiculo", cascade="all, delete-orphan")

class Motorista(Base):
    __tablename__ = "motoristas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    telefone = Column(String(20), nullable=True)
    ativo = Column(Boolean, default=True)

    abastecimentos = relationship("Abastecimento", back_populates="motorista")
    despesas = relationship("Despesa", back_populates="motorista")

class Abastecimento(Base):
    __tablename__ = "abastecimentos"

    id = Column(Integer, primary_key=True, index=True)
    veiculo_id = Column(Integer, ForeignKey("veiculos.id"), nullable=False, index=True)
    motorista_id = Column(Integer, ForeignKey("motoristas.id"), nullable=True)
    data = Column(Date, nullable=False, index=True)
    km_inicial = Column(Integer, nullable=True)
    km_final = Column(Integer, nullable=False)
    km_rodado = Column(Integer, nullable=False)
    litros_diesel = Column(Float, nullable=False)
    litros_arla = Column(Float, default=0.0)
    valor_total_nota = Column(Float, nullable=False)
    media_km_l = Column(Float, nullable=True)
    custo_km_diesel = Column(Float, nullable=True)
    origem_registro = Column(String(30), default="MANUAL") # 'MANUAL', 'IA_VISION', 'PWA_MOTORISTA', 'EXCEL_IMPORT'
    foto_comprovante_url = Column(String(255), nullable=True)
    aprovado = Column(Boolean, default=True)
    observacoes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    veiculo = relationship("Veiculo", back_populates="abastecimentos")
    motorista = relationship("Motorista", back_populates="abastecimentos")
    despesas = relationship("Despesa", back_populates="abastecimento")

class Despesa(Base):
    __tablename__ = "despesas"

    id = Column(Integer, primary_key=True, index=True)
    veiculo_id = Column(Integer, ForeignKey("veiculos.id"), nullable=False, index=True)
    motorista_id = Column(Integer, ForeignKey("motoristas.id"), nullable=True)
    abastecimento_id = Column(Integer, ForeignKey("abastecimentos.id"), nullable=True)
    data = Column(Date, nullable=False, index=True)
    categoria = Column(String(50), default="OUTROS") # 'PNEU', 'LAVAGEM', 'OFICINA', 'SEGURO', 'AUTOTRAC', 'HOTEL', 'OUTROS'
    descricao = Column(String(255), nullable=False)
    valor = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    veiculo = relationship("Veiculo", back_populates="despesas")
    motorista = relationship("Motorista", back_populates="despesas")
    abastecimento = relationship("Abastecimento", back_populates="despesas")
