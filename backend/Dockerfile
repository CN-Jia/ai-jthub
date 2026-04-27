FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
RUN npm install -g pnpm && pnpm install --filter backend

COPY backend ./backend
RUN pnpm --filter backend build

# ─── Production image ───────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY backend/package.json ./

EXPOSE 3000

CMD ["node", "dist/app.js"]
