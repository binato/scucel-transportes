import React, { useState } from 'react';
import { Truck, Plus, Check, Edit2, Shield, Fuel } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

export default function FleetManagement({ veiculos, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [tipo, setTipo] = useState('Cavalo Mecânico');
  const [metaKmL, setMetaKmL] = useState('3.05');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!placa) return;

    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/veiculos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placa: placa.toUpperCase().trim(),
          modelo: modelo.trim() || 'Caminhão Scucel',
          tipo: tipo,
          meta_km_l: parseFloat(metaKmL) || 3.00
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao cadastrar veículo');
      }

      setMsg({ type: 'success', text: '✓ Veículo cadastrado com sucesso na frota!' });
      setPlaca('');
      setModelo('');
      setShowModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Truck size={22} color="#60a5fa" />
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', margin: 0 }}>
              Gestão da Frota de Caminhões Scucel
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Controle de placas ativas, modelos e metas de consumo (KM/L)
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(!showModal)}
          className="btn-primary"
          style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
        >
          <Plus size={15} /> Cadastrar Novo Caminhão
        </button>
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

      {/* New Truck Form Modal */}
      {showModal && (
        <form onSubmit={handleCreate} style={{ background: '#0e1524', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#60a5fa', marginBottom: '0.75rem' }}>Novo Veículo da Frota</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1.5fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Placa *</label>
              <input
                type="text"
                placeholder="Ex: ABC1D23"
                className="input-custom"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                style={{ width: '100%', textTransform: 'uppercase', fontWeight: '700' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Modelo / Marca</label>
              <input
                type="text"
                placeholder="Ex: Scania R450 / Volvo FH 540"
                className="input-custom"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Tipo de Carreta</label>
              <select
                className="input-custom"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="Cavalo Mecânico">Cavalo Mecânico</option>
                <option value="Bitrem">Bitrem</option>
                <option value="Rodotrem">Rodotrem</option>
                <option value="Truck">Truck</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Meta KM/L</label>
              <input
                type="number"
                step="0.05"
                className="input-custom"
                value={metaKmL}
                onChange={(e) => setMetaKmL(e.target.value)}
                style={{ width: '100%', fontWeight: '700', color: '#34d399' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '0.4rem 0.95rem', fontSize: '0.78rem' }}>
              {saving ? 'Cadastrando...' : 'Salvar Veículo'}
            </button>
          </div>
        </form>
      )}

      {/* Fleet Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {veiculos.map(v => (
          <div
            key={v.id}
            className="glass-panel"
            style={{
              padding: '1.1rem',
              borderLeft: '4px solid #3b82f6',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff', letterSpacing: '0.05em' }}>
                  {v.placa}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399'
                }}>
                  Ativo na Frota
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 0.4rem 0', fontWeight: '500' }}>
                {v.modelo}
              </p>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Categoria: <strong>{v.tipo}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                <Fuel size={14} color="#34d399" />
                <span>Meta: <strong style={{ color: '#34d399' }}>{v.meta_km_l.toFixed(2)} KM/L</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
