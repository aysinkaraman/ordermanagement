# Kanban Board - Complete Setup Guide

## Quick Start (5 minutes)

### 1. Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud like Neon)
- Git (optional)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Database
Create `.env.local` file in the project root:

**For Local PostgreSQL:**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/kanban_db"
```

**For Neon (Cloud PostgreSQL):**
1. Create account at https://neon.tech
2. Create new project and copy connection string
3. Add to `.env.local`:
```env
DATABASE_URL="postgresql://user:password@project.neon.tech/kanban_db?sslmode=require"
```

### 4. Setup Database
```bash
# Create and run migrations
npx prisma migrate dev --name init

# Verify with Prisma Studio (optional)
npx prisma studio
```

### 5. Run Application
```bash
npm run dev
```

Visit http://localhost:3000

---

## Detailed Architecture

### Frontend Components

#### `Board.tsx`
Main board container with drag-and-drop context.

**Features:**
- Manages overall board state
- Handles column creation and deletion
- Horizontal column drag & drop
- Integrates DndContext for drag operations

**Key Functions:**
```typescript
- handleAddColumn(): Creates new column via POST /api/columns
- handleDeleteColumn(): Deletes column via DELETE /api/columns/:id
- handleDragEnd(): Updates column order on drag completion
```

#### `BoardColumn.tsx`
Individual column component with cards.

**Features:**
- Display cards in vertical order
- Edit column title
- Add cards
- Delete column
- Vertical card sorting

**Key Functions:**
```typescript
- handleAddCard(): Creates card via POST /api/cards
- handleUpdateTitle(): Updates column name via PATCH /api/columns/:id
- handleDeleteCard(): Deletes card via DELETE /api/cards/:id
- handleCardUpdate(): Refreshes card data after edits
```

#### `CardItem.tsx`
Individual card component with drag capabilities.

**Features:**
- Draggable card element
- Quick delete button
- Open modal on click
- Show title and description preview
- Optimistic UI updates

#### `CardModal.tsx`
Detailed card view modal.

**Features:**
- Edit title and description
- View and add comments
- View activity timeline
- Save changes instantly
- Beautiful responsive design

### Backend API Routes

#### Columns API
```
GET    /api/columns
POST   /api/columns
PATCH  /api/columns/:id
DELETE /api/columns/:id
```

**GET /api/columns**
- Returns all columns with nested cards, comments, and activities
- Ordered by column.order
- Cards ordered by card.order

**POST /api/columns**
```json
{
  "title": "To Do"
}
```

**PATCH /api/columns/:id**
```json
{
  "title": "In Progress",
  "order": 1
}
```

#### Cards API
```
POST   /api/cards
PATCH  /api/cards/:id
DELETE /api/cards/:id
```

**POST /api/cards**
```json
{
  "columnId": "col123",
  "title": "Build feature",
  "description": "Implement dark mode"
}
```

**PATCH /api/cards/:id**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "columnId": "col456",
  "order": 2
}
```

**Features:**
- Automatically creates activity log entry
- Updates card.order for drag positioning
- Logs card moves and title changes

#### Comments API
```
POST /api/comments
```

**POST /api/comments**
```json
{
  "cardId": "card123",
  "text": "Great progress!"
}
```

**Features:**
- Creates comment with timestamp
- Logs activity: "Comment added"
- Returns created comment

#### Activities API
```
GET /api/activities/:cardId
```

**Response:**
```json
[
  {
    "id": "act123",
    "cardId": "card123",
    "message": "Card created",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### Database Schema

#### Column Table
```prisma
model Column {
  id        String   @id @default(cuid())
  title     String
  order     Int      // Sort order
  cards     Card[]   // One-to-many relationship
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([order])
}
```

#### Card Table
```prisma
model Card {
  id          String    @id @default(cuid())
  columnId    String
  column      Column    @relation(fields: [columnId], references: [id], onDelete: Cascade)
  title       String
  description String?
  order       Int       // Sort order within column
  comments    Comment[] // One-to-many
  activities  Activity[] // One-to-many
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([columnId])
  @@index([order])
}
```

#### Comment Table
```prisma
model Comment {
  id        String   @id @default(cuid())
  cardId    String
  card      Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
  text      String
  createdAt DateTime @default(now())
  
  @@index([cardId])
}
```

#### Activity Table
```prisma
model Activity {
  id        String   @id @default(cuid())
  cardId    String
  card      Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
  message   String
  createdAt DateTime @default(now())
  
  @@index([cardId])
  @@index([createdAt])
}
```

---

## Drag & Drop Implementation

### Column Drag (Horizontal)
```typescript
// Uses horizontalListSortingStrategy
// Columns are reorderable left/right
// Order field updated in DB on drop
```

### Card Drag (Vertical & Cross-column)
```typescript
// Uses verticalListSortingStrategy per column
// Cards can move:
//   - Up/down within same column
//   - Across different columns
// Position and columnId updated on drop
```

### dnd-kit Library
Key hooks:
- `useSortable()`: Makes element draggable/droppable
- `DndContext`: Wraps entire drag area
- `SortableContext`: Creates sorting zone
- `DragOverlay`: Renders drag preview

---

## State Management

### Client-Side State
```typescript
// Board.tsx
const [columns, setColumns] = useState<(Column & { cards: Card[] })[]>()
const [activeId, setActiveId] = useState<string | null>(null)
const [loading, setLoading] = useState(false)

