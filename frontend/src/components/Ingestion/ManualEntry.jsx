import React, { useEffect, useState } from 'react';
import { createAbastecimento, updateAbastecimento, fetchAbastecimentos, fetchContexto, uploadComprovante, API_BASE_URL } from '../../services/api';
import { compressImage } from '../../services/images';

const today = () => new Date().toLocaleDateString('en-CA');
const fmt = value => value ? value.split('-').reverse().join('/') : '-';

export default function ManualEntry({ veiculos, onSuccessSave }) {
  const [vehicleId, setVehicleId] = useState('');
  const [records, setRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [date, setDate] = useState(today());
  const [km, setKm] = useState('');
  const [initialKm, setInitialKm] = useState('');
  const [diesel, setDiesel] = useState('');
  const [arla, setArla] = useState('0');
  const [value, setValue] = useState('');
  const [noteUrl, setNoteUrl] = useState('');
  const [expenseUrl, setExpenseUrl] = useState('');
  const [noteFile, setNoteFile] = useState(null);
  const [expenseFile, setExpenseFile] = useState(null);
  const [hasExpense, setHasExpense] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('OUTROS');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseValue, setExpenseValue] = useState('');
  const [context, setContext] = useState({ anterior: null, seguinte: null });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!vehicleId && veiculos.length) setVehicleId(String(veiculos[0].id));
  }, [veiculos, vehicleId]);

  const refresh = async () => {
    if (!vehicleId) return;
    const items = await fetchAbastecimentos({ veiculo_id: vehicleId, ano: null });
    setRecords(items);
  };
  useEffect(() => { refresh().catch(err => setMessage(err.message)); }, [vehicleId]);
  useEffect(() => {
    if (!vehicleId || !date) return;
    fetchContexto(vehicleId, date, Number(km) || 0, editingId)
      .then(setContext).catch(err => setMessage(err.message));
  }, [vehicleId, date, km, editingId, records]);

  const clear = () => {
    setEditingId(null); setDate(today()); setKm(''); setInitialKm(''); setDiesel(''); setArla('0'); setValue('');
    setNoteUrl(''); setExpenseUrl(''); setNoteFile(null); setExpenseFile(null);
    setHasExpense(false); setExpenseCategory('OUTROS'); setExpenseDescription(''); setExpenseValue('');
  };

  const load = (entry, duplicate = false) => {
    const expense = entry.despesa;
    setVehicleId(String(entry.veiculo_id));
    setEditingId(duplicate ? null : entry.id);
    setDate(duplicate ? today() : entry.data);
    setKm(duplicate ? '' : String(entry.km_final));
    setInitialKm(duplicate ? '' : String(entry.km_inicial ?? ''));
    setDiesel(String(entry.litros_diesel)); setArla(String(entry.litros_arla || 0));
    setValue(String(entry.valor_total_nota));
    setNoteUrl(duplicate ? '' : (entry.foto_comprovante_url || ''));
    setExpenseUrl(duplicate ? '' : (expense?.foto_comprovante_url || ''));
    setNoteFile(null); setExpenseFile(null);
    setHasExpense(Boolean(expense)); setExpenseCategory(expense?.categoria || 'OUTROS');
    setExpenseDescription(expense?.descricao || ''); setExpenseValue(expense ? String(expense.valor) : '');
    setMessage(duplicate ? 'Cópia preparada. Informe data e KM antes de salvar.' : `Editando entrada de ${fmt(entry.data)}.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async event => {
    event.preventDefault();
    setMessage('');
    const kmNumber = Number(km);
    if (!Number.isInteger(kmNumber) || kmNumber <= 0 || Number(diesel) <= 0 || Number(value) < 0) {
      setMessage('Confira KM, litros e valor da nota.'); return;
    }
    if (context.anterior && kmNumber <= context.anterior.km_final) {
      setMessage('O KM precisa superar o lançamento anterior.'); return;
    }
    if (context.seguinte && kmNumber >= context.seguinte.km_final) {
      setMessage('O KM precisa ser menor que o lançamento seguinte.'); return;
    }
    if (hasExpense && (!expenseDescription.trim() || Number(expenseValue) <= 0)) {
      setMessage('Preencha descrição e valor da despesa.'); return;
    }
    setSaving(true);
    try {
      const uploadedNote = noteFile ? await uploadComprovante(noteFile) : noteUrl;
      const uploadedExpense = hasExpense && expenseFile ? await uploadComprovante(expenseFile) : expenseUrl;
      const payload = {
        veiculo_id: Number(vehicleId), data: date, km_final: kmNumber,
        km_inicial: context.anterior ? null : (initialKm === '' ? null : Number(initialKm)),
        litros_diesel: Number(diesel), litros_arla: Number(arla) || 0,
        valor_total_nota: Number(value), origem_registro: 'MANUAL',
        foto_comprovante_url: uploadedNote || null,
        despesa: hasExpense ? {
          categoria: expenseCategory, descricao: expenseDescription.trim(),
          valor: Number(expenseValue), foto_comprovante_url: uploadedExpense || null,
        } : null,
      };
      if (editingId) await updateAbastecimento(editingId, payload);
      else await createAbastecimento(payload);
      clear();
      await refresh();
      onSuccessSave?.();
      setMessage('Lançamento salvo com sucesso.');
    } catch (error) { setMessage(error.message); }
    finally { setSaving(false); }
  };

  const handleImage = async (event, setter) => {
    try { setter(await compressImage(event.target.files?.[0])); }
    catch (error) { setMessage(error.message); }
  };

  const previousKm = context.anterior?.km_final ?? (initialKm === '' ? null : Number(initialKm));
  const distance = previousKm == null ? null : Number(km) - previousKm;
  return <div className="glass-panel manual-entry">
    <h2>Digitação de abastecimentos</h2>
    {message && <p role="status" className="form-message">{message}</p>}
    <form onSubmit={submit}>
      <div className="form-grid">
        <label>Caminhão<select className="input-custom" value={vehicleId} onChange={event => { setVehicleId(event.target.value); clear(); }} required>
          {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
        </select></label>
        <label>Data<input className="input-custom" type="date" value={date} onChange={event => setDate(event.target.value)} required /></label>
        <label>KM do odômetro<input className="input-custom" type="number" min="1" step="1" value={km} onChange={event => setKm(event.target.value)} required /></label>
        {!context.anterior && <label>KM inicial de referência (opcional)<input className="input-custom" type="number" min="0" step="1" value={initialKm} onChange={event => setInitialKm(event.target.value)} /></label>}
        <label>Diesel (L)<input className="input-custom" type="number" min="0.01" step="0.01" value={diesel} onChange={event => setDiesel(event.target.value)} required /></label>
        <label>ARLA (L)<input className="input-custom" type="number" min="0" step="0.01" value={arla} onChange={event => setArla(event.target.value)} /></label>
        <label>Valor da nota (R$)<input className="input-custom" type="number" min="0" step="0.01" value={value} onChange={event => setValue(event.target.value)} required /></label>
      </div>
      <p className="entry-context">Anterior: {previousKm?.toLocaleString('pt-BR') ?? 'nenhum'} KM · Seguinte: {context.seguinte?.km_final.toLocaleString('pt-BR') ?? 'nenhum'} KM · Percurso: {distance != null && distance >= 0 ? `${distance.toLocaleString('pt-BR')} KM` : '—'}</p>
      <div className="form-grid">
        <label>Imagem da nota de combustível<input className="input-custom" type="file" accept="image/*" capture="environment" onChange={event => handleImage(event, setNoteFile)} /></label>
        {(noteFile || noteUrl) && <a href={noteFile ? URL.createObjectURL(noteFile) : `${API_BASE_URL}${noteUrl}`} target="_blank" rel="noreferrer">Ver comprovante</a>}
      </div>
      <label className="check-label"><input type="checkbox" checked={hasExpense} onChange={event => setHasExpense(event.target.checked)} /> Houve outra despesa?</label>
      {hasExpense && <div className="form-grid">
        <label>Categoria<select className="input-custom" value={expenseCategory} onChange={event => setExpenseCategory(event.target.value)}><option value="OUTROS">Outros</option><option value="PNEUS">Pneus</option><option value="MECANICA_PECAS">Mecânica</option><option value="LAVAGEM">Lavagem</option><option value="DIARIAS_ESTRADA">Diárias</option></select></label>
        <label>Descrição<input className="input-custom" value={expenseDescription} onChange={event => setExpenseDescription(event.target.value)} required /></label>
        <label>Valor (R$)<input className="input-custom" type="number" min="0.01" step="0.01" value={expenseValue} onChange={event => setExpenseValue(event.target.value)} required /></label>
        <label>Imagem da despesa<input className="input-custom" type="file" accept="image/*" capture="environment" onChange={event => handleImage(event, setExpenseFile)} /></label>
        {(expenseFile || expenseUrl) && <a href={expenseFile ? URL.createObjectURL(expenseFile) : `${API_BASE_URL}${expenseUrl}`} target="_blank" rel="noreferrer">Ver comprovante da despesa</a>}
      </div>}
      <div className="form-actions"><button className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar edição' : 'Adicionar entrada'}</button>{editingId && <button type="button" className="btn-secondary" onClick={clear}>Cancelar edição</button>}</div>
    </form>
    <h3>Últimas entradas do caminhão</h3>
    <div className="recent-entries">{records.slice(0, 20).map(entry => <article key={entry.id} className="recent-entry">
      <div><strong>{fmt(entry.data)}</strong> · {entry.km_final.toLocaleString('pt-BR')} KM<br /><small>{entry.litros_diesel.toFixed(2)} L · R$ {entry.valor_total_nota.toFixed(2)}</small></div>
      <div className="entry-buttons"><button type="button" className="btn-secondary" onClick={() => load(entry)}>Editar</button><button type="button" className="btn-secondary" onClick={() => load(entry, true)}>Duplicar</button></div>
    </article>)}{records.length === 0 && <p>Nenhuma entrada para este caminhão.</p>}</div>
  </div>;
}
