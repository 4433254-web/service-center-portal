FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
RUN npx prisma generate
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
RUN mkdir -p uploads documents
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
