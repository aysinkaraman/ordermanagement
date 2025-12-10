#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Kanban Board Setup${NC}"
echo "================================"

# Check Node.js version
echo -e "${YELLOW}✓ Checking Node.js version...${NC}"
node_version=$(node -v)
echo "  Node.js version: $node_version"

# Install dependencies
echo -e "\n${YELLOW}✓ Installing dependencies...${NC}"
npm install

# Check for .env.local
if [ ! -f .env.local ]; then
    echo -e "\n${YELLOW}⚠️  No .env.local file found${NC}"
    echo "  Creating .env.local from example..."
    
    # Create a default .env.local
    cat > .env.local << EOF
DATABASE_URL="postgresql://postgres:password@localhost:5432/kanban_db"
NODE_ENV=development
EOF
    
    echo -e "${YELLOW}  Note: Update DATABASE_URL in .env.local with your database connection string${NC}"
fi

# Generate Prisma Client
echo -e "\n${YELLOW}✓ Generating Prisma Client...${NC}"
npx prisma generate

# Run migrations
echo -e "\n${YELLOW}✓ Running database migrations...${NC}"
npx prisma migrate dev --name init

# Success message
echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo -e "\n${BLUE}Next steps:${NC}"
echo "1. Update .env.local with your database connection string"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo ""
echo -e "${YELLOW}Database Management:${NC}"
echo "- View database: npx prisma studio"
echo "- Reset database: npx prisma migrate reset"
echo ""
