import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Check, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Plus, 
  Trash2, 
  AlertCircle,
  FileCheck,
  Fuel,
  Image as ImageIcon
} from 'lucide-react';
import { extractImageAi, loadSamplePhoto, createBulkLote, API_BASE_URL } from '../../services/api';

export default function SideBySideReviewModal({ veiculos, onSuccessSave }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Extracted Data
  const [selectedVehicleId, setSelectedVehicleId] = useState(veiculos.length > 0 ? veiculos[0].id : '');
  const [documentMonth, setDocumentMonth] = useState('2026-06');
  const [rows, setRows] = useState([]);
  const [aiNotice, setAiNotice] = useState(null);

  // Image controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingAi(true);

    try {
      const data = await extractImageAi(file);
      populateExtractedData(data);
    } catch (err) {
      setErrorMsg('Falha ao processar com IA: ' + err.message);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleLoadSample = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingAi(true);

    try {
      const data = await loadSamplePhoto();
      setPreviewUrl(`${API_BASE_URL}${data.foto_url}`);
      populateExtractedData(data);
    } catch (err) {
      setErrorMsg('Falha ao carregar amostra: ' + err.message);
    } finally {
      setLoadingAi(false);
    }
  };

  const populateExtractedData = (data) => {
    setAiNotice(data.aviso);
    if (data.placa_detectada) {
      const match = veiculos.find(v => v.placa.toUpperCase() === data.placa_detectada.toUpperCase());
      if (match) setSelectedVehicleId(match.id);
    }
    if (data.data_documento) {
      setDocumentMonth(data.data_documento);
    }

    if (data.linhas && data.linhas.length > 0) {
      const formatted = data.linhas.map((l, idx) => ({
        id: idx + 1,
        data: l.data || `${documentMonth}-01`,
        km_final: l.km_atual || 0,
        litros_diesel: l.litros_diesel || 0,
        litros_arla: l.litros_arla || 0,
        valor_total_nota: l.valor_total_nota || 0,
        despesa_descricao: l.despesa_descricao || '',
        despesa_valor: l.despesa_valor || 0,
        despesa_categoria: 'OUTROS',
        confianca: l.confianca || 0.95
      }));
      setRows(formatted);
    }
  };

  const handleRowChange = (id, field, val) => {
    setRows(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, [field]: val };
      }
      return r;
    }));
  };

  const handleAddRow = () => {
    const last = rows[rows.length - 1];
    setRows(prev => [
      ...prev,
      {
        id: Date.now(),
        data: last ? last.data : `${documentMonth}-01`,
        km_final: last ? last.km_final + 500 : 0,
        litros_diesel: 200,
        litros_arla: 15,
        valor_total_nota: 1200,
        despesa_descricao: '',
        despesa_valor: 0,
        despesa_categoria: 'OUTROS',
        confianca: 1.0
      }
    ]);
  };

  const handleRemoveRow = (id) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleSaveToDatabase = async () => {
    if (!selectedVehicleId) {
      setErrorMsg('Selecione o caminhão correspondente.');
      return;
    }
    if (rows.length === 0) {
      setErrorMsg('Nenhuma linha para salvar.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      const payload = {
        veiculo_id: parseInt(selectedVehicleId),
        origem: 'IA_VISION',
        foto_url: previewUrl,
        itens: rows.map(r => ({
          data: r.data,
          km_final: parseInt(r.km_final),
          litros_diesel: parseFloat(r.litros_diesel),
          litros_arla: parseFloat(r.litros_arla || 0),
          valor_total_nota: parseFloat(r.valor_total_nota),
          despesa_descricao: r.despesa_descricao || null,
          despesa_valor: parseFloat(r.despesa_valor || 0),
          despesa_categoria: r.despesa_categoria || 'OUTROS'
        }))
      };

      const res = await createBulkLote(payload);
      setSuccessMsg(`✓ Sucesso! ${res.abastecimentos_criados} abastecimentos e ${res.despesas_criadas} despesas gravadas para a placa ${res.placa}.`);
      if (onSuccessSave) onSuccessSave();
    } catch (err) {
      setErrorMsg('Erro ao salvar no banco: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.35fr', gap: '1.25rem', height: 'calc(100vh - 180px)', minHeight: '600px' }}>
      
      {/* LEFT COLUMN: Photo Viewer */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={18} color="#60a5fa" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', margin: 0 }}>
              Foto da Folha do Motorista (WhatsApp)
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={handleLoadSample}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: '#1e293b' }}
              title="Carregar foto real Planilha-Motorista.jpeg"
            >
              <FileCheck size={14} color="#38bdf8" />
              <span>Carregar Foto Exemplo</span>
            </button>

            <label className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer' }}>
              <Upload size={14} />
              <span>Enviar Foto</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Image Controls */}
        {previewUrl && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: '#0e1524', borderRadius: '6px', marginBottom: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <button 
                onClick={() => setZoom(z => Math.max(0.6, z - 0.2))} 
                className="btn-secondary" 
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
              >
                <ZoomOut size={13} />
              </button>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{(zoom * 100).toFixed(0)}%</span>
              <button 
                onClick={() => setZoom(z => Math.min(2.5, z + 0.2))} 
                className="btn-secondary" 
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
              >
                <ZoomIn size={13} />
              </button>
            </div>
            <button 
              onClick={() => setRotation(r => (r + 90) % 360)} 
              className="btn-secondary" 
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
            >
              <RotateCw size={13} /> Rotacionar
            </button>
          </div>
        )}

        {/* Image Preview Container */}
        <div style={{
          flex: 1,
          background: '#090d16',
          borderRadius: '8px',
          border: '1px dashed var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          position: 'relative',
          padding: '0.5rem'
        }}>
          {loadingAi && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(10, 15, 29, 0.85)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              zIndex: 20
            }}>
              <div className="animate-pulse-glow" style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={24} color="#fff" />
              </div>
              <p style={{ fontWeight: '700', color: '#60a5fa', fontSize: '0.9rem' }}>
                IA Reconhecendo Caligrafia & Tabela...
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Extraindo Data, KM, Litros Diesel, ARLA e Despesas
              </p>
            </div>
          )}

          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Planilha Motorista"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease',
                borderRadius: '4px',
                boxShadow: '0 5px 20px rgba(0,0,0,0.6)'
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <ImageIcon size={48} color="#334155" style={{ marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: '600', color: '#94a3b8' }}>Nenhuma foto carregada</p>
              <p style={{ fontSize: '0.78rem', marginTop: '0.3rem' }}>
                Clique em <strong>"Carregar Foto Exemplo"</strong> ou envie uma foto recebida no WhatsApp
              </p>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Interactive Verification Grid */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header and Vehicle Selection */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="#a855f7" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', margin: 0 }}>
              Conferência dos Dados Extraídos
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Caminhão:</span>
            <select
              className="input-custom"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.65rem', fontWeight: '700', color: '#60a5fa' }}
            >
              {veiculos.map(v => (
                <option key={v.id} value={v.id}>
                  {v.placa} ({v.modelo})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notices and Alerts */}
        {aiNotice && (
          <div style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '0.75rem', color: '#93c5fd', marginBottom: '0.65rem' }}>
            ℹ️ {aiNotice}
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', fontSize: '0.78rem', color: '#fb7185', marginBottom: '0.65rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.78rem', color: '#34d399', marginBottom: '0.65rem' }}>
            {successMsg}
          </div>
        )}

        {/* Editable Table */}
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px', marginBottom: '0.75rem' }}>
          <table className="powerbi-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Data</th>
                <th>KM Atual</th>
                <th>Diesel (L)</th>
                <th>ARLA (L)</th>
                <th>Valor Nota (R$)</th>
                <th>Despesa</th>
                <th>Valor Desp (R$)</th>
                <th style={{ width: '35px' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Nenhum dado extraído ainda. Envie uma foto ou clique em "Carregar Foto Exemplo".
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{idx + 1}</td>
                    <td>
                      <input
                        type="date"
                        className="input-custom"
                        value={r.data}
                        onChange={(e) => handleRowChange(r.id, 'data', e.target.value)}
                        style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', width: '120px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input-custom"
                        value={r.km_final}
                        onChange={(e) => handleRowChange(r.id, 'km_final', e.target.value)}
                        style={{ padding: '0.25rem 0.4rem', fontSize: '0.78rem', width: '95px', fontWeight: '700' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="input-custom"
                        value={r.litros_diesel}
                        onChange={(e) => handleRowChange(r.id, 'litros_diesel', e.target.value)}
                        style={{ padding: '0.25rem 0.4rem', fontSize: '0.78rem', width: '80px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="input-custom"
                        value={r.litros_arla}
                        onChange={(e) => handleRowChange(r.id, 'litros_arla', e.target.value)}
                        style={{ padding: '0.25rem 0.4rem', fontSize: '0.78rem', width: '70px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="input-custom"
                        value={r.valor_total_nota}
                        onChange={(e) => handleRowChange(r.id, 'valor_total_nota', e.target.value)}
                        style={{ padding: '0.25rem 0.4rem', fontSize: '0.78rem', width: '95px', color: '#60a5fa', fontWeight: '700' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Ex: Pneu, Lavagem"
                        className="input-custom"
                        value={r.despesa_descricao}
                        onChange={(e) => handleRowChange(r.id, 'despesa_descricao', e.target.value)}
                        style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', width: '120px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="input-custom"
                        value={r.despesa_valor || ''}
                        onChange={(e) => handleRowChange(r.id, 'despesa_valor', e.target.value)}
                        style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', width: '80px', color: '#fbbf24' }}
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => handleRemoveRow(r.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={handleAddRow}
            className="btn-secondary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
          >
            <Plus size={14} /> Adicionar Linha
          </button>

          <button
            onClick={handleSaveToDatabase}
            disabled={saving || rows.length === 0}
            className="btn-success"
            style={{ padding: '0.55rem 1.4rem', fontSize: '0.85rem' }}
          >
            <Check size={16} />
            <span>{saving ? 'Gravando no Sistema...' : 'Confirmar & Gravar no Sistema'}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
