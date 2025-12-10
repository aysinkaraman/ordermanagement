# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently no authentication required. All endpoints are public.

---

## Columns

### GET /columns
Retrieve all columns with their cards, comments, and activities.

**Response:**
```json
[
  {
    "id": "clj1a2b3c4d5e6f7g8h9i0j1",
    "title": "To Do",
    "order": 0,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "cards": [
      {
        "id": "clj2a2b3c4d5e6f7g8h9i0j1",
        "columnId": "clj1a2b3c4d5e6f7g8h9i0j1",
        "title": "Implement API",
        "description": "Create REST endpoints",
        "order": 0,
        "createdAt": "2024-01-15T10:05:00Z",
        "updatedAt": "2024-01-15T10:05:00Z",
        "comments": [],
        "activities": []
      }
    ]
  }
]
```

**Status:** 200 OK

---

### POST /columns
Create a new column.

**Request Body:**
```json
{
  "title": "In Progress"
}
```

**Response:**
```json
{
  "id": "clj1a2b3c4d5e6f7g8h9i0j2",
  "title": "In Progress",
  "order": 1,
  "createdAt": "2024-01-15T10:10:00Z",
  "updatedAt": "2024-01-15T10:10:00Z",
  "cards": []
}
```

**Status:** 201 Created

**Errors:**
- 500: Failed to create column

---

### PATCH /columns/:id
Update column title or order.

**Request Body:**
```json
{
  "title": "Backlog",
  "order": 2
}
```

**Response:**
```json
{
  "id": "clj1a2b3c4d5e6f7g8h9i0j1",
  "title": "Backlog",
  "order": 2,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:15:00Z",
  "cards": []
}
```

**Status:** 200 OK

**Errors:**
- 500: Failed to update column

---

### DELETE /columns/:id
Delete a column (cascades to cards and their comments/activities).

**Response:**
```json
{
  "success": true
}
```

**Status:** 200 OK

**Errors:**
- 500: Failed to delete column

---

## Cards

### POST /cards
Create a new card in a column.

**Request Body:**
```json
{
  "columnId": "clj1a2b3c4d5e6f7g8h9i0j1",
  "title": "Build authentication",
  "description": "Implement user login with JWT"
}
```

**Response:**
```json
{
  "id": "clj2a2b3c4d5e6f7g8h9i0j1",
  "columnId": "clj1a2b3c4d5e6f7g8h9i0j1",
  "title": "Build authentication",
  "description": "Implement user login with JWT",
  "order": 0,
  "createdAt": "2024-01-15T10:20:00Z",
  "updatedAt": "2024-01-15T10:20:00Z",
  "comments": [],
  "activities": [
    {
      "id": "clj3a2b3c4d5e6f7g8h9i0j1",
      "cardId": "clj2a2b3c4d5e6f7g8h9i0j1",
      "message": "Card \"Build authentication\" created",
      "createdAt": "2024-01-15T10:20:00Z"
    }
  ]
}
```

**Status:** 201 Created

**Errors:**
- 500: Failed to create card

**Note:** Creating a card automatically generates an activity log entry.

---

