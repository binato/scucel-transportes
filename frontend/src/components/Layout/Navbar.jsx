import React from 'react';
import { 
  BarChart3, 
  Camera, 
  Keyboard, 
  Smartphone, 
  Truck, 
  Activity, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, apiOnline }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Analítico', icon: BarChart3, badge: 'Power BI' },
    { id: 'ia-vision', label: 'Conferência IA (WhatsApp)', icon: Camera, badge: 'IA Grátis' },
    { id: 'manual-entry', label: 'Digitação Rápida', icon: Keyboard, badge: null },
    { id: 'driver-app', label: 'App Motorista (PWA)', icon: Smartphone, badge: 'Offline' },
    { id: 'fleet', label: 'Frota & Metas', icon: Truck, badge: null },
  ];

  return (
    <header className="glass-panel" style={{ margin: '1rem 1.25rem 1.25rem 1.25rem', padding: '0.85rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Logo & Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
          }}>
            <Truck size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff' }}>
                SCUCEL
              </span>
              <span style={{ 
                fontSize: '0.7rem', 
                background: 'rgba(59, 130, 246, 0.2)', 
                color: '#60a5fa', 
                padding: '0.15rem 0.45rem', 
                borderRadius: '4px',
                fontWeight: '700',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                TRANSPORTES
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
              Torre de Controle Operacional & Eficiência Energética
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0e1524', padding: '0.3rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  background: isActive ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                  boxShadow: isActive ? '0 2px 10px rgba(37, 99, 235, 0.35)' : 'none',
                  transition: 'all 0.18s ease'
                }}
              >
                <Icon size={16} color={isActive ? '#ffffff' : '#94a3b8'} />
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '0.62rem',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    fontWeight: '700',
                    background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(59, 130, 246, 0.15)',
                    color: isActive ? '#fff' : '#60a5fa'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            background: apiOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            border: `1px solid ${apiOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            fontSize: '0.75rem',
            color: apiOnline ? '#34d399' : '#fb7185',
            fontWeight: '600'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: apiOnline ? '#10b981' : '#f43f5e',
              boxShadow: `0 0 8px ${apiOnline ? '#10b981' : '#f43f5e'}`
            }} />
            <span>{apiOnline ? 'Servidor Conectado' : 'Conectando...'}</span>
          </div>
        </div>

      </div>
    </header>
  );
}
