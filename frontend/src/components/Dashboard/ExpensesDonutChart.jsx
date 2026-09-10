import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip 
} from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

const CATEGORY_COLORS = {
  'MECANICA_PECAS': '#f59e0b',
  'PNEUS': '#ef4444',
  'SEGURO': '#3b82f6',
  'LAVAGEM': '#06b6d4',
  'RASTREAMENTO': '#8b5cf6',
  'ELETRICA': '#10b981',
  'DIARIAS_ESTRADA': '#ec4899',
  'DOCUMENTACAO': '#64748b',
  'OUTROS': '#94a3b8'
};

const CATEGORY_LABELS = {
  'MECANICA_PECAS': 'Mecânica & Peças',
  'PNEUS': 'Pneus & Borracharia',
  'SEGURO': 'Seguro Carreta',
  'LAVAGEM': 'Lavagem & Estética',
  'RASTREAMENTO': 'Autotrac / Rastreamento',
  'ELETRICA': 'Auto Elétrica & Bateria',
  'DIARIAS_ESTRADA': 'Diárias / Hotel / EPI',
  'DOCUMENTACAO': 'Documentação & IPVA',
  'OUTROS': 'Outras Despesas'
};

export default function ExpensesDonutChart({ despesasCategorias, onSelectCategory }) {
  if (!despesasCategorias || despesasCategorias.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Nenhuma despesa registrada para o filtro.
      </div>
    );
  }

  const totalValor = despesasCategorias.reduce((acc, c) => acc + c.valor_total, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const label = CATEGORY_LABELS[data.categoria] || data.categoria;
      return (
        <div style={{
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.15)',
          padding: '0.6rem 0.9rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontSize: '0.82rem'
        }}>
          <p style={{ fontWeight: '700', color: payload[0].fill }}>
            {label}
          </p>
          <p style={{ color: '#fff', margin: '0.2rem 0' }}>
            Valor: <strong>R$ {data.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </p>
          <p style={{ color: '#94a3b8' }}>
            Participação: <strong>{data.percentual.toFixed(1)}%</strong> ({data.quantidade} lançamentos)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PieIcon size={18} color="#c084fc" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', margin: 0 }}>
            Composição das Despesas Operacionais
          </h3>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#c084fc' }}>
          Total: R$ {totalValor.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: '1rem' }}>
        
        {/* Donut Chart */}
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={despesasCategorias}
                dataKey="valor_total"
                nameKey="categoria"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {despesasCategorias.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CATEGORY_COLORS[entry.categoria] || '#94a3b8'} 
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '210px', overflowY: 'auto', paddingRight: '0.3rem' }}>
          {despesasCategorias.map((cat) => {
            const color = CATEGORY_COLORS[cat.categoria] || '#94a3b8';
            const label = CATEGORY_LABELS[cat.categoria] || cat.categoria;
            return (
              <div 
                key={cat.categoria} 
                onClick={() => onSelectCategory && onSelectCategory(cat.categoria)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.5rem',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                  <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: '700', color: '#fff' }}>
                    {cat.percentual.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
