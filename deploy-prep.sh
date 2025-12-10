#!/bin/bash

# 🚀 Falcon Board - Quick Deploy Script
# Run this to prepare for deployment

echo "🦅 Falcon Board - Deployment Prep"
echo "=================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git..."
    git init
    git add .
    git commit -m "Initial commit - Falcon Board ready for deployment"
    echo "✅ Git initialized!"
else
    echo "✅ Git already initialized"
fi

# Check .env
if [ -f .env ]; then
    echo "⚠️  WARNING: .env file exists - make sure it's in .gitignore!"
    if grep -q ".env" .gitignore; then
        echo "✅ .env is in .gitignore"
    else
        echo "❌ Adding .env to .gitignore..."
        echo ".env" >> .gitignore
    fi
fi

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma Client..."
npm run prisma:generate

# Check build
echo ""
echo "🏗️  Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📋 Next Steps:"
    echo "==============="
    echo ""
    echo "1. CREATE GITHUB REPO:"
    echo "   - Go to github.com/new"
    echo "   - Create a new repository (e.g., 'falcon-board')"
    echo "   - DON'T initialize with README"
    echo ""
    echo "2. PUSH TO GITHUB:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/falcon-board.git"
    echo "   git branch -M master"
    echo "   git push -u origin master"
    echo ""
    echo "3. DEPLOY TO VERCEL:"
    echo "   - Go to vercel.com/new"
    echo "   - Import your GitHub repo"
    echo "   - Add environment variables:"
    echo "     * DATABASE_URL (from Vercel Postgres or Supabase)"
    echo "     * JWT_SECRET (generate: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
    echo "     * NODE_ENV=production"
    echo "   - Click Deploy!"
    echo ""
    echo "4. RUN MIGRATIONS:"
    echo "   - After first deploy, in Vercel terminal:"
    echo "     npx prisma migrate deploy"
    echo ""
    echo "5. TEST YOUR APP:"
    echo "   - Visit https://your-project.vercel.app"
    echo "   - Register a user"
    echo "   - Test creating cards!"
    echo ""
    echo "🎉 You're ready to deploy!"
else
    echo "❌ Build failed! Fix errors above first."
    exit 1
fi
