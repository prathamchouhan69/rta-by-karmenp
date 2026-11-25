FROM node:22-alpine
WORKDIR /app
COPY apps/flux/package*.json ./
RUN npm ci --omit=dev
COPY apps/flux/ ./
RUN mkdir -p data
ENV PORT=8788
EXPOSE 8788
CMD ["node", "src/server.js"]