# ── Stage 1: Build ─────────────────────────────────────
FROM oven/bun:1 AS build

WORKDIR /app

# Install dependencies (separate from source for layer caching)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# Copy the rest of the application
COPY . .

# Build the production bundle
RUN bun run build

# ── Stage 2: Serve ────────────────────────────────────
FROM nginx:1.27-alpine

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Security: run as non-root user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
