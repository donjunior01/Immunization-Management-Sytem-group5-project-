# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy build script
COPY build-env.js ./

# Copy source code
COPY . .

# Build argument for API URL (default to localhost for development)
ARG API_URL=http://localhost:8080/api

# Set environment variable for build script
ENV API_URL=${API_URL}

# Replace API URL in environment.prod.ts during build
RUN node build-env.js

# Build the application
RUN npm run build -- --configuration production

# Runtime stage - Nginx
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist/vaxtrack-web/browser /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

