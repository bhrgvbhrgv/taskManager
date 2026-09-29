FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules (bcrypt) on Alpine
RUN apk add --no-cache python3 make g++

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Remove build tools to keep the final image smaller
RUN apk del python3 make g++

# Copy application source code
COPY . .

# Run as non-root user for security best practices
USER node

# Document port
EXPOSE 5000

# Start server
CMD ["node", "src/server.js"]
