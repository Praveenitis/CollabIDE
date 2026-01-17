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

# Start the server
CMD ["node", "server/index.js"] 