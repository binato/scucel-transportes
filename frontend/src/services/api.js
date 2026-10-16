const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchKpis(filters = {}) {
  const params = new URLSearchParams();
  if (filters.ano) params.append('ano', filters.ano);
  if (filters.mes) params.append('mes', filters.mes);
  if (filters.veiculo_id) params.append('veiculo_id', filters.veiculo_id);

  const res = await fetch(`${API_BASE_URL}/api/dashboard/kpis?${params.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar KPIs');
  return res.json();
}

export async function fetchRanking(filters = {}) {
  const params = new URLSearchParams();
  if (filters.ano) params.append('ano', filters.ano);
  if (filters.mes) params.append('mes', filters.mes);

  const res = await fetch(`${API_BASE_URL}/api/dashboard/ranking?${params.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar ranking');
  return res.json();
}

export async function fetchEvolucao(filters = {}) {
  const params = new URLSearchParams();
  if (filters.ano) params.append('ano', filters.ano);
  if (filters.veiculo_id) params.append('veiculo_id', filters.veiculo_id);

  const res = await fetch(`${API_BASE_URL}/api/dashboard/evolucao?${params.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar evolução temporal');
  return res.json();
}

export async function fetchDespesasCategorias(filters = {}) {
  const params = new URLSearchParams();
  if (filters.ano) params.append('ano', filters.ano);
  if (filters.mes) params.append('mes', filters.mes);
  if (filters.veiculo_id) params.append('veiculo_id', filters.veiculo_id);

  const res = await fetch(`${API_BASE_URL}/api/dashboard/despesas-categorias?${params.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar categorias de despesas');
  return res.json();
}

export async function fetchAuditoriaArla(filters = {}) {
  const params = new URLSearchParams();
  if (filters.ano) params.append('ano', filters.ano);
  if (filters.mes) params.append('mes', filters.mes);

  const res = await fetch(`${API_BASE_URL}/api/dashboard/auditoria-arla?${params.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar auditoria de ARLA');
  return res.json();
}

export async function fetchAbastecimentos(filters = {}) {
  const params = new URLSearchParams();
  if (filters.ano) params.append('ano', filters.ano);
  if (filters.mes) params.append('mes', filters.mes);
  if (filters.veiculo_id) params.append('veiculo_id', filters.veiculo_id);
  params.append('limit', '500');

  const res = await fetch(`${API_BASE_URL}/api/abastecimentos?${params.toString()}`);
  if (!res.ok) throw new Error('Falha ao listar abastecimentos');
  return res.json();
}

export async function fetchDespesas(filters = {}) {
  const params = new URLSearchParams();
  if (filters.ano) params.append('ano', filters.ano);
  if (filters.mes) params.append('mes', filters.mes);
  if (filters.veiculo_id) params.append('veiculo_id', filters.veiculo_id);
  if (filters.categoria) params.append('categoria', filters.categoria);
  params.append('limit', '500');

  const res = await fetch(`${API_BASE_URL}/api/despesas?${params.toString()}`);
  if (!res.ok) throw new Error('Falha ao listar despesas');
  return res.json();
}

export async function fetchVeiculos() {
  const res = await fetch(`${API_BASE_URL}/api/veiculos`);
  if (!res.ok) throw new Error('Falha ao listar veículos');
  return res.json();
}

export async function fetchUltimoKm(veiculoId) {
  const res = await fetch(`${API_BASE_URL}/api/abastecimentos/ultimo-km/${veiculoId}`);
  if (!res.ok) throw new Error('Falha ao obter último KM');
  return res.json();
}

export async function createAbastecimento(data) {
  const res = await fetch(`${API_BASE_URL}/api/abastecimentos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Erro ao salvar abastecimento');
  }
  return res.json();
}

export async function updateAbastecimento(id, data) {
  const res = await fetch(`${API_BASE_URL}/api/abastecimentos/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.detail === 'string' ? err.detail : 'Erro ao editar abastecimento');
  }
  return res.json();
}

export async function fetchContexto(veiculoId, data, kmFinal = 0, excluirId = null) {
  const params = new URLSearchParams({ data, km_final: String(kmFinal) });
  if (excluirId) params.set('excluir_id', String(excluirId));
  const res = await fetch(`${API_BASE_URL}/api/abastecimentos/contexto/${veiculoId}?${params}`);
  if (!res.ok) throw new Error('Falha ao consultar quilometragem');
  return res.json();
}

export async function uploadComprovante(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE_URL}/api/uploads/comprovante`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Falha ao enviar comprovante');
  }
  return (await res.json()).url;
}

export async function fetchMetaFrota() {
  const res = await fetch(`${API_BASE_URL}/api/veiculos/meta-frota`);
  if (!res.ok) throw new Error('Falha ao carregar meta da frota');
  return res.json();
}

export async function updateMetaFrota(meta_km_l) {
  const res = await fetch(`${API_BASE_URL}/api/veiculos/meta-frota`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ meta_km_l }),
  });
  if (!res.ok) throw new Error('Falha ao salvar meta da frota');
  return res.json();
}

export async function updateVeiculo(id, data) {
  const res = await fetch(`${API_BASE_URL}/api/veiculos/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao salvar caminhão');
  return res.json();
}

export async function createBulkLote(data) {
  const res = await fetch(`${API_BASE_URL}/api/abastecimentos/bulk-lote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Erro ao salvar lote');
  }
  return res.json();
}

export async function createDespesa(data) {
  const res = await fetch(`${API_BASE_URL}/api/despesas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Erro ao salvar despesa');
  }
  return res.json();
}

export async function deleteAbastecimento(id) {
  const res = await fetch(`${API_BASE_URL}/api/abastecimentos/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Falha ao excluir abastecimento');
  return res.json();
}

export async function deleteDespesa(id) {
  const res = await fetch(`${API_BASE_URL}/api/despesas/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Falha ao excluir despesa');
  return res.json();
}

export { API_BASE_URL };
