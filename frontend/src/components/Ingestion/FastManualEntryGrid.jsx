import React, { useState, useEffect } from 'react';
import { Keyboard, Plus, Trash2, Check, Fuel, Calculator, HelpCircle } from 'lucide-react';
import { fetchUltimoKm, createAbastecimento, createDespesa } from '../../services/api';

export default function FastManualEntryGrid({ veiculos, onSuccessSave }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(veiculos.length > 0 ? veiculos[0].id : '');
  const [ultimoKm, setUltimoKm] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // Form State
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [kmFinal, setKmFinal] = useState('');
  const [litrosDiesel, setLitrosDiesel] = useState('');
  const [litrosArla, setLitrosArla] = useState('0');
  const [valorNota, setValorNota] = useState('');
  
  // Expense fields
  const [hasExpense, setHasExpense] = useState(false);
  const [despesaDescricao, setDespesaDescricao] = useState('');
  const [despesaValor, setDespesaValor] = useState('');
  const [despesaCategoria, setDespesaCategoria] = useState('OUTROS');

  // Load last KM whenever vehicle changes
  useEffect(() => {
    if (selectedVehicleId) {
      fetchUltimoKm(selectedVehicleId)
        .then(res => setUltimoKm(res.ultimo_km))
        .catch(console.error);
    }
  }, [selectedVehicleId]);

  // Calculations
  const kmAtualNum = parseInt(kmFinal) || 0;
  const dieselNum = parseFloat(litrosDiesel) || 0;
  const valorNotaNum = parseFloat(valorNota) || 0;

  const kmRodado = kmAtualNum > ultimoKm ? kmAtualNum - ultimoKm : 0;
  const mediaKmL = (dieselNum > 0 && kmRodado > 0) ? (kmRodado / dieselNum).toFixed(2) : '0.00';
  const custoKm = kmRodado > 0 ? (valorNotaNum / kmRodado).toFixed(2) : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId || !kmFinal || !litrosDiesel || !valorNota) {
      setMsg({ type: 'error', text: 'Preencha todos os campos obrigatórios de combustível.' });
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      // 1. Create fueling
      const abastRes = await createAbastecimento({
        veiculo_id: parseInt(selectedVehicleId),
        data: data,
        km_inicial: ultimoKm,
        km_final: kmAtualNum,
        litros_diesel: dieselNum,
        litros_arla: parseFloat(litrosArla) || 0,
        valor_total_nota: valorNotaNum,
        origem_registro: 'MANUAL_FERNANDA'
      });

      // 2. Create expense if provided
      if (hasExpense && despesaDescricao && despesaValor) {
        await createDespesa({
          veiculo_id: parseInt(selectedVehicleId),
          abastecimento_id: abastRes.id,
          data: data,
          categoria: despesaCategoria,
          descricao: despesaDescricao,
          valor: parseFloat(despesaValor)
        });
      }

      setMsg({ type: 'success', text: `✓ Lançamento salvo com sucesso! Média calculada: ${mediaKmL} KM/L` });
      setUltimoKm(kmAtualNum);
      setKmFinal('');
      setLitrosDiesel('');
      setLitrosArla('0');
      setValorNota('');
      setDespesaDescricao('');
      setDespesaValor('');
      setHasExpense(false);

      if (onSuccessSave) onSuccessSave();
    } catch (err) {
      setMsg({ type: 'error', text: 'Erro ao salvar: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Keyboard size={20} color="#60a5fa" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff', margin: 0 }}>
            Digitação Rápida Assistida (Entrada Manual)
          </h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Cálculo instantâneo de KM Rodado e Média
        </span>
      </div>

      {msg && (
        <div style={{
          padding: '0.65rem 1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize: '0.82rem',
          background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
          color: msg.type === 'success' ? '#34d399' : '#fb7185'
        }}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        
        {/* Row 1: Vehicle and Last KM */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: '600' }}>
              Caminhão (Placa) *
            </label>
            <select
              className="input-custom"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              style={{ width: '100%', fontWeight: '700', color: '#60a5fa' }}
            >
              {veiculos.map(v => (
                <option key={v.id} value={v.id}>
                  {v.placa} — {v.modelo} (Meta: {v.meta_km_l} KM/L)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: '600' }}>
              Data do Abastecimento *
            </label>
            <input
              type="date"
              className="input-custom"
              value={data}
              onChange={(e) => setData(e.target.value)}
              style={{ width: '100%' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Último KM Registrado
            </label>
            <div style={{ padding: '0.55rem 0.85rem', background: '#0e1524', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontWeight: '700', color: '#94a3b8', fontSize: '0.9rem' }}>
              {ultimoKm.toLocaleString('pt-BR')} KM
            </div>
          </div>
        </div>

        {/* Row 2: KM, Litros, Valor */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: '600' }}>
              KM Atual (Odômetro) *
            </label>
            <input
              type="number"
              className="input-custom"
              placeholder="Ex: 621124"
              value={kmFinal}
              onChange={(e) => setKmFinal(e.target.value)}
              style={{ width: '100%', fontWeight: '700', fontSize: '1rem' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: '600' }}>
              Litros Diesel *
            </label>
            <input
              type="number"
              step="0.01"
              className="input-custom"
              placeholder="Ex: 654.01"
              value={litrosDiesel}
              onChange={(e) => setLitrosDiesel(e.target.value)}
              style={{ width: '100%', fontWeight: '700' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Litros ARLA 32
            </label>
            <input
              type="number"
              step="0.01"
              className="input-custom"
              placeholder="0.00"
              value={litrosArla}
              onChange={(e) => setLitrosArla(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: '600' }}>
              Valor Total Nota (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              className="input-custom"
              placeholder="Ex: 3707.09"
              value={valorNota}
              onChange={(e) => setValorNota(e.target.value)}
              style={{ width: '100%', fontWeight: '700', color: '#60a5fa' }}
              required
            />
          </div>
        </div>

        {/* Live Calculation Preview Banner */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '10px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          textAlign: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>KM Rodado na Viagem</span>
            <p className="number-metric" style={{ fontSize: '1.35rem', color: '#38bdf8', margin: '0.2rem 0 0 0' }}>
              {kmRodado > 0 ? kmRodado.toLocaleString('pt-BR') : 0} KM
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Média de Consumo</span>
            <p className="number-metric" style={{ fontSize: '1.35rem', color: parseFloat(mediaKmL) >= 3.0 ? '#34d399' : '#fb7185', margin: '0.2rem 0 0 0' }}>
              {mediaKmL} KM/L
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Custo Diesel por KM</span>
            <p className="number-metric" style={{ fontSize: '1.35rem', color: '#fbbf24', margin: '0.2rem 0 0 0' }}>
              R$ {custoKm} / km
            </p>
          </div>
        </div>

        {/* Expense Section Toggle */}
        <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: '#0e1524', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', color: '#e2e8f0' }}>
            <input
              type="checkbox"
              checked={hasExpense}
              onChange={(e) => setHasExpense(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
            />
            <span>Houve despesa adicional nesta viagem? (Pneu, Lavagem, Oficina, Seguro, etc.)</span>
          </label>

          {hasExpense && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Categoria
                </label>
                <select
                  className="input-custom"
                  value={despesaCategoria}
                  onChange={(e) => setDespesaCategoria(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8rem' }}
                >
                  <option value="MECANICA_PECAS">Mecânica & Peças</option>
                  <option value="PNEUS">Pneus & Borracharia</option>
                  <option value="LAVAGEM">Lavagem</option>
                  <option value="SEGURO">Seguro Carreta</option>
                  <option value="RASTREAMENTO">Autotrac / Rastreamento</option>
                  <option value="ELETRICA">Auto Elétrica</option>
                  <option value="DIARIAS_ESTRADA">Hotel / Diária</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Descrição da Despesa
                </label>
                <input
                  type="text"
                  className="input-custom"
                  placeholder="Ex: Conserto Pneu Dianteiro"
                  value={despesaDescricao}
                  onChange={(e) => setDespesaDescricao(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-custom"
                  placeholder="0.00"
                  value={despesaValor}
                  onChange={(e) => setDespesaValor(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8rem', color: '#fbbf24', fontWeight: '700' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ padding: '0.65rem 1.8rem', fontSize: '0.9rem' }}
          >
            <Check size={16} />
            <span>{saving ? 'Gravando...' : 'Salvar Abastecimento'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
