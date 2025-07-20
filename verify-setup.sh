#!/bin/bash

echo "🔍 NutriFlow API Setup Verification"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
echo "📦 Node.js version:"
node --version
echo ""

# Check npm version
echo "📦 npm version:"
npm --version
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Installing dependencies..."
    npm install
else
    echo "✅ Dependencies are installed"
fi
echo ""

# Check environment variables
echo "🔧 Environment Configuration:"

if [ -f ".env.local" ]; then
    echo "✅ .env.local file exists"
    
    # Check key environment variables (without revealing values)
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo "✅ NEXT_PUBLIC_SUPABASE_URL configured"
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_URL missing"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY configured"
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY missing"
    fi
    
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
        echo "✅ SUPABASE_SERVICE_ROLE_KEY configured"
    else
        echo "❌ SUPABASE_SERVICE_ROLE_KEY missing"
    fi
    
    if grep -q "GEMINI_API_KEY" .env.local; then
        echo "✅ GEMINI_API_KEY configured"
    else
        echo "❌ GEMINI_API_KEY missing"
    fi
else
    echo "❌ .env.local file not found"
    echo "   Please copy .env.example to .env.local and configure your environment variables"
fi
echo ""

# Check if development server is running
echo "🌐 Development Server Status:"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Development server is running on port 3000"
else
    echo "❌ Development server is not running"
    echo "   Start it with: npm run dev"
fi
echo ""

# Check API endpoint accessibility (if server is running)
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "🔌 API Endpoint Check:"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/generate-meal-plan \
        -H "Content-Type: application/json" \
        -d '{"prompt":"test"}')
    
    if [ "$HTTP_CODE" = "401" ]; then
        echo "✅ API endpoint responding (401 expected without auth)"
    else
        echo "⚠️  API endpoint returned HTTP $HTTP_CODE (401 expected)"
    fi
else
    echo "⏭️  Skipping API check (server not running)"
fi
echo ""

echo "📋 Next Steps:"
echo "=============="
echo "1. If environment variables are missing, configure .env.local"
echo "2. Start development server: npm run dev"
echo "3. Log into the application to get an access token"
echo "4. Run API tests: ./test-meal-plan-api.sh <YOUR_TOKEN>"
echo ""

echo "📖 Documentation:"
echo "=================="
echo "- API Testing Guide: MEAL_PLAN_API_TEST.md"
echo "- Test Script: test-meal-plan-api.sh"
echo "- Project Instructions: CLAUDE.md"