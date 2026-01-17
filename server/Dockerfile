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

<<<<<<< HEAD
# Start the server
=======
# Start the server (Node 18 supports ES modules by default)
>>>>>>> 8410cb1e6981a90591eeb8cb752d93b8745d0401
CMD ["node", "server/index.js"] 