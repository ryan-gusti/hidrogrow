# ── Build stage: compile client (Vue 3 + Vite) ──
FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci
COPY client/ client/
RUN npm run build -w client

# ── Runtime stage ──
FROM node:26-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# Install production deps saja (workspaces: server + client, tanpa devDeps)
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --omit=dev && npm cache clean --force

# Salin kode server & hasil build client
COPY server/ server/
COPY --from=build /app/client/dist client/dist

# Direktori data + non-root user (named volume mewarisi permission ini)
RUN mkdir -p server/data server/uploads && \
    addgroup -S app && adduser -S app -G app && \
    chown -R app:app /app
USER app

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"

CMD ["node", "server/src/index.js"]
