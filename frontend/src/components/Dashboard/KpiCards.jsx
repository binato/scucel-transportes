import React from 'react';
import { 
  Fuel, 
  DollarSign, 
  Gauge, 
  TrendingUp, 
  Wrench, 
  Droplet, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function KpiCards({ kpis }) {
  if (!kpis) return null;

  const isKmEfficient = kpis.consumo_medio_frota >= kpis.meta_consumo_frota;
  const arlaCompliant = kpis.proporcao_arla_diesel_pct >= 4.0 && kpis.proporcao_arla_diesel_pct <= 9.0;
  const pctExpenses = kpis.valor_operacional_total > 0 
    ? ((kpis.valor_despesas_total / kpis.valor_operacional_total) * 100).toFixed(1) 
    : 0;

  const cards = [
    {
      id: 'kpi-kml',
      title: 'Consumo Médio da Frota',
      value: `${kpis.consumo_medio_frota.toFixed(2)}`,
      unit: 'KM/L',
      subtext: `Meta de Referência: ${kpis.meta_consumo_frota.toFixed(2)} KM/L`,
      glowClass: isKmEfficient ? 'kpi-glow-emerald' : 'kpi-glow-amber',
      badgeColor: isKmEfficient ? '#10b981' : '#f59e0b',
      badgeText: isKmEfficient ? 'Econômico' : 'Abaixo da Meta',
      icon: Gauge,
      iconColor: isKmEfficient ? '#34d399' : '#fbbf24',
    },
    {
      id: 'kpi-custo-km',
      title: 'Custo Total por KM',
      value: `R$ ${kpis.custo_por_km_total.toFixed(2)}`,
      unit: '/ km',
      subtext: 'Diesel + ARLA + Manutenções',
      glowClass: 'kpi-glow-blue',
      badgeColor: '#3b82f6',
      badgeText: `${kpis.qtd_abastecimentos} registros`,
      icon: DollarSign,
      iconColor: '#60a5fa',
    },
    {
      id: 'kpi-km-rodado',
      title: 'KM Total Rodado',
      value: `${kpis.km_total_rodado.toLocaleString('pt-BR')}`,
      unit: 'KM',
      subtext: `${kpis.qtd_veiculos_ativos} caminhões em operação`,
      glowClass: 'kpi-glow-cyan',
      badgeColor: '#06b6d4',
      badgeText: 'Odômetro Total',
      icon: TrendingUp,
      iconColor: '#22d3ee',
    },
    {
      id: 'kpi-diesel',
      title: 'Combustível (Diesel)',
      value: `R$ ${kpis.valor_diesel_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      unit: '',
      subtext: `${kpis.litros_diesel_total.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} Litros Abastecidos`,
      glowClass: 'kpi-glow-blue',
      badgeColor: '#3b82f6',
      badgeText: 'Principal Custo',
      icon: Fuel,
      iconColor: '#60a5fa',
    },
    {
      id: 'kpi-despesas',
      title: 'Despesas & Manutenções',
      value: `R$ ${kpis.valor_despesas_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      unit: '',
      subtext: `${pctExpenses}% do Custo Operacional Total`,
      glowClass: 'kpi-glow-purple',
      badgeColor: '#8b5cf6',
      badgeText: 'Pneus / Peças / Estrada',
      icon: Wrench,
      iconColor: '#c084fc',
    },
    {
      id: 'kpi-arla',
      title: 'Auditoria ARLA 32',
      value: `${kpis.proporcao_arla_diesel_pct.toFixed(2)}%`,
      unit: 'do diesel',
      subtext: `${kpis.litros_arla_total.toLocaleString('pt-BR')} Litros consumidos (Meta: 5% a 7%)`,
      glowClass: arlaCompliant ? 'kpi-glow-emerald' : 'kpi-glow-rose',
      badgeColor: arlaCompliant ? '#10b981' : '#f43f5e',
      badgeText: arlaCompliant ? 'Conforme' : 'Atenção Arla',
      icon: Droplet,
      iconColor: arlaCompliant ? '#34d399' : '#fb7185',
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem'
    }}>
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            className={`glass-panel glass-card-interactive ${c.glowClass}`}
            style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {c.title}
                </span>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={18} color={c.iconColor} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <span className="number-metric" style={{ fontSize: '1.65rem', color: '#ffffff' }}>
                  {c.value}
                </span>
                {c.unit && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {c.unit}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {c.subtext}
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: '700',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                background: `${c.badgeColor}20`,
                color: c.badgeColor,
                border: `1px solid ${c.badgeColor}40`
              }}>
                {c.badgeText}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
