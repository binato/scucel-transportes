# ─── Estágio 1: Build ────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build

# ─── Estágio 2: Servir com Nginx ─────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove config padrão e copia a SPA compilada
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Configuração Nginx otimizada para SPA (React Router) com gzip e cache
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
