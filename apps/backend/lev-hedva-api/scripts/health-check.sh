#!/bin/bash

# Lev Hedva Backend Health Check Script

echo "🔍 Running comprehensive health check for Lev Hedva Backend..."
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
TOTAL_CHECKS=0
PASSED_CHECKS=0

check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED_CHECKS++))
    else
        echo -e "${RED}❌ FAILED${NC}"
    fi
    ((TOTAL_CHECKS++))
}

echo ""
echo "1. Checking TypeScript compilation..."
echo "────────────────────────────────────"
if npm run build > /dev/null 2>&1; then
    check_status 0
else
    check_status 1
fi

echo ""
echo "2. Running unit tests..."
echo "────────────────────────"
if npm test > /dev/null 2>&1; then
    check_status 0
else
    check_status 1
fi

echo ""
echo "3. Running ESLint checks..."
echo "───────────────────────────"
if npm run lint > /dev/null 2>&1; then
    check_status 0
else
    check_status 1
fi

echo ""
echo "4. Checking Docker build..."
echo "──────────────────────────"
if docker build -t lev-hedva-test:health-check . > /dev/null 2>&1; then
    check_status 0
    # Clean up test image
    docker rmi lev-hedva-test:health-check > /dev/null 2>&1 || true
else
    check_status 1
fi

echo ""
echo "5. Checking environment configuration..."
echo "──────────────────────────────────────"
if [ -f ".env.production" ]; then
    # Check required variables are defined
    required_vars=("NODE_ENV" "PORT" "DATABASE_URL" "JWT_SECRET" "JWT_REFRESH_SECRET")
    all_vars_present=true
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env.production; then
            all_vars_present=false
            break
        fi
    done
    
    if $all_vars_present; then
        check_status 0
    else
        check_status 1
    fi
else
    check_status 1
fi

echo ""
echo "6. Checking package.json configuration..."
echo "────────────────────────────────────────"
if [ -f "package.json" ]; then
    # Check if required scripts exist
    if command -v jq > /dev/null 2>&1; then
        if jq -e '.scripts.start and .scripts.build and .scripts.test and .name and .version' package.json > /dev/null 2>&1; then
            check_status 0
        else
            check_status 1
        fi
    else
        # Fallback if jq is not available
        if grep -q '"start"' package.json && grep -q '"build"' package.json && grep -q '"test"' package.json; then
            check_status 0
        else
            check_status 1
        fi
    fi
else
    check_status 1
fi

echo ""
echo "7. Checking Prisma configuration..."
echo "──────────────────────────────────"
if [ -f "prisma/schema.prisma" ]; then
    if npx prisma validate > /dev/null 2>&1; then
        check_status 0
    else
        check_status 1
    fi
else
    check_status 1
fi

echo ""
echo "8. Checking CI/CD configuration..."
echo "─────────────────────────────────"
if [ -f ".github/workflows/ci-cd.yml" ]; then
    check_status 0
else
    check_status 1
fi

echo ""
echo "=================================================================="
echo "📊 HEALTH CHECK SUMMARY"
echo "=================================================================="
echo -e "Total Checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$((TOTAL_CHECKS - PASSED_CHECKS))${NC}"

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL CHECKS PASSED! Your application is ready for deployment.${NC}"
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠️  Some checks failed. Please review the issues above before deployment.${NC}"
    exit 1
fi