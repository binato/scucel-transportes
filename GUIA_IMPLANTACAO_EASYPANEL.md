# Guia de Implantação: Scucel Transportes no Easypanel (VPS)

Este guia orienta o passo a passo para colocar a aplicação no ar na sua VPS com **Easypanel** em menos de 5 minutos, com banco de dados persistente, SSL Let's Encrypt automático e custo zero de IA.

---

## 1. Estrutura de Serviços no Easypanel

No painel do Easypanel (criando um projeto chamado `scucel-transportes`), você precisará de **3 serviços**:

```
+--------------------------------------------------------------------------------+
| Projeto: scucel-transportes (Easypanel)                                        |
+--------------------------------------------------------------------------------+
|  1. Serviço Banco: PostgreSQL (Template 1-Clique do Easypanel)                 |
|  2. Serviço Backend: Python FastAPI (Build a partir da pasta /backend)         |
|  3. Serviço Frontend: React + Nginx (Build a partir da pasta /frontend)        |
+--------------------------------------------------------------------------------+
```

---

## 2. Passo a Passo de Configuração

### Passo 1: Criar o Banco PostgreSQL
1. No Easypanel, clique em **+ Service** > **Database** > selecione **PostgreSQL**.
2. Nomeie como: `postgres`.
3. Anote a senha gerada e o nome do banco (`scucel_db`).

---

### Passo 2: Criar o Serviço Backend (API)
1. Clique em **+ Service** > **App**.
2. Nomeie como: `backend`.
3. **Source**: Conecte ao seu repositório Git (ou use Dockerfile).
   - *Path*: `/backend`
4. **Variáveis de Ambiente (Environment Variables)**:
   ```env
   DATABASE_URL=postgresql://postgres:SUA_SENHA@postgres:5432/scucel_db
   GEMINI_API_KEY=sua_chave_gratuita_do_google_ai_studio
   OPENROUTER_API_KEY=sua_chave_gratuita_do_openrouter_opcional
   ```
5. **Porta**: `8000`.
6. **Domínio**: configure um subdomínio como `api.scucel.seudominio.com` (o Easypanel gerará o SSL HTTPS automaticamente).
7. **Volume Persistente**: monte `/app/uploads` em um volume nomeado para preservar as fotos dos comprovantes.

---

### Passo 3: Criar o Serviço Frontend (Dashboard & PWA)
1. Clique em **+ Service** > **App**.
2. Nomeie como: `frontend`.
3. **Source**: Conecte ao seu repositório Git.
   - *Path*: `/frontend`
4. **Variáveis de Build (Environment)**:
   ```env
   VITE_API_URL=https://api.scucel.seudominio.com
   ```
5. **Porta**: `80`.
6. **Domínio**: configure `app.scucel.seudominio.com` (com HTTPS automático).

---

## 3. Como Obter a Chave Gratuita da IA (Google AI Studio)

1. Acesse: [https://aistudio.google.com/](https://aistudio.google.com/)
2. Faça login com uma conta Google.
3. Clique em **"Get API key"** > **"Create API key in new project"**.
4. Copie a chave e cole na variável `GEMINI_API_KEY` do backend no Easypanel.
5. **Pronto!** Você terá 1.500 requisições gratuitas por dia para extrair fotos de folhas de caminhoneiros.

---

## 4. Testes e Execução Local

Caso queira rodar localmente no computador antes de subir para a VPS:

### Rodando o Backend:
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
*Swagger interativo:* `http://localhost:8000/docs`

### Rodando o Frontend:
```bash
cd frontend
npm run dev
```
*Dashboard:* `http://localhost:5173`
