# 🚀 Falcon Board - Deployment Guide

## Quick Start (5 Minutes to Live!)

### Step 1: GitHub'a Yükle (1 dk)

```bash
# Eğer git init yapmadıysan:
git init
git add .
git commit -m "Falcon Board ready for deployment"

# GitHub'da yeni repo oluştur, sonra:
git remote add origin https://github.com/YOUR_USERNAME/falcon-board.git
git branch -M master
git push -u origin master
```

### Step 2: Vercel'de Deploy (2 dk)

1. **vercel.com** → Sign up with GitHub
2. **New Project** → Import GitHub repo
3. **Configure Project:**
   - Framework: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `prisma generate && next build` (default)
   - Click **Deploy** 🚀

### Step 3: Database (2 dk)

**Vercel Postgres (EN KOLAY):**
1. Vercel Dashboard → **Storage** tab
2. **Create Database** → **Postgres**
3. Connect to your project
4. DATABASE_URL otomatik eklenir! ✅

**VEYA Supabase (Alternatif):**
1. supabase.com → New project
2. Settings → Database → Connection string kopyala
3. Vercel → Settings → Environment Variables
4. Add: `DATABASE_URL=postgresql://...`

### Step 4: Environment Variables

Vercel Dashboard → Settings → Environment Variables → Add:

```env
DATABASE_URL=postgresql://... (Vercel Postgres varsa otomatik)
NODE_ENV=production
JWT_SECRET=super-gizli-random-string-32-karakter-minimum

# Shopify (opsiyonel, sonra eklersin):
SHOPIFY_SHOP_NAME=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
```

**JWT_SECRET oluştur:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Database Migration

Vercel Dashboard → Deployments → En son deployment → **View Function Logs** → **Terminal** açılınca:

```bash
npx prisma migrate deploy
```

**VEYA** local'den:
```bash
npm i -g vercel
vercel login
vercel env pull .env.production
npx prisma migrate deploy --preview-feature
```

### ✅ HAZIR! 

App live: `https://your-project.vercel.app`

---

## 🛍️ Shopify API Setup (Opsiyonel)

### 1. Shopify Custom App Oluştur

1. Shopify Admin → **Settings**
2. **Apps and sales channels** → **Develop apps**
3. **Create an app** → İsim ver (ör: Falcon Board)
4. **Configure Admin API scopes:**
   - ✅ `read_orders`
   - ✅ `read_products`  
   - ✅ `read_customers`
5. **Save** → **Install app**
6. **API credentials** → **Reveal token once** → KOPYALA! ⚠️

### 2. Vercel'e Ekle

Vercel → Settings → Environment Variables:

```env
SHOPIFY_SHOP_NAME=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxx
```

Save → Otomatik redeploy olacak!

### 3. Webhook Setup (Real-time orders için)

Shopify Admin → Settings → Notifications → **Webhooks** → **Create webhook:**

- **Event:** Order creation
- **Format:** JSON
- **URL:** `https://your-project.vercel.app/api/shopify/orders`
- **API version:** 2024-10

**Save** → Artık yeni order gelince otomatik card oluşur! 🎉

---

## 🔄 Continuous Deployment

Her `git push` otomatik deploy olur:

```bash
# Değişiklik yap
git add .
git commit -m "New feature added"
git push

# Vercel otomatik build + deploy! ✨
```

> Deploy bump: Fri Dec 12, 2025 — force redeploy marker

---

## ⚡ Performance & Cost

**Vercel Free Tier:**
- ✅ Sınırsız deployment
- ✅ 100GB bandwidth/ay
- ✅ SSL (HTTPS) otomatik
- ✅ Custom domain destekler
- ✅ Serverless functions

**Vercel Postgres:**
- ✅ 60 saat compute/ay (free)
- ✅ 256MB storage
- 💰 Aşarsan: $0.02/saat

**Toplam maliyet:** $0-5/ay (küçük projeler için) 💰

---

### Option 2: Railway

**Advantages:**
- Easy PostgreSQL integration
- Pay-as-you-go pricing
- GitHub auto-deploy
- Simple setup

**Steps:**

1. Sign up at https://railway.app

2. Create new project

3. Add PostgreSQL service
   - Railway auto-generates DATABASE_URL

4. Add Node.js service
   - Connect GitHub repository
   - Add build command: `npm install && npx prisma migrate deploy && npm run build`
   - Add start command: `npm start`

5. View deployed app

**Cost:** Pay for compute and database usage

---

### Option 3: Render

**Advantages:**
- Free tier available
- Easy deployments
- Built-in PostgreSQL
- Good documentation

**Steps:**

1. Sign up at https://render.com

2. Create PostgreSQL database
   - Copy connection string

3. Create Web Service
   - Connect GitHub
   - Build command: `npm install && npx prisma migrate deploy && npm run build`
   - Start command: `npm start`
   - Environment variable: `DATABASE_URL`

4. Deploy

**Cost:** Free tier (limited)

---

### Option 4: Docker Deployment

**For any cloud provider with Docker support**

```bash
# Build image
docker build -t kanban-board:latest .

# Push to registry (Docker Hub example)
docker tag kanban-board:latest your-username/kanban-board:latest
docker push your-username/kanban-board:latest

# Or use with docker-compose
docker-compose up -d
```

