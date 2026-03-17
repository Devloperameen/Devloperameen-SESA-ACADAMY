#!/bin/bash

# SafeEdu Backend Test Script
# This script tests the backend API endpoints

echo "🧪 SafeEdu Backend Test Script"
echo "================================"
echo ""

# Configuration
BASE_URL="http://localhost:5000/api"
ADMIN_EMAIL="admin@safeedu.com"
ADMIN_PASSWORD="Admin@123"
TEACHER_EMAIL="teacher@safeedu.com"
TEACHER_PASSWORD="Teacher@123"
STUDENT_EMAIL="student@safeedu.com"
STUDENT_PASSWORD="Student@123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local token=$5
    
    echo -n "Testing: $name... "
    
    if [ -z "$token" ]; then
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\n%{http_code}")
    else
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data" \
            -w "\n%{http_code}")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Check if server is running
echo "1. Checking if backend server is running..."
if curl -s "$BASE_URL/health" > /dev/null; then
    echo -e "${GREEN}✓ Server is running${NC}"
    echo ""
else
    echo -e "${RED}✗ Server is not running${NC}"
    echo "Please start the backend server with: cd backend && npm run dev"
    exit 1
fi

# Test health endpoint
echo "2. Testing Health Endpoint"
test_endpoint "Health Check" "GET" "/health" "" ""
echo ""

# Test authentication
echo "3. Testing Authentication"
echo "Note: This requires test users to be created in the database"
echo "You can create test users using the seed script: npm run seed"
echo ""

# Try to login as admin (will fail if user doesn't exist)
echo "Attempting admin login..."
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${YELLOW}⚠ Admin login failed - test users may not exist${NC}"
    echo "Run 'npm run seed' in the backend directory to create test users"
    echo ""
else
    echo -e "${GREEN}✓ Admin login successful${NC}"
    echo ""
    
    # Test quiz endpoints
    echo "4. Testing Quiz Endpoints"
    test_endpoint "Get Quizzes" "GET" "/quizzes/course/test-course-id" "" "$ADMIN_TOKEN"
    echo ""
    
    # Test assignment endpoints
    echo "5. Testing Assignment Endpoints"
    test_endpoint "Get Assignments" "GET" "/assignments/course/test-course-id" "" "$ADMIN_TOKEN"
    echo ""
    
    # Test gamification endpoints
    echo "6. Testing Gamification Endpoints"
    test_endpoint "Get My Stats" "GET" "/gamification/my-stats" "" "$ADMIN_TOKEN"
    test_endpoint "Get Leaderboard" "GET" "/gamification/leaderboard" "" "$ADMIN_TOKEN"
    test_endpoint "Get Badges" "GET" "/gamification/badges" "" "$ADMIN_TOKEN"
    echo ""
fi

# Test video workflow endpoints
echo "7. Testing Video Workflow Endpoints"
if [ ! -z "$ADMIN_TOKEN" ]; then
    test_endpoint "Get Pending Videos" "GET" "/video-workflow/pending" "" "$ADMIN_TOKEN"
    echo ""
fi

# Summary
echo "================================"
echo "Test Summary"
echo "================================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed. Check the output above for details.${NC}"
    exit 1
fi