### PATCH /cards/:id
Update card properties (title, description, position, or column).

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "columnId": "clj1a2b3c4d5e6f7g8h9i0j2",
  "order": 1
}
```

**Response:**
```json
{
  "id": "clj2a2b3c4d5e6f7g8h9i0j1",
  "columnId": "clj1a2b3c4d5e6f7g8h9i0j2",
  "title": "Updated title",
  "description": "Updated description",
  "order": 1,
  "createdAt": "2024-01-15T10:20:00Z",
  "updatedAt": "2024-01-15T10:25:00Z",
  "comments": [],
  "activities": [
    {
      "id": "clj3a2b3c4d5e6f7g8h9i0j2",
      "cardId": "clj2a2b3c4d5e6f7g8h9i0j1",
      "message": "Card renamed from \"Build authentication\" to \"Updated title\"",
      "createdAt": "2024-01-15T10:25:00Z"
    },
    {
      "id": "clj3a2b3c4d5e6f7g8h9i0j3",
      "cardId": "clj2a2b3c4d5e6f7g8h9i0j1",
      "message": "Card moved to a different column",
      "createdAt": "2024-01-15T10:25:00Z"
    }
  ]
}
```

**Status:** 200 OK

**Errors:**
- 404: Card not found
- 500: Failed to update card

**Note:** 
- Only specified fields are updated
- Title/column/position changes automatically create activity entries

---

### DELETE /cards/:id
Delete a card (cascades to comments and activities).

**Response:**
```json
{
  "success": true
}
```

**Status:** 200 OK

**Errors:**
- 500: Failed to delete card

---

## Comments

### POST /comments
Add a comment to a card.

**Request Body:**
```json
{
  "cardId": "clj2a2b3c4d5e6f7g8h9i0j1",
  "text": "Good progress on this task!"
}
```

**Response:**
```json
{
  "id": "clj4a2b3c4d5e6f7g8h9i0j1",
  "cardId": "clj2a2b3c4d5e6f7g8h9i0j1",
  "text": "Good progress on this task!",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Status:** 201 Created

**Errors:**
- 500: Failed to create comment

**Note:** Creating a comment automatically generates an activity log entry: "Comment added"

---

## Activities

### GET /activities/:cardId
Retrieve all activity log entries for a specific card.

**Response:**
```json
[
  {
    "id": "clj3a2b3c4d5e6f7g8h9i0j4",
    "cardId": "clj2a2b3c4d5e6f7g8h9i0j1",
    "message": "Comment added",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "clj3a2b3c4d5e6f7g8h9i0j3",
    "cardId": "clj2a2b3c4d5e6f7g8h9i0j1",
    "message": "Card moved to a different column",
    "createdAt": "2024-01-15T10:25:00Z"
  },
  {
    "id": "clj3a2b3c4d5e6f7g8h9i0j2",
    "cardId": "clj2a2b3c4d5e6f7g8h9i0j1",
    "message": "Card renamed from \"Build authentication\" to \"Updated title\"",
    "createdAt": "2024-01-15T10:25:00Z"
  },
  {
    "id": "clj3a2b3c4d5e6f7g8h9i0j1",
    "cardId": "clj2a2b3c4d5e6f7g8h9i0j1",
    "message": "Card \"Updated title\" created",
    "createdAt": "2024-01-15T10:20:00Z"
  }
]
```

**Status:** 200 OK

**Ordering:** Activities are returned in descending order by `createdAt` (newest first).

**Errors:**
- 500: Failed to fetch activities

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "error": "Description of what went wrong"
}
```

**Common Status Codes:**
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider:
- Implementing rate limiting middleware
- Adding authentication tokens
- Using Next.js API route protection

---

## Example cURL Commands

### Get all columns
```bash
curl http://localhost:3000/api/columns
```

### Create a column
```bash
curl -X POST http://localhost:3000/api/columns \
  -H "Content-Type: application/json" \
  -d '{"title":"To Do"}'
```

### Create a card
```bash
curl -X POST http://localhost:3000/api/cards \
  -H "Content-Type: application/json" \
  -d '{
    "columnId": "clj1a2b3c4d5e6f7g8h9i0j1",
    "title": "New card",
    "description": "Card description"
  }'
```

### Add a comment
```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "clj2a2b3c4d5e6f7g8h9i0j1",
    "text": "Great work!"
  }'
```

### Get activities for a card
```bash
curl http://localhost:3000/api/activities/clj2a2b3c4d5e6f7g8h9i0j1
```

---

## Integration Example

### Using Axios (JavaScript/TypeScript)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Fetch all columns
const columns = await api.get('/columns');

// Create a card
const newCard = await api.post('/cards', {
  columnId: 'col-123',
  title: 'New Task',
  description: 'Task description'
});

// Update a card
await api.patch(`/cards/${cardId}`, {
  title: 'Updated Title',
  order: 2
});

// Delete a card
await api.delete(`/cards/${cardId}`);

// Add a comment
await api.post('/comments', {
  cardId: 'card-123',
  text: 'This is important'
});

// Get activity log
const activities = await api.get(`/activities/${cardId}`);
```

### Using Fetch (Browser)
```javascript
// Get columns
const response = await fetch('http://localhost:3000/api/columns');
const columns = await response.json();

// Create card
const createResponse = await fetch('http://localhost:3000/api/cards', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    columnId: 'col-123',
    title: 'New Task'
  })
});
const newCard = await createResponse.json();
```

---

## Best Practices

1. **Always include error handling**
   ```typescript
   try {
     const response = await api.post('/cards', data);
   } catch (error) {
     console.error('Failed to create card:', error);
     // Show user feedback
   }
   ```

2. **Optimistic updates** - Update UI before confirming with server
   ```typescript
   // 1. Update state immediately
   setCards([...cards, newCard]);
   
   // 2. Save to server
   try {
     await api.post('/cards', newCard);
   } catch (error) {
     // Revert on failure
     setCards(originalCards);
   }
   ```

3. **Debounce frequent updates** - For drag operations
   ```typescript
   const debouncedUpdate = debounce((cardId, order) => {
     api.patch(`/cards/${cardId}`, { order });
   }, 500);
   ```

---

For more information, see the main [README.md](README.md) and [SETUP_GUIDE.md](SETUP_GUIDE.md).
