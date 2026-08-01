# ── Windmill EVM Keeper — Production Container ──────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy package files and install
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source
COPY src/ ./src/

# Don't run as root
RUN addgroup --system --gid 1001 keeper
RUN adduser --system --uid 1001 keeper
USER keeper

# Default command: continuous loop
CMD ["node", "src/index.js"]
