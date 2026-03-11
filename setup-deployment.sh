#!/bin/bash

# SESA Deployment Setup Script
# Helps set up environment variables for deployment

set -e

echo "🔧 SESA Deployment Setup"
echo "========================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to ask for input with default
ask() {
    local prompt default reply
    prompt="$1"
    default="$2"
    
    if [ "${default:-}" = "" ]; then
        prompt="$prompt: "
    else
        prompt="$prompt [$default]: "
    fi
    
    while true; do
        read -p "$prompt" reply
        if [ -z "$reply" ]; then
            if [ -n "$default" ]; then
                reply="$default"
                break
            fi
        else
            break
        fi
    done
    
    echo "$reply"
}

echo -e "\n${BLUE}1. MongoDB Atlas Configuration${NC}"
echo "--------------------------------"

MONGO_USER=$(ask "MongoDB Atlas Username" "sesa_admin")
MONGO_PASS=$(ask "MongoDB Atlas Password" "")
MONGO_DB=$(ask "Database Name" "sesa")

# Generate MongoDB URI
MONGO_URI="mongodb+srv://${MONGO_USER}:${MONGO_PASS}@cluster0.2amblcf.mongodb.net/${MONGO_DB}?retryWrites=true&w=majority&appName=Cluster0"

echo -e "\n${BLUE}2. JWT Secret Generation${NC}"
echo "----------------------------"

# Generate a strong JWT secret
if command -v openssl >/dev/null 2>&1; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT secret: ${JWT_SECRET:0:20}..."
else
    JWT_SECRET=$(date +%s | sha256sum | base64 | head -c 32)
    echo "Generated JWT secret (fallback): ${JWT_SECRET:0:20}..."
fi

echo -e "\n${BLUE}3. Backend Configuration${NC}"
echo "----------------------------"

# Update backend .env
BACKEND_ENV="backend/.env"
if [ -f "$BACKEND_ENV" ]; then
    # Backup original
    cp "$BACKEND_ENV" "$BACKEND_ENV.backup"
    
    # Update with new values
    cat > "$BACKEND_ENV" << EOF
# Production Environment Variables
PORT=5000

# MongoDB Atlas Connection
MONGO_URI=${MONGO_URI}

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=7d

# CORS Configuration (Update after frontend deployment)
CORS_ORIGIN=https://your-frontend-app.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Security
NODE_ENV=production
HELMET_ENABLED=true

# Socket.IO Configuration
SOCKET_CORS_ORIGIN=https://your-frontend-app.vercel.app

# Application Settings
APP_NAME=SESA Educational Platform
APP_VERSION=1.0.0
EOF
    
    echo -e "${GREEN}✓ Backend .env updated${NC}"
else
    echo -e "${RED}✗ Backend .env not found${NC}"
fi

echo -e "\n${BLUE}4. Frontend Configuration${NC}"
echo "-----------------------------"

# Ask for backend URL (will be updated after Render deployment)
BACKEND_URL=$(ask "Backend URL (from Render)" "https://sesa-backend.onrender.com")

# Update frontend .env.production
FRONTEND_ENV="frontend/.env.production"
if [ -f "$FRONTEND_ENV" ]; then
    # Backup original
    cp "$FRONTEND_ENV" "$FRONTEND_ENV.backup"
    
    # Update with new values
    cat > "$FRONTEND_ENV" << EOF
# Production environment variables for Vercel
VITE_API_URL=${BACKEND_URL}
VITE_APP_NAME=SESA Educational Platform
VITE_APP_DESCRIPTION=Full-stack educational platform with course management
VITE_APP_VERSION=1.0.0
EOF
    
    echo -e "${GREEN}✓ Frontend .env.production updated${NC}"
else
    echo -e "${RED}✗ Frontend .env.production not found${NC}"
fi

# Update vercel.json
VERCEL_JSON="frontend/vercel.json"
if [ -f "$VERCEL_JSON" ]; then
    # Create updated vercel.json
    cat > "$VERCEL_JSON" << EOF
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "${BACKEND_URL}"
  }
}
EOF
    
    echo -e "${GREEN}✓ Vercel configuration updated${NC}"
fi

echo -e "\n${BLUE}5. Git Configuration${NC}"
echo "----------------------"

# Check if .gitignore exists
if [ ! -f ".gitignore" ]; then
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
out/

# Runtime data
*.pid
*.seed
*.pid.lock

# Coverage directory
coverage/
.nyc_output/

# Logs
logs
*.log

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
tmp/
temp/
EOF
    
    echo -e "${GREEN}✓ .gitignore created${NC}"
fi

echo -e "\n${BLUE}6. Summary${NC}"
echo "-----------"

echo -e "${YELLOW}Configuration Summary:${NC}"
echo "• MongoDB URI: ${MONGO_URI:0:50}..."
echo "• JWT Secret: ${JWT_SECRET:0:20}..."
echo "• Backend URL: ${BACKEND_URL}"
echo "• Frontend API URL: ${BACKEND_URL}"

echo -e "\n${GREEN}✅ Setup Complete!${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Review the configuration files"
echo "2. Test locally: ./deploy-test.sh"
echo "3. Commit changes to Git"
echo "4. Push to GitHub"
echo "5. Deploy to Render (backend)"
echo "6. Deploy to Vercel (frontend)"
echo "7. Update CORS_ORIGIN in Render with your Vercel URL"

echo -e "\n${BLUE}Important Security Notes:${NC}"
echo "• Keep your JWT_SECRET secure"
echo "• Never commit .env files to Git"
echo "• Use strong passwords for MongoDB"
echo "• Enable IP whitelisting in MongoDB Atlas"
echo "• Set up monitoring and alerts"

# Make script executable
chmod +x setup-deployment.sh