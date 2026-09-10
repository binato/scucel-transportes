import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine, 
  Cell 
} from 'recharts';
import { Trophy, Info } from 'lucide-react';

export default function EfficiencyRankingChart({ ranking, onSelectTruck, selectedVehicleId }) {
  if (!ranking || ranking.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Nenhum dado de ranking para o período selecionado.
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
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontSize: '0.82rem'
        }}>
          <p style={{ fontWeight: '700', color: '#60a5fa', marginBottom: '0.35rem' }}>
            {data.placa} ({data.modelo})
          </p>
          <div style={{ display: 'grid', gap: '0.2rem', color: '#cbd5e1' }}>
            <p>Média de Consumo: <strong style={{ color: '#34d399' }}>{data.consumo_medio_km_l.toFixed(2)} KM/L</strong></p>
            <p>Meta do Veículo: <strong>{data.meta_km_l.toFixed(2)} KM/L</strong></p>
            <p>KM Rodado Total: <strong>{data.km_total.toLocaleString('pt-BR')} KM</strong></p>
            <p>Diesel Consumido: <strong>{data.litros_diesel.toLocaleString('pt-BR')} L</strong></p>
            <p>Custo por KM: <strong>R$ {data.custo_por_km.toFixed(2)} / km</strong></p>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.3rem' }}>
            💡 Clique na barra para filtrar todo o dashboard
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
          <Trophy size={18} color="#fbbf24" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', margin: 0 }}>
            Eficiência Energética por Caminhão (KM/L)
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#34d399' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10b981' }} />
            Acima da Meta
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#fbbf24' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f59e0b' }} />
            Normal
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#fb7185' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f43f5e' }} />
            Abaixo
          </span>
        </div>
      </div>

      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ranking}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload.length) {
                const clickedPlate = state.activePayload[0].payload.placa;
                if (onSelectTruck) onSelectTruck(clickedPlate);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="placa" 
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis 
              domain={[0, 'dataMax + 0.5']} 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={(v) => `${v.toFixed(1)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={3.05} stroke="#38bdf8" strokeDasharray="4 4" label={{ value: 'Meta Frota 3.05', fill: '#38bdf8', fontSize: 10, position: 'top' }} />
            <Bar 
              dataKey="consumo_medio_km_l" 
              radius={[6, 6, 0, 0]}
              cursor="pointer"
            >
              {ranking.map((entry, index) => {
                let color = '#10b981';
                if (entry.desempenho_status === 'NORMAL') color = '#f59e0b';
                if (entry.desempenho_status === 'ALERTA') color = '#f43f5e';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
