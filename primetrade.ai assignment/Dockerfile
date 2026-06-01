# Step 1: Base image
FROM node:18-alpine

# Set working directory for the container
WORKDIR /app

# Copy server package manifests first for caching layers
COPY server/package*.json ./server/

# Install server dependencies
RUN cd server && npm ci

# Copy server and client code into container
COPY server/ ./server/
COPY client/ ./client/

# Expose port
EXPOSE 5000

# Set environment variables for container
ENV PORT=5000
ENV NODE_ENV=production
ENV JWT_SECRET=primetrade_super_secret_jwt_key_2026

# Set work directory to server and run app
WORKDIR /app/server
CMD ["npm", "start"]
