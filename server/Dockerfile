# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files from root context
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy server files
COPY server/ ./server/

# Expose port
EXPOSE 3001

# Start the server (using node with ES modules support)
CMD ["node", "--experimental-modules", "server/index.js"] 