---

## 🌐 Database Setup by Provider

### PostgreSQL (Local Development)
```bash
# macOS (Homebrew)
brew install postgresql
brew services start postgresql
createdb kanban_db

# Windows (Download installer)
# https://www.postgresql.org/download/windows/

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql
sudo -u postgres createdb kanban_db
```

### Neon (Recommended Cloud)
1. Sign up at https://neon.tech
2. Create new project
3. Copy connection string to `.env.local`
4. Ready to use!

### Supabase
1. Sign up at https://supabase.com
2. Create new project
3. Copy connection string from settings
4. Add to `.env.local`

### AWS RDS
1. Create RDS instance
2. Copy endpoint and credentials
3. Format connection string:
```
postgresql://user:password@endpoint:5432/kanban_db
```

---

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations tested locally
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Drag & drop working
- [ ] Comments feature working
- [ ] Database operations verified
- [ ] Error handling tested
- [ ] Security review completed

---

## 🔐 Security Checklist

- [ ] DATABASE_URL not in code (only in .env)
- [ ] CORS configured if needed
- [ ] Input validation added
- [ ] Rate limiting configured
- [ ] HTTPS enforced (auto on Vercel/Railway)
- [ ] Authentication planned for private boards
- [ ] Sensitive data encrypted if needed
- [ ] SQL injection prevention (Prisma handles)

---

## 📈 Performance Optimization

### Database
```prisma
// Already optimized with indexes
@@index([columnId])
@@index([order])
@@index([cardId])
```

### API Routes
```typescript
// Enable response caching if needed
export const revalidate = 60 // 60 seconds

// Or disable caching
export const revalidate = 0
```

### Component Optimization
```typescript
// Use React.memo for expensive components
export const CardItem = React.memo(({ card, ...props }) => {
  return <div>{card.title}</div>
})
```

---

## 🛠️ Post-Deployment

### Monitor Application
- Check error logs
- Monitor database performance
- Track user activity
- Setup alerts

### Maintenance
- Regular database backups
- Keep dependencies updated
- Monitor security advisories
- Review logs monthly

### Scaling
- Add caching layer (Redis)
- Implement CDN for static assets
- Optimize database queries
- Consider read replicas

---

## 🚨 Troubleshooting Deployment

### Build Fails
```bash
# Clear cache
npm clean-install

# Check build
npm run build

# View build output
cat .next/BUILD_ID
```

### Database Connection Error
- Verify DATABASE_URL format
- Check IP whitelist (for cloud databases)
- Test connection locally: `npx prisma db execute --stdin`
- Check PostgreSQL version compatibility

### Performance Issues
```bash
# Check database query performance
npx prisma studio

# Enable query logging
DATABASE_LOG=query

# Profile application
npm run build -- --profile
```

---

## 💾 Database Migrations in Production

### With Prisma
```bash
# Automatic migration
npx prisma migrate deploy

# Manual migration
npx prisma migrate resolve --rolled-back migration_name
```

### Backup Before Migration
```sql
-- PostgreSQL backup
pg_dump kanban_db > backup.sql

-- Restore
psql kanban_db < backup.sql
```

---

## 📊 Environment Configuration

### Development
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/kanban_db"
NODE_ENV="development"
```

### Staging
```env
DATABASE_URL="postgresql://user:pass@staging-host:5432/kanban_db"
NODE_ENV="production"
```

### Production
```env
DATABASE_URL="postgresql://user:pass@prod-host:5432/kanban_db"
NODE_ENV="production"
```

---

## 🔗 Useful Links

**Hosting Providers:**
- Vercel: https://vercel.com
- Railway: https://railway.app
- Render: https://render.com
- AWS: https://aws.amazon.com

**Database Providers:**
- Neon: https://neon.tech
- Supabase: https://supabase.com
- Planetscale: https://planetscale.com
- AWS RDS: https://aws.amazon.com/rds

**Monitoring:**
- Vercel Analytics: vercel.com/analytics
- New Relic: newrelic.com
- Datadog: datadoghq.com

---

## 💡 Recommendations

1. **For Learning/Testing:**
   - Use Render free tier
   - Neon free PostgreSQL
   - Total cost: $0/month

2. **For Small Project:**
   - Vercel hobby ($0/month)
   - Neon pay-as-you-go (~$5/month)
   - Total cost: $5/month

3. **For Production:**
   - Vercel pro ($20/month)
   - AWS RDS or Neon dedicated
   - CloudFlare for CDN
   - Total cost: $50-100+/month

---

## 📝 Deployment Command Summary

```bash
# Vercel
npm i -g vercel
vercel login
vercel deploy

# Railway
npm i -g @railway/cli
railway login
railway up

# Docker
docker build -t myapp .
docker run -p 3000:3000 myapp

# Traditional Server
git clone <repo>
npm install
npx prisma migrate deploy
npm run build
npm start
```

---

**Congratulations! Your Kanban Board is ready for the world! 🎉**

Choose your deployment platform and follow the steps above to go live.
# deploy bump Fri Dec 12 13:30:32 CST 2025
