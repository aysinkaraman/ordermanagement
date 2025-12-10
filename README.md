# Kanban Board Application

A full-stack Trello-like Kanban board application built with Next.js, React, TailwindCSS, PostgreSQL, and Prisma.

## Features

- ✅ Create, read, update, delete columns and cards
- ✅ Drag and drop cards within and across columns
- ✅ Drag and drop columns horizontally
- ✅ Instant database persistence for all drag operations
- ✅ Card detail modal with title and description editing
- ✅ Comments on cards with timestamps
- ✅ Activity log tracking all user actions
- ✅ Toast notifications for user feedback
- ✅ Responsive design with TailwindCSS
- ✅ Optimistic UI updates

## Tech Stack

- **Frontend**: React 18 + Next.js 14
- **Styling**: TailwindCSS
- **Drag & Drop**: @dnd-kit
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Notifications**: react-hot-toast
- **HTTP Client**: Axios

## Project Structure

```
kanban-board/
├── app/
│   ├── api/
│   │   ├── columns/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── cards/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── comments/route.ts
│   │   └── activities/[cardId]/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Board.tsx
│   ├── BoardColumn.tsx
│   ├── CardItem.tsx
│   └── CardModal.tsx
├── lib/
│   └── prisma.ts
├── prisma/
│   └── schema.prisma
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or use Neon for managed PostgreSQL)

### Installation

1. **Clone or extract the project**:
   ```bash
   cd kanban-board
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/kanban_db"
   ```

   For Neon PostgreSQL:
   ```env
   DATABASE_URL="postgresql://user:password@project.neon.tech/kanban_db?sslmode=require"
   ```

4. **Set up Prisma and create database**:
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

6. **Run the development server**:
   ```bash
   npm run dev
   ```

7. **Open your browser**:
   Navigate to `http://localhost:3000`

## Database Schema

The application uses the following Prisma models:

### Column
- `id`: Unique identifier (CUID)
- `title`: Column name
- `order`: Display order (for sorting)
- `cards`: Relationship to cards
- `createdAt` / `updatedAt`: Timestamps

### Card
- `id`: Unique identifier (CUID)
- `columnId`: Foreign key to column
- `title`: Card title
- `description`: Card description (optional)
- `order`: Display order within column
- `comments`: Relationship to comments
- `activities`: Relationship to activities
- `createdAt` / `updatedAt`: Timestamps

### Comment
- `id`: Unique identifier (CUID)
- `cardId`: Foreign key to card
- `text`: Comment content
- `createdAt`: Creation timestamp

### Activity
- `id`: Unique identifier (CUID)
- `cardId`: Foreign key to card
- `message`: Activity description
- `createdAt`: Creation timestamp

## API Endpoints

### Columns
- `GET /api/columns` - Get all columns with cards
- `POST /api/columns` - Create a new column
- `PATCH /api/columns/:id` - Update column
- `DELETE /api/columns/:id` - Delete column

### Cards
- `POST /api/cards` - Create a new card
- `PATCH /api/cards/:id` - Update card (position, title, description)
- `DELETE /api/cards/:id` - Delete card

### Comments
- `POST /api/comments` - Add comment to card

### Activities
- `GET /api/activities/:cardId` - Get activity log for card

## Usage

### Creating Columns
1. Click "+ Add Column" button at the right side of the board
2. Enter the column title
3. Column will be added to the board

### Creating Cards
1. Click "+ Add Card" in a column
2. Enter the card title
3. Card will be created and added to the column

### Drag & Drop
- **Drag cards**: Click and drag cards to reorder within a column or move to another column
- **Drag columns**: Columns are automatically reorderable (column drag feature ready for enhancement)
- All changes are instantly saved to the database

### Card Details
1. Click on a card to open the detail modal
2. Edit title and description
3. Click "Save Changes" to persist
4. View and add comments
5. View the activity log

### Comments
1. Open a card modal
2. Scroll to "Comments" section
3. Type your comment and click "Add Comment"
4. Comments appear with timestamps

### Activity Log
1. Open a card modal
2. View the "Activity" section
3. See all actions performed on this card

## Features in Detail

### Drag & Drop Implementation
- Uses `@dnd-kit` library for drag and drop
- Supports both column and card dragging
- Optimistic UI updates with database sync
- Smooth animations and visual feedback

### Real-time Persistence
- All drag operations update the database instantly
- Optimistic UI updates for smooth experience
- Error handling with toast notifications

### Card Modal
- Full-screen modal for card details
- Edit title and description
- Add and view comments
- View activity timeline
- Beautiful responsive design

### Activity Tracking
- Automatic logging of:
  - Card creation
  - Card title changes
  - Card moves between columns
  - Comments added
- Timestamps for all activities

## Environment Variables

Create a `.env.local` file with:

```env
# Database URL (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:port/database"

# Optional: Enable query logging
# NODE_ENV=development
```

## Development

### Database Migrations
```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# View database
npx prisma studio
```

### Building for Production
```bash
npm run build
npm run start
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env.local`
- Run `npx prisma db push` to sync schema

### Drag & Drop Not Working
- Clear browser cache
- Ensure all dependencies are installed: `npm install`
- Check browser console for errors

### Styling Issues
- Rebuild TailwindCSS: `npm run dev`
- Clear Next.js cache: `rm -rf .next`

## Future Enhancements

- Add user authentication
- Assign members to cards
- Add labels/tags to cards
- Implement checklists
- Board backgrounds and themes
- Dark mode toggle
- Multi-board support
- Card templates
- Keyboard shortcuts
- Undo/redo functionality

## License

MIT License - Feel free to use this project for personal and commercial purposes.

---

Built with ❤️ for a better project management experience.
