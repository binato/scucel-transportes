# 📋 Checklist de Testes e Validação - Scucel Transportes

Este checklist registra o status dos testes e validações das funcionalidades do sistema da Scucel Transportes.

> **Origem do Histórico de Testes:**
> Arquivo: [scratchpad_s0rz5i6e.md](file:///C:/Users/binato/.gemini/antigravity-ide/brain/6acb1e1e-3604-4b2f-baa9-7d8dae89484f/browser/scratchpad_s0rz5i6e.md)

---

## 🚦 Status dos Testes

- [x] **1. Dashboard Analítico (KPIs e Gráficos)**
  - Acessar `http://localhost:5173/` e validar os 6 cards de KPIs, gráficos de ranking de consumo, evolução mensal, donut de despesas e matriz de auditoria ARLA.
- [x] **2. Cross-Filtering Interativo**
  - Testar filtros clicáveis (slicers de meses, veículos/placas e clique direto nas barras do gráfico).
- [x] **3. CRUD de abastecimentos e comprovantes (API local)**
  - `python -m unittest discover -s backend/tests -v`: criação retroativa, edição, exclusão com despesa vinculada, idempotência e upload de imagem.
- [x] **4. Digitação Rápida (interface móvel)**
  - Seleção de caminhão, formulário e lista das entradas recentes em viewport de 320 e 390 px. Editar carregou o formulário e Duplicar iniciou nova entrada com KM vazio no teste de navegador local.
- [ ] **5. App Motorista (PWA Offline-First)** *(homologação em aparelho pendente)*
  - Testar câmera, armazenamento de imagens sem sinal, recarga offline e sincronização automática ao reconectar.
- [ ] **6. Gestão de Frota & Metas** *(gravação visual pendente)*
  - Verificar a edição da meta de um caminhão e da meta da frota no navegador, inclusive atualização do dashboard.
- [ ] **7. Resumo & Homologação Final** *(Pendente)*
  - Gerar o relatório consolidado de testes do sistema.

---

## 🚀 Como os Serviços Estão Rodando

- **Backend (FastAPI):** `http://localhost:8000` | Documentação Swagger: `http://localhost:8000/docs`
- **Frontend (React + Vite):** `http://localhost:5173`

## Verificações automatizadas desta atualização

- `npm run build` no diretório `frontend` concluiu sem erro.
- `node frontend/scripts/mobile-check.mjs 320` e `node frontend/scripts/mobile-check.mjs 390` não detectaram rolagem horizontal na página; os gráficos/tabela usam rolagem interna quando necessário.
- A prévia do build em `localhost:4173` foi recarregada offline: o service worker manteve a interface e a lista dos 10 caminhões em cache.
