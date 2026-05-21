FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder --chown=node:node /app/package*.json ./
RUN npm install --omit=dev && chown -R node:node /app
COPY --from=builder --chown=node:node /app/dist ./dist
USER node
EXPOSE 4021
CMD ["node", "dist/main"]
