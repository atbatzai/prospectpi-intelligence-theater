# ProspectPI Intelligence Theater - Frontend Container
# Next.js Frontend with optimized production build

FROM node:20-alpine AS base
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Development stage
FROM base AS development
# Install all dependencies including dev dependencies
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build
# Install all dependencies for building
RUN npm ci
COPY . .
# Build the Next.js application
RUN npm run build

# Production stage
FROM nginx:alpine AS production
# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]