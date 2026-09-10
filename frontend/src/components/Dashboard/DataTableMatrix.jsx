import React, { useState } from 'react';
import { 
  Table, 
  Search, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Layers, 
  Fuel, 
  Wrench,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function DataTableMatrix({
  abastecimentos,
  despesas,
  onDeleteAbastecimento,
  onDeleteDespesa
}) {
  const [activeTab, setActiveTab] = useState('abastecimentos');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Filter list by search term
  const filteredAbasts = (abastecimentos || []).filter(a => 
    (a.placa && a.placa.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.data && a.data.includes(searchTerm)) ||
    (a.origem_registro && a.origem_registro.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredDespesas = (despesas || []).filter(d => 
    (d.placa && d.placa.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (d.descricao && d.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (d.categoria && d.categoria.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (d.data && d.data.includes(searchTerm))
  );

  const currentList = activeTab === 'abastecimentos' ? filteredAbasts : filteredDespesas;
  const totalPages = Math.ceil(currentList.length / pageSize) || 1;
  const paginatedData = currentList.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      
      {/* Header Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        
        {/* Tab switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0e1524', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => { setActiveTab('abastecimentos'); setPage(1); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: activeTab === 'abastecimentos' ? '700' : '500',
              background: activeTab === 'abastecimentos' ? '#2563eb' : 'transparent',
              color: activeTab === 'abastecimentos' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            <Fuel size={14} />
            <span>Abastecimentos ({abastecimentos.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('despesas'); setPage(1); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: activeTab === 'despesas' ? '700' : '500',
              background: activeTab === 'despesas' ? '#8b5cf6' : 'transparent',
              color: activeTab === 'despesas' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            <Wrench size={14} />
            <span>Despesas & Manutenções ({despesas.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px' }} />
          <input
            type="text"
            className="input-custom"
            placeholder="Buscar placa, data, descrição..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            style={{ paddingLeft: '32px', fontSize: '0.8rem', width: '240px' }}
          />
        </div>

      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
        {activeTab === 'abastecimentos' ? (
          <table className="powerbi-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Data</th>
                <th>KM Inicial</th>
                <th>KM Final</th>
                <th>KM Rodado</th>
                <th>Diesel (L)</th>
                <th>ARLA (L)</th>
                <th>Valor Nota (R$)</th>
                <th>Média (KM/L)</th>
                <th>Custo/KM</th>
                <th>Origem</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                paginatedData.map((a) => (
                  <tr key={a.id}>
                    <td><strong style={{ color: '#60a5fa' }}>{a.placa}</strong></td>
                    <td>{a.data}</td>
                    <td>{a.km_inicial ? a.km_inicial.toLocaleString('pt-BR') : '-'}</td>
                    <td><strong>{a.km_final ? a.km_final.toLocaleString('pt-BR') : '-'}</strong></td>
                    <td><span style={{ color: '#38bdf8' }}>{a.km_rodado ? a.km_rodado.toLocaleString('pt-BR') : '-'}</span></td>
                    <td>{a.litros_diesel ? a.litros_diesel.toFixed(2) : '-'}</td>
                    <td>{a.litros_arla ? a.litros_arla.toFixed(2) : '0.00'}</td>
                    <td><strong>R$ {a.valor_total_nota ? a.valor_total_nota.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'}</strong></td>
                    <td>
                      <span style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        background: (a.media_km_l >= 3.0) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                        color: (a.media_km_l >= 3.0) ? '#34d399' : '#fb7185'
                      }}>
                        {a.media_km_l ? `${a.media_km_l.toFixed(2)}` : '-'}
                      </span>
                    </td>
                    <td>{a.custo_km_diesel ? `R$ ${a.custo_km_diesel.toFixed(2)}` : '-'}</td>
                    <td>
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '3px',
                        background: a.origem_registro === 'IA_VISION' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.06)',
                        color: a.origem_registro === 'IA_VISION' ? '#c084fc' : '#94a3b8'
                      }}>
                        {a.origem_registro}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => onDeleteAbastecimento && onDeleteAbastecimento(a.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }}
                        title="Excluir registro"
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#fb7185'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="powerbi-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Data</th>
                <th>Categoria</th>
                <th>Descrição do Serviço / Peça</th>
                <th>Valor (R$)</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Nenhuma despesa encontrada.
                  </td>
                </tr>
              ) : (
                paginatedData.map((d) => (
                  <tr key={d.id}>
                    <td><strong style={{ color: '#60a5fa' }}>{d.placa}</strong></td>
                    <td>{d.data}</td>
                    <td>
                      <span style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#c084fc'
                      }}>
                        {d.categoria}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500', color: '#f8fafc' }}>{d.descricao}</td>
                    <td><strong style={{ color: '#fbbf24' }}>R$ {d.valor ? d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</strong></td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => onDeleteDespesa && onDeleteDespesa(d.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }}
                        title="Excluir despesa"
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#fb7185'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.85rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <span>
          Mostrando <strong>{paginatedData.length}</strong> de <strong>{currentList.length}</strong> itens
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="btn-secondary"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', opacity: page <= 1 ? 0.4 : 1 }}
          >
            <ChevronLeft size={14} />
          </button>
          <span>Página {page} de {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="btn-secondary"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', opacity: page >= totalPages ? 0.4 : 1 }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

    </div>
  );
}
