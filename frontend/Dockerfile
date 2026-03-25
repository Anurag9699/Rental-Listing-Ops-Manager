# Use Node.js LTS
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port (standard Vite port)
EXPOSE 5173

# Start the application
CMD ["npm", "run", "dev", "--", "--host"]