// BoardColumn.tsx
const [cards, setCards] = useState<Card[]>()
const [title, setTitle] = useState(string)
const [editingTitle, setEditingTitle] = useState(boolean)

// CardModal.tsx
const [comments, setComments] = useState<Comment[]>()
const [activities, setActivities] = useState<Activity[]>()
const [newComment, setNewComment] = useState(string)
```

### Optimistic Updates
All mutations update UI immediately, sync with DB in background:
```typescript
// 1. Update UI immediately
setCards(prev => [...prev, newCard])

// 2. Save to DB
axios.post('/api/cards', cardData)

// 3. Show error if failed
.catch(error => toast.error('Failed'))
```

---

## Key Features Explained

### 1. Drag & Drop with Order Persistence
- Every drag operation updates the `order` field
- Order queries sort by this field
- Enables perfect position restoration

### 2. Activity Logging
Automatically triggered on:
- Card creation: `"Card '{title}' created"`
- Card rename: `"Card renamed from '{old}' to '{new}'"`
- Column move: `"Card moved to a different column"`
- Comment added: `"Comment added"`

### 3. Comment System
- Attached to specific cards
- Timestamps shown in modal
- Activity logged automatically

### 4. Cascade Deletion
- Deleting column → deletes all cards → deletes comments/activities
- Defined in Prisma with `onDelete: Cascade`

---

## Styling Guide

### TailwindCSS Classes Used
- **Layout**: `flex`, `grid`, `flex-col`, `gap-*`
- **Spacing**: `p-*`, `m-*`, `space-y-*`
- **Colors**: `bg-blue-600`, `text-gray-800`, `border-gray-300`
- **Interactive**: `hover:`, `focus:`, `active:`
- **Responsive**: `flex-shrink-0`, `overflow-x-auto`, `max-h-[90vh]`

### Customization
Edit `tailwind.config.js` to:
- Change color scheme
- Adjust spacing
- Add custom fonts
- Extend theme

---

## Production Deployment

### Building
```bash
npm run build
npm run start
```

### Environment Variables (Production)
```env
DATABASE_URL="postgresql://user:password@prod-host/kanban"
NODE_ENV="production"
```

### Hosting Options
- **Vercel**: Deploy Next.js directly
- **Railway**: Simple PostgreSQL + Node hosting
- **Render**: Full-stack deployment platform
- **Supabase**: PostgreSQL + Hosting combo

---

## Troubleshooting

### Database Connection Fails
```bash
# Test connection
npx prisma db execute --stdin < /dev/null

# Check PostgreSQL running
psql -U postgres -d postgres

# View DATABASE_URL in console
echo $DATABASE_URL
```

### Drag & Drop Not Working
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

### Prisma Migration Issues
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Push schema without migration
npx prisma db push

# Generate client
npx prisma generate
```

---

## Performance Optimization

### Query Optimization
```typescript
// Include only needed relations
include: {
  cards: {
    include: {
      comments: true,
      activities: true
    }
  }
}
```

### Caching Strategies
- Use SWR or React Query for client caching
- Implement request deduplication
- Add optimistic updates

### Database Indexing
Already optimized in schema:
- `@@index([columnId])` on cards
- `@@index([order])` on columns and cards
- `@@index([cardId])` on comments/activities

---

## Future Enhancements

```typescript
// 1. User Authentication
- Add NextAuth.js
- Restrict board access
- Track activity by user

// 2. Real-time Collaboration
- WebSocket integration
- Live cursor positions
- Real-time card updates

// 3. Advanced Features
- Labels/tags on cards
- Checklists
- Card templates
- Recurring cards
- Card estimation
- Sprint planning

// 4. Analytics
- Activity reports
- Velocity tracking
- Card cycle time
- Team productivity

// 5. Mobile App
- React Native version
- Offline support
- Push notifications
```

---

## File Reference

```
kanban-board/
├── app/
│   ├── api/
│   │   ├── columns/
│   │   │   ├── route.ts          (GET, POST)
│   │   │   └── [id]/route.ts     (PATCH, DELETE)
│   │   ├── cards/
│   │   │   ├── route.ts          (POST)
│   │   │   └── [id]/route.ts     (PATCH, DELETE)
│   │   ├── comments/
│   │   │   └── route.ts          (POST)
│   │   └── activities/
│   │       └── [cardId]/route.ts (GET)
│   ├── layout.tsx                 (Root layout, Toaster)
│   ├── page.tsx                   (Home page, fetch initial data)
│   └── globals.css                (Tailwind directives)
├── components/
│   ├── Board.tsx                  (Main board, column drag)
│   ├── BoardColumn.tsx            (Single column, cards, add card)
│   ├── CardItem.tsx               (Single card, drag, delete)
│   └── CardModal.tsx              (Card details, comments, activity)
├── lib/
│   └── prisma.ts                  (Prisma singleton)
├── prisma/
│   └── schema.prisma              (Database schema)
├── package.json                   (Dependencies)
├── tsconfig.json                  (TypeScript config)
├── tailwind.config.js             (Tailwind config)
├── postcss.config.js              (PostCSS config)
├── next.config.js                 (Next.js config)
└── README.md                      (Documentation)
```

---

## Support

For issues:
1. Check error messages in browser console
2. Check server logs in terminal
3. Verify `.env.local` has correct DATABASE_URL
4. Run `npx prisma studio` to inspect database
5. Check Prisma documentation: https://www.prisma.io/docs

---

**Happy building! 🚀**
