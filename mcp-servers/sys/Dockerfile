FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install --no-audit --no-fund
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache lsof curl bash
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package.json ./
RUN npm install --no-audit --no-fund --production
EXPOSE 3105
CMD ["node", "dist/server.js"]
