import React from 'react';
import { Filter, Calendar, Truck, RotateCcw, Download, Sparkles } from 'lucide-react';

export default function FilterSlicers({
  filters,
  setFilters,
  veiculos,
  onReset,
  onExportCsv
}) {
  const months = [
    { num: null, label: 'Todos os Meses' },
    { num: 1, label: 'Jan' },
    { num: 2, label: 'Fev' },
    { num: 3, label: 'Mar' },
    { num: 4, label: 'Abr' },
    { num: 5, label: 'Mai' },
    { num: 6, label: 'Jun' },
    { num: 7, label: 'Jul' },
    { num: 8, label: 'Ago' },
    { num: 9, label: 'Set' },
    { num: 10, label: 'Out' },
    { num: 11, label: 'Nov' },
    { num: 12, label: 'Dez' }
  ];

  return (
    <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem' }}>
        
        {/* Left Filter Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#60a5fa', fontWeight: '700', fontSize: '0.82rem' }}>
            <Filter size={16} />
            <span>Filtros Globais:</span>
          </div>

          {/* Vehicle Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Truck size={15} color="var(--text-muted)" />
            <select
              className="input-custom"
              value={filters.veiculo_id || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, veiculo_id: e.target.value ? parseInt(e.target.value) : null }))}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.65rem', minWidth: '180px' }}
            >
              <option value="">Todos os Caminhões ({veiculos.length})</option>
              {veiculos.map(v => (
                <option key={v.id} value={v.id}>
                  {v.placa} — {v.modelo}
                </option>
              ))}
            </select>
          </div>

          {/* Year Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={15} color="var(--text-muted)" />
            <select
              className="input-custom"
              value={filters.ano || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, ano: e.target.value ? parseInt(e.target.value) : null }))}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.65rem' }}
            >
              <option value="">Todos os Anos</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Month Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
            {months.map((m) => {
              const isActive = (filters.mes === m.num) || (m.num === null && !filters.mes);
              return (
                <button
                  key={m.label}
                  className={`slicer-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setFilters(prev => ({ ...prev, mes: m.num }))}
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {(filters.veiculo_id || filters.mes || filters.ano) && (
            <button
              onClick={onReset}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
              title="Limpar todos os filtros"
            >
              <RotateCcw size={14} />
              <span>Limpar Filtros</span>
            </button>
          )}

          <button
            onClick={onExportCsv}
            className="btn-secondary"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', borderColor: 'rgba(59, 130, 246, 0.3)' }}
          >
            <Download size={14} color="#60a5fa" />
            <span>Exportar Dados</span>
          </button>
        </div>

      </div>
    </div>
  );
}
