@REM Kanban Board Setup Script for Windows
@echo off

echo.
echo 🚀 Kanban Board Setup
echo ================================

REM Check Node.js version
echo ✓ Checking Node.js version...
node -v

REM Install dependencies
echo.
echo ✓ Installing dependencies...
call npm install

REM Check for .env.local
if not exist .env.local (
    echo.
    echo ⚠️  No .env.local file found
    echo Creating .env.local from example...
    
    (
        echo DATABASE_URL="postgresql://postgres:password@localhost:5432/kanban_db"
        echo NODE_ENV=development
    ) > .env.local
    
    echo Note: Update DATABASE_URL in .env.local with your database connection string
)

REM Generate Prisma Client
echo.
echo ✓ Generating Prisma Client...
call npx prisma generate

REM Run migrations
echo.
echo ✓ Running database migrations...
call npx prisma migrate dev --name init

REM Success message
echo.
echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Update .env.local with your database connection string
echo 2. Run: npm run dev
echo 3. Open: http://localhost:3000
echo.
echo 💾 Database Management:
echo - View database: npx prisma studio
echo - Reset database: npx prisma migrate reset
echo.
pause
