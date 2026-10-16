# Guia de Implantação: Scucel Transportes no Easypanel (VPS)

Este guia orienta a implantação da aplicação na VPS com Easypanel, banco PostgreSQL, SSL e armazenamento persistente de comprovantes.

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

## 3. Comprovantes e atualização de banco

O frontend compacta imagens antes do envio. O backend aceita JPEG, PNG e WebP até 5 MB e grava em `/app/uploads`; mantenha o volume persistente. Na primeira inicialização após esta atualização, o backend adiciona as colunas novas de comprovante e identificador de sincronização sem descartar os registros existentes. Faça backup do PostgreSQL antes de publicar.

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
