import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceArea, 
  ReferenceLine,
  Cell 
} from 'recharts';
import { Droplets, AlertCircle } from 'lucide-react';

export default function ArlaAuditChart({ auditoriaArla }) {
  if (!auditoriaArla || auditoriaArla.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Nenhum dado de ARLA 32 disponível para o período.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.15)',
          padding: '0.6rem 0.9rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontSize: '0.82rem'
        }}>
          <p style={{ fontWeight: '700', color: '#38bdf8', marginBottom: '0.25rem' }}>
            Placa: {data.placa}
          </p>
          <p style={{ color: '#fff' }}>
            Proporção ARLA/Diesel: <strong>{data.proporcao_pct.toFixed(2)}%</strong>
          </p>
          <p style={{ color: '#94a3b8' }}>
            Diesel: {data.litros_diesel.toLocaleString('pt-BR')} L | ARLA: {data.litros_arla.toLocaleString('pt-BR')} L
          </p>
          <p style={{
            fontSize: '0.72rem',
            fontWeight: '700',
            marginTop: '0.3rem',
            color: data.status === 'CONFORME' ? '#34d399' : (data.status === 'BAIXO' ? '#fbbf24' : '#fb7185')
          }}>
            Status: {data.status === 'CONFORME' ? '✓ Dentro da Faixa Segura (4% a 9%)' : (data.status === 'BAIXO' ? '⚠️ Consumo Baixo de ARLA' : '⚠️ Consumo Excessivo')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Droplets size={18} color="#06b6d4" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', margin: 0 }}>
            Auditoria de Consumo ARLA 32 (% sobre Diesel)
          </h3>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          Faixa Ideal Normativa: <strong>4.0% — 8.0%</strong>
        </span>
      </div>

      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={auditoriaArla}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="placa" 
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis 
              domain={[0, 10]} 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine y={4.0} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Mín 4%', fill: '#10b981', fontSize: 9 }} />
            <ReferenceLine y={8.0} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Máx 8%', fill: '#10b981', fontSize: 9 }} />

            <Bar 
              dataKey="proporcao_pct" 
              radius={[4, 4, 0, 0]}
            >
              {auditoriaArla.map((entry, index) => {
                let color = '#10b981';
                if (entry.status === 'BAIXO') color = '#f59e0b';
                if (entry.status === 'ALTO') color = '#f43f5e';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
