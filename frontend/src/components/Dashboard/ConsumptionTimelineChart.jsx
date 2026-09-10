import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { CalendarRange } from 'lucide-react';

export default function ConsumptionTimelineChart({ evolucao }) {
  if (!evolucao || evolucao.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Nenhum dado temporal disponível para o filtro.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.15)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontSize: '0.82rem'
        }}>
          <p style={{ fontWeight: '700', color: '#60a5fa', marginBottom: '0.35rem' }}>
            Mês: {label}
          </p>
          {payload.map((p, idx) => (
            <p key={idx} style={{ color: p.color, margin: '0.2rem 0' }}>
              {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString('pt-BR') : p.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarRange size={18} color="#38bdf8" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', margin: 0 }}>
            Evolução Mensal: Volume Diesel (L) vs Despesas (R$)
          </h3>
        </div>
      </div>

      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={evolucao}
            margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorDiesel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="mes_nome" 
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#c084fc', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              align="right"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '0.78rem' }}
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="litros_diesel" 
              name="Litros Diesel (L)" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorDiesel)" 
            />
            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey="valor_despesas" 
              name="Despesas Manut. (R$)" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorDesp)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
