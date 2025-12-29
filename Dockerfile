# ProspectPI Intelligence Theater - Backend Container
# Multi-stage Docker build for optimal production deployment

FROM node:20-alpine AS base
WORKDIR /app

# Install build dependencies for native modules like better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Development stage
FROM base AS development
# Install all dependencies including dev dependencies
RUN npm ci
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev:api"]

# Build stage
FROM base AS build
# Install all dependencies for building
RUN npm ci
COPY . .
# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install runtime dependencies only (no build tools needed)
RUN apk add --no-cache dumb-init

# Copy built application from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S prospectpi -u 1001

# Change ownership of the app directory
RUN chown -R prospectpi:nodejs /app
USER prospectpi

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]