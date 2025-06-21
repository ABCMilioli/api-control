# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and type definitions
RUN npm install && \
    npm install --save-dev @types/express @types/node terser && \
    npx update-browserslist-db@latest

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Compile server
RUN npx tsc -p tsconfig.server.json

# Verify build output
RUN ls -la dist/ && \
    echo "Build completed successfully"

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install PostgreSQL client for healthcheck
RUN apk add --no-cache postgresql-client

# Copy package files and install production dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy migrations directory
COPY --from=builder /app/prisma/migrations ./prisma/migrations

# Copy and configure entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD pg_isready -h postgres -p 5432 -U postgres || exit 1

# Start the application
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
