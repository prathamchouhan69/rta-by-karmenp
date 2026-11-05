FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787 \
    STATIC_ROOT=apps/web/dist \
    DATA_DIR=/data/proxy \
    FLUX_DATA_DIR=/data/flux \
    FLUX_TRUST_PROXY=true
WORKDIR /app

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/proxy/package.json ./apps/proxy/package.json
COPY --from=build --chown=node:node /app/apps/proxy/src ./apps/proxy/src
COPY --from=build --chown=node:node /app/apps/flux/package.json ./apps/flux/package.json
COPY --from=build --chown=node:node /app/apps/flux/src ./apps/flux/src
COPY --from=build --chown=node:node /app/apps/flux/scripts ./apps/flux/scripts
COPY --from=build --chown=node:node /app/apps/gateway/package.json ./apps/gateway/package.json
COPY --from=build --chown=node:node /app/apps/gateway/src ./apps/gateway/src
COPY --from=build --chown=node:node /app/apps/web/dist ./apps/web/dist

RUN mkdir -p /data/proxy /data/flux && chown -R node:node /data
USER node
VOLUME ["/data"]
EXPOSE 8787

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:8787/readyz').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "apps/gateway/src/server.mjs"]
