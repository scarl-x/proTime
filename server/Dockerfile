
FROM node:20-alpine AS builder
WORKDIR /app/server

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# Include old_db so auto-migration can read CSVs at runtime
# Note: autoMigration expects old_db at server/old_db
COPY ../old_db ./old_db

# Build TypeScript
RUN npm run build


FROM node:20-alpine AS runner
WORKDIR /app/server

ENV NODE_ENV=production

# Only production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built app and required runtime assets
COPY --from=builder /app/server/dist ./dist
# Copy old_db (used by auto-migration on first/each prod start)
COPY --from=builder /app/server/old_db ./old_db

# Expose API port
EXPOSE 3001

# Start the server (autoMigration runs inside src/index.ts)
CMD ["node", "dist/index.js"]


