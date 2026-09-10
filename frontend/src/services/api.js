const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  return res.json();
}

export async function deleteDespesa(id) {
  const res = await fetch(`${API_BASE_URL}/api/despesas/${id}`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function extractImageAi(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/vision/extrair-foto`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Erro na extração por IA');
  }
  return res.json();
}

export async function loadSamplePhoto() {
  const res = await fetch(`${API_BASE_URL}/api/vision/carregar-amostra`);
  if (!res.ok) throw new Error('Falha ao carregar foto de amostra');
  return res.json();
}

export { API_BASE_URL };
