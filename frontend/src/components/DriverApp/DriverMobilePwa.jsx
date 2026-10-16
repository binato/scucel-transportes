import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Fuel, 
  Send, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  AlertTriangle,
  Plus
} from 'lucide-react';
import { 
  getPendingRecords, 
  savePendingRecord, 
  removePendingRecord, 
  clearAllPendingRecords, 
  saveLastPlate, 
  getLastPlate 
} from '../../services/offlineStorage';
import { createAbastecimento, uploadComprovante } from '../../services/api';
import { compressImage } from '../../services/images';
import ReceiptAttachmentPicker from '../ReceiptAttachmentPicker';

const fileAsDataUrl = file => new Promise((resolve, reject) => {
  if (!file) return resolve(null);
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Falha ao ler imagem'));
  reader.readAsDataURL(file);
});
const dataUrlAsFile = (dataUrl) => {
  const [header, body] = dataUrl.split(',');
  const mime = header.match(/data:(.*?);/)?.[1] || 'image/jpeg';
  const bytes = Uint8Array.from(atob(body), character => character.charCodeAt(0));
  return new File([bytes], 'comprovante.jpg', { type: mime });
};

export default function DriverMobilePwa({ veiculos, onSyncSuccess }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingRecords, setPendingRecords] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState(null);
  const lastAutoAttempt = useRef('');

  // Form State
  const [selectedPlate, setSelectedPlate] = useState(getLastPlate() || (veiculos[0]?.placa || ''));
  const [kmFinal, setKmFinal] = useState('');
  const [litrosDiesel, setLitrosDiesel] = useState('');
  const [litrosArla, setLitrosArla] = useState('');
  const [valorNota, setValorNota] = useState('');
  const [noteFile, setNoteFile] = useState(null);
  const [expenseFile, setExpenseFile] = useState(null);
  
  // Expense
  const [hasExpense, setHasExpense] = useState(false);
  const [despDesc, setDespDesc] = useState('');
  const [despVal, setDespVal] = useState('');
  const [despCat, setDespCat] = useState('OUTROS');

  useEffect(() => {
    if (!selectedPlate && veiculos.length) setSelectedPlate(veiculos[0].placa);
  }, [veiculos, selectedPlate]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setPendingRecords(getPendingRecords());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleVehicleChange = (plate) => {
    setSelectedPlate(plate);
    saveLastPlate(plate);
  };

  const handleReceiptSelection = async (file, setter) => {
    try { setter(await compressImage(file)); }
    catch (error) { setMsg({ type: 'error', text: error.message }); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlate || !kmFinal || !litrosDiesel || !valorNota) {
      setMsg({ type: 'error', text: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    const vehicleObj = veiculos.find(v => v.placa === selectedPlate);
    let receiptData;
    let expenseReceiptData;
    try {
      receiptData = await fileAsDataUrl(noteFile);
      expenseReceiptData = await fileAsDataUrl(expenseFile);
    } catch (error) { setMsg({ type: 'error', text: error.message }); return; }
    const payload = {
      client_id: crypto.randomUUID(),
      placa: selectedPlate,
      veiculo_id: vehicleObj ? vehicleObj.id : null,
      data: new Date().toISOString().split('T')[0],
      km_final: parseInt(kmFinal),
      litros_diesel: parseFloat(litrosDiesel),
      litros_arla: parseFloat(litrosArla) || 0,
      valor_total_nota: parseFloat(valorNota),
      origem_registro: 'PWA_MOTORISTA',
      receiptData,
      expenseReceiptData,
      despesa: hasExpense && despDesc && despVal ? {
        descricao: despDesc,
        valor: parseFloat(despVal),
        categoria: despCat
      } : null
    };

    if (!isOnline) {
      // Offline mode: save locally
      try {
        savePendingRecord(payload);
        setPendingRecords(getPendingRecords());
        setMsg({ type: 'warning', text: 'Sem internet: lançamento salvo neste aparelho para sincronização.' });
        resetForm();
      } catch (error) { setMsg({ type: 'error', text: 'Não foi possível salvar offline. Libere espaço neste aparelho.' }); }
    } else {
      // Online mode: send directly
      try {
        setSyncing(true);
        const noteUrl = receiptData ? await uploadComprovante(dataUrlAsFile(receiptData)) : null;
        const expenseUrl = expenseReceiptData ? await uploadComprovante(dataUrlAsFile(expenseReceiptData)) : null;
        await createAbastecimento({
          veiculo_id: payload.veiculo_id,
          client_id: payload.client_id,
          data: payload.data,
          km_final: payload.km_final,
          litros_diesel: payload.litros_diesel,
          litros_arla: payload.litros_arla,
          valor_total_nota: payload.valor_total_nota,
          origem_registro: 'PWA_MOTORISTA',
          foto_comprovante_url: noteUrl,
          despesa: payload.despesa ? { ...payload.despesa, foto_comprovante_url: expenseUrl } : null,
        });

        setMsg({ type: 'success', text: '✓ Abastecimento enviado diretamente para a central da Scucel!' });
        resetForm();
        if (onSyncSuccess) onSyncSuccess();
      } catch (err) {
        // fallback to offline queue
        try {
          savePendingRecord(payload);
          setPendingRecords(getPendingRecords());
          setMsg({ type: 'warning', text: 'Servidor indisponível. Salvo neste aparelho para sincronizar depois.' });
          resetForm();
        } catch (storageError) { setMsg({ type: 'error', text: 'Falha ao enviar e salvar offline. Tente novamente.' }); }
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleManualSync = useCallback(async () => {
    const list = getPendingRecords();
    if (list.length === 0) return;

    setSyncing(true);
    setMsg(null);
    let successCount = 0;

    for (const item of list) {
      try {
        const vehicleObj = veiculos.find(v => v.placa === item.placa);
        const vId = vehicleObj ? vehicleObj.id : item.veiculo_id;

        const noteUrl = item.receiptData ? await uploadComprovante(dataUrlAsFile(item.receiptData)) : null;
        const expenseUrl = item.expenseReceiptData ? await uploadComprovante(dataUrlAsFile(item.expenseReceiptData)) : null;
        await createAbastecimento({
          veiculo_id: vId,
          client_id: item.client_id || item.id_temp,
          data: item.data,
          km_final: item.km_final,
          litros_diesel: item.litros_diesel,
          litros_arla: item.litros_arla,
          valor_total_nota: item.valor_total_nota,
          origem_registro: 'PWA_MOTORISTA',
          foto_comprovante_url: noteUrl,
          despesa: item.despesa ? { ...item.despesa, foto_comprovante_url: expenseUrl } : null,
        });

        removePendingRecord(item.id_temp);
        successCount++;
      } catch (e) {
        console.error('Failed to sync item', item, e);
      }
    }

    setPendingRecords(getPendingRecords());
    setSyncing(false);
    setMsg({ type: successCount === list.length ? 'success' : 'warning', text: `${successCount} de ${list.length} lançamentos sincronizados.` });
    if (onSyncSuccess) onSyncSuccess();
  }, [veiculos, onSyncSuccess]);

  useEffect(() => {
    if (!isOnline) { lastAutoAttempt.current = ''; return; }
    if (!pendingRecords.length || syncing) return;
    const key = pendingRecords.map(item => item.client_id || item.id_temp).join(',');
    if (lastAutoAttempt.current === key) return;
    lastAutoAttempt.current = key;
    void handleManualSync();
  }, [isOnline, pendingRecords, syncing, handleManualSync]);

  const resetForm = () => {
    setKmFinal('');
    setLitrosDiesel('');
    setLitrosArla('');
    setValorNota('');
    setNoteFile(null);
    setExpenseFile(null);
    setHasExpense(false);
    setDespDesc('');
    setDespVal('');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
      
      {/* Smartphone Shell Frame Simulator */}
      <div style={{
        width: '100%',
        maxWidth: '430px',
        background: '#0a0f1d',
        border: '3px solid #334155',
        borderRadius: '36px',
        padding: '1.25rem',
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 30px rgba(59, 130, 246, 0.15)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Mobile Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0 0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
            <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#fff' }}>Scucel Motorista</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '12px',
            background: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: `1px solid ${isOnline ? '#10b98140' : '#f59e0b40'}`,
            fontSize: '0.7rem',
            color: isOnline ? '#34d399' : '#fbbf24',
            fontWeight: '700'
          }}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span>{isOnline ? 'Online 4G' : 'Sem Sinal (Offline)'}</span>
          </div>
        </div>

        {/* Offline Queue Badge Banner */}
        {pendingRecords.length > 0 && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '0.65rem 0.85rem',
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#fbbf24' }}>
              <Clock size={14} />
              <span><strong>{pendingRecords.length}</strong> abastecimento(s) no celular</span>
            </div>

            <button
              onClick={handleManualSync}
              disabled={syncing || !isOnline}
              style={{
                background: '#f59e0b',
                color: '#000',
                fontWeight: '700',
                border: 'none',
                padding: '0.25rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.7rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                opacity: (!isOnline || syncing) ? 0.5 : 1
              }}
            >
              <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
              <span>Sincronizar</span>
            </button>
          </div>
        )}

        {msg && (
          <div style={{
            padding: '0.55rem 0.75rem',
            borderRadius: '8px',
            fontSize: '0.75rem',
            marginBottom: '0.85rem',
            background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : (msg.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)'),
            border: `1px solid ${msg.type === 'success' ? '#10b98140' : (msg.type === 'warning' ? '#f59e0b40' : '#f43f5e40')}`,
            color: msg.type === 'success' ? '#34d399' : (msg.type === 'warning' ? '#fbbf24' : '#fb7185')
          }}>
            {msg.text}
          </div>
        )}

        {/* Mobile Input Form */}
        <form className="driver-pwa-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          {/* Truck selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>
              Placa do Caminhão
            </label>
            <select
              className="input-custom"
              value={selectedPlate}
              onChange={(e) => handleVehicleChange(e.target.value)}
              style={{ width: '100%', fontSize: '0.95rem', fontWeight: '800', color: '#60a5fa', padding: '0.65rem' }}
            >
              {veiculos.map(v => (
                <option key={v.id} value={v.placa}>
                  {v.placa} ({v.modelo})
                </option>
              ))}
            </select>
          </div>

          {/* KM Atual */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>
              KM Atual no Painel
            </label>
            <input
              type="number"
              className="input-custom"
              placeholder="Ex: 625462"
              value={kmFinal}
              onChange={(e) => setKmFinal(e.target.value)}
              style={{ width: '100%', fontSize: '1.15rem', fontWeight: '800', padding: '0.65rem' }}
              required
            />
          </div>

          {/* Litros Diesel & Arla */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.6rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>
                Litros Diesel
              </label>
              <input
                type="number"
                step="0.01"
                className="input-custom"
                placeholder="Ex: 529.62"
                value={litrosDiesel}
                onChange={(e) => setLitrosDiesel(e.target.value)}
                style={{ width: '100%', fontSize: '1rem', fontWeight: '700', padding: '0.6rem' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                Litros ARLA
              </label>
              <input
                type="number"
                step="0.01"
                className="input-custom"
                placeholder="0.00"
                value={litrosArla}
                onChange={(e) => setLitrosArla(e.target.value)}
                style={{ width: '100%', fontSize: '1rem', padding: '0.6rem' }}
              />
            </div>
          </div>

          {/* Valor da Nota */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>
              Valor Total da Nota (R$)
            </label>
            <input
              type="number"
              step="0.01"
              className="input-custom"
              placeholder="Ex: 3029.31"
              value={valorNota}
              onChange={(e) => setValorNota(e.target.value)}
              style={{ width: '100%', fontSize: '1.15rem', fontWeight: '800', color: '#34d399', padding: '0.65rem' }}
              required
            />
          </div>

          {/* Despesa Extra */}
          <label>Foto da nota de combustível
            <input className="input-custom" type="file" accept="image/*" capture="environment" onChange={async event => {
              try { setNoteFile(await compressImage(event.target.files?.[0])); }
              catch (error) { setMsg({ type: 'error', text: error.message }); }
            }} />
          </label>
          <ReceiptAttachmentPicker
            label="Foto da nota de combustível"
            file={noteFile}
            onSelect={file => handleReceiptSelection(file, setNoteFile)}
            onClear={() => setNoteFile(null)}
            cameraEnabled
          />
          {noteFile && <small>Imagem compactada: {Math.round(noteFile.size / 1024)} KB</small>}
          <div style={{ background: '#111827', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#e2e8f0', cursor: 'pointer', fontWeight: '600' }}>
              <input
                type="checkbox"
                checked={hasExpense}
                onChange={(e) => setHasExpense(e.target.checked)}
                style={{ accentColor: '#a855f7' }}
              />
              <span>Teve despesa de viagem?</span>
            </label>

            {hasExpense && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                <label>Foto do comprovante da despesa
                  <input className="input-custom" type="file" accept="image/*" capture="environment" onChange={async event => {
                    try { setExpenseFile(await compressImage(event.target.files?.[0])); }
                    catch (error) { setMsg({ type: 'error', text: error.message }); }
                  }} />
                </label>
                <ReceiptAttachmentPicker
                  label="Foto do comprovante da despesa"
                  file={expenseFile}
                  onSelect={file => handleReceiptSelection(file, setExpenseFile)}
                  onClear={() => setExpenseFile(null)}
                  cameraEnabled
                />
                <input
                  type="text"
                  className="input-custom"
                  placeholder="Descrição (ex: Conserto Pneu)"
                  value={despDesc}
                  onChange={(e) => setDespDesc(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8rem' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                  <select
                    className="input-custom"
                    value={despCat}
                    onChange={(e) => setDespCat(e.target.value)}
                    style={{ fontSize: '0.75rem' }}
                  >
                    <option value="PNEUS">Pneu/Borracheiro</option>
                    <option value="MECANICA_PECAS">Peça/Mecânica</option>
                    <option value="LAVAGEM">Lavagem</option>
                    <option value="DIARIAS_ESTRADA">Hotel/Diária</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    className="input-custom"
                    placeholder="Valor R$"
                    value={despVal}
                    onChange={(e) => setDespVal(e.target.value)}
                    style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: '700' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={syncing}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontSize: '1rem',
              justifyContent: 'center',
              borderRadius: '12px',
              marginTop: '0.35rem'
            }}
          >
            <Send size={18} />
            <span>{isOnline ? 'Gravar Abastecimento' : 'Salvar no Celular (Offline)'}</span>
          </button>

        </form>

        <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.85rem' }}>
          📱 Funciona sem internet. Os dados são sincronizados automaticamente.
        </p>

      </div>

    </div>
  );
}
