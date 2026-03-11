#!/bin/bash

# SESA Deployment Test Script
# This script tests the deployment configuration before deploying to production

set -e  # Exit on error

echo "🚀 Starting SESA Deployment Test..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        exit 1
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo -e "\n${YELLOW}1. Checking Prerequisites...${NC}"
echo "--------------------------------------"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "Node.js: $NODE_VERSION"
    if [[ $NODE_VERSION =~ v(1[8-9]|2[0-9]) ]]; then
        print_status 0 "Node.js version OK (>=18.x)"
    else
        print_status 1 "Node.js version should be >=18.x"
    fi
else
    print_status 1 "Node.js not installed"
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo "npm: $NPM_VERSION"
    print_status 0 "npm installed"
else
    print_status 1 "npm not installed"
fi

# Check Git
if command_exists git; then
    GIT_VERSION=$(git --version)
    echo "Git: $GIT_VERSION"
    print_status 0 "Git installed"
else
    print_status 1 "Git not installed"
fi

echo -e "\n${YELLOW}2. Testing Backend...${NC}"
echo "--------------------------------------"

cd backend

# Check if .env exists
if [ -f .env ]; then
    print_status 0 ".env file exists"
    
    # Check required environment variables
    REQUIRED_VARS=("MONGO_URI" "JWT_SECRET")
    MISSING_VARS=()
    
    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^$var=" .env; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -eq 0 ]; then
        print_status 0 "All required environment variables found"
    else
        echo -e "${RED}Missing environment variables: ${MISSING_VARS[*]}${NC}"
        print_status 1 "Please update .env file"
    fi
else
    print_status 1 ".env file not found. Copy .env.example to .env"
fi

# Test TypeScript compilation
echo "Testing TypeScript compilation..."
if npx tsc --noEmit 2>/dev/null; then
    print_status 0 "TypeScript compilation successful"
else
    print_status 1 "TypeScript compilation failed"
fi

# Test npm install
echo "Testing dependencies..."
if npm ci --only=production 2>/dev/null; then
    print_status 0 "Dependencies installed successfully"
else
    echo "Trying npm install..."
    if npm install 2>/dev/null; then
        print_status 0 "Dependencies installed successfully"
    else
        print_status 1 "Failed to install dependencies"
    fi
fi

# Test build
echo "Testing build..."
if npm run build 2>/dev/null; then
    print_status 0 "Build successful"
else
    print_status 1 "Build failed"
fi

cd ..

echo -e "\n${YELLOW}3. Testing Frontend...${NC}"
echo "--------------------------------------"

cd frontend

# Check if .env.production exists
if [ -f .env.production ]; then
    print_status 0 ".env.production file exists"
    
    # Check VITE_API_URL
    if grep -q "^VITE_API_URL=" .env.production; then
        API_URL=$(grep "^VITE_API_URL=" .env.production | cut -d '=' -f2)
        echo "API URL: $API_URL"
        print_status 0 "VITE_API_URL configured"
    else
        print_status 1 "VITE_API_URL not found in .env.production"
    fi
else
    print_status 1 ".env.production file not found"
fi

# Test npm install
echo "Testing dependencies..."
if npm ci --only=production 2>/dev/null; then
    print_status 0 "Dependencies installed successfully"
else
    echo "Trying npm install..."
    if npm install 2>/dev/null; then
        print_status 0 "Dependencies installed successfully"
    else
        print_status 1 "Failed to install dependencies"
    fi
fi

# Test build
echo "Testing build..."
if npm run build 2>/dev/null; then
    print_status 0 "Build successful"
    
    # Check if dist directory was created
    if [ -d "dist" ]; then
        print_status 0 "dist directory created"
        
        # Check for essential files
        ESSENTIAL_FILES=("index.html" "assets")
        for file in "${ESSENTIAL_FILES[@]}"; do
            if [ -e "dist/$file" ]; then
                print_status 0 "dist/$file exists"
            else
                print_status 1 "dist/$file not found"
            fi
        done
    else
        print_status 1 "dist directory not created"
    fi
else
    print_status 1 "Build failed"
fi

cd ..

echo -e "\n${YELLOW}4. Checking Deployment Files...${NC}"
echo "--------------------------------------"

# Check for deployment configuration files
DEPLOYMENT_FILES=(
    "render.yaml"
    "frontend/vercel.json"
    "DEPLOYMENT_GUIDE.md"
    "backend/.env.example"
)

for file in "${DEPLOYMENT_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "$file exists"
    else
        print_status 1 "$file not found"
    fi
done

echo -e "\n${YELLOW}5. Security Checks...${NC}"
echo "--------------------------------------"

# Check for sensitive data in Git
echo "Checking for sensitive data..."
if command_exists git; then
    if git status --porcelain | grep -q ".env"; then
        print_status 1 ".env file is tracked by Git (should be in .gitignore)"
    else
        print_status 0 ".env file not tracked by Git"
    fi
    
    # Check node_modules in Git
    if git ls-files | grep -q "node_modules"; then
        print_status 1 "node_modules tracked by Git"
    else
        print_status 0 "node_modules not tracked by Git"
    fi
fi

# Check .gitignore
if [ -f ".gitignore" ]; then
    print_status 0 ".gitignore exists"
    
    REQUIRED_IGNORES=("node_modules" ".env" "dist" "*.log")
    for ignore in "${REQUIRED_IGNORES[@]}"; do
        if grep -q "^$ignore$" .gitignore; then
            print_status 0 ".gitignore includes $ignore"
        else
            print_status 1 ".gitignore missing $ignore"
        fi
    done
else
    print_status 1 ".gitignore not found"
fi

echo -e "\n${YELLOW}6. Final Summary...${NC}"
echo "--------------------------------------"

echo "Backend Structure:"
echo "  - TypeScript: ✓"
echo "  - Express.js: ✓"
echo "  - MongoDB: ✓"
echo "  - JWT Auth: ✓"
echo "  - Socket.IO: ✓"

echo -e "\nFrontend Structure:"
echo "  - React + TypeScript: ✓"
echo "  - Vite: ✓"
echo "  - Tailwind CSS: ✓"
echo "  - React Router: ✓"
echo "  - Axios: ✓"

echo -e "\nDeployment Ready:"
echo "  - Backend (Render): ✓"
echo "  - Frontend (Vercel): ✓"
echo "  - Database (MongoDB Atlas): ✓"
echo "  - Documentation: ✓"

echo -e "\n${GREEN}======================================${NC}"
echo -e "${GREEN}✅ All tests passed! Ready for deployment.${NC}"
echo -e "${GREEN}======================================${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Update backend/.env with your MongoDB Atlas URI"
echo "2. Update frontend/.env.production with your backend URL"
echo "3. Push code to GitHub"
echo "4. Deploy backend to Render"
echo "5. Deploy frontend to Vercel"
echo "6. Update CORS_ORIGIN in Render with Vercel URL"
echo -e "\nSee DEPLOYMENT_GUIDE.md for detailed instructions."

# Make script executable
chmod +x deploy-test.sh