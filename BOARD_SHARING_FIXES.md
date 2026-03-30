# Board Sharing & User Management - Fixes Documentation

## Issues Fixed

### 1. ✅ Board Sharing Authorization Issue
**Problem:** You couldn't share the board with `reirafghaisani@gmail.com`

**Root Cause:** The authorization check was too strict. It required the user to either:
- Be the board owner, OR  
- Have a `BoardMember` record on the board

However, the board owner (`aysinkaraman5@gmail.com`) might not have had a `BoardMember` record, which could cause the authorization check to fail.

**Solution Applied:**
- **File:** `/app/api/boards/[id]/members/route.ts` (POST handler)
- **Change:** Improved the authorization logic to:
  1. First find the board by ID (instead of filtering in the WHERE clause)
  2. Explicitly check if the user is the board owner
  3. If not the owner, explicitly check if they have a BoardMember record
  4. Return proper error messages instead of generic "Not authorized"

```typescript
// OLD: Strict check that could fail
const board = await prisma.board.findFirst({
  where: {
    id: params.id,
    OR: [
      { ownerId: userId },
      { members: { some: { userId } } }
    ]
  }
});

// NEW: More reliable check
const board = await prisma.board.findUnique({ where: { id: params.id } });
const isOwner = String(board.ownerId) === String(userId);
const isMember = !isOwner && await prisma.boardMember.findUnique({...});
if (!isOwner && !isMember) {
  return NextResponse.json({ error: 'Not authorized...' });
}
```

**How to Test:**
1. Log in as `aysinkaraman5@gmail.com`
2. Go to the board you own
3. Try sharing with `reirafghaisani@gmail.com`
4. You should see either:
   - ✅ "Member added successfully" (if the user already exists)
   - ✅ "Invitation sent! Share this link..." (if the user needs to register first)

---

### 2. ✅ User Account Deletion Feature
**Problem:** When removing users from a board, their user accounts weren't being deleted

**Solution Applied:**
- **Files Modified:**
  - `/app/api/boards/[id]/members/[memberId]/route.ts` (DELETE handler)
  - `/components/ShareBoardModal.tsx` (Frontend)
  - `/app/falcon/page.tsx` (Frontend)

**New Feature:** Optional account deletion
- When you remove a member, you now have a choice:
  - **OK** = Delete their account (only if they have no other board/team memberships)
  - **Cancel** = Just remove them from this board (keep their account)

**How It Works:**
1. Delete request includes optional `?deleteAccount=true` query parameter
2. Server checks if user has any other memberships or owned boards/teams
3. If they have no other associations, the User account is deleted
4. If they do have other associations, they're kept but removed from this board

**Code Changes:**

```typescript
// NEW: Account deletion logic
if (deleteAccount) {
  // Check if user has other associations
  const otherBoardMembers = await prisma.boardMember.count({...});
  const otherTeamMembers = await prisma.teamMember.count({...});
  const ownedBoards = await prisma.board.count({...});
  const ownedTeams = await prisma.team.count({...});
  
  // Only delete if no other associations
  if (otherBoardMembers === 0 && otherTeamMembers === 0 && 
      ownedBoards === 0 && ownedTeams === 0) {
    await prisma.user.delete({...});
  }
}
```

**How to Use:**
1. Open Share Board modal
2. Click "Remove" next to a member
3. Choose:
   - OK = Delete account (if possible)
   - Cancel = Just remove from board

---

## Enhanced Features

### Better Error Messages
- **Before:** Generic "Failed to add member" errors
- **After:** Specific error messages that help you diagnose issues:
  - "User is already a member"
  - "Board not found"
  - "Not authorized to share this board"
  - Database-specific error details

### Token Handling
- Both endpoints now properly handle authentication tokens
- Supports both bearer tokens and cookie-based auth
- Better validation of user identity

---

## Debug Tips

If sharing still doesn't work:

1. **Check your authentication token:**
   - Log in and check if `localStorage.getItem('token')` returns a valid token
   - The token should start with "eyJ..." (JWT format)

2. **Run the debug script:**
   ```bash
   node debug-sharing.js <BOARD_ID> <YOUR_TOKEN> reirafghaisani@gmail.com
   ```
   This will show you:
   - Current board members
   - Exact error message when sharing fails
   - Updated member list after adding

3. **Check the browser console:**
   - Open DevTools (F12)
   - Go to Network tab
   - Try sharing and look for the POST request to `/api/boards/[id]/members`
   - Check the response for error details

4. **Check server logs:**
   - The API logs errors with: `console.error('Add member error:', error)`
   - Check your terminal where the Next.js server is running

---

## API Documentation

### Add Board Member
**Endpoint:** `POST /api/boards/:id/members`

**Request:**
```json
{
  "email": "user@example.com",
  "role": "member" // or "admin"
}
```

**Responses:**
- `200` - Member added or invitation created
- `400` - User already a member / Invalid request
- `401` - Not authenticated
- `403` - Not authorized to share this board
- `404` - Board not found
- `500` - Server error (check logs for details)

### Remove Board Member
**Endpoint:** `DELETE /api/boards/:id/members/:memberId?deleteAccount=true`

**Query Parameters:**
- `deleteAccount=true` - Optional, delete user account if they have no other associations

**Responses:**
- `200` - Member removed (with optional `accountDeleted: true`)
- `400` - Cannot remove owner / Other error
- `401` - Not authenticated
- `403` - Not authorized
- `404` - Member not found
- `500` - Server error

### Get Board Members
**Endpoint:** `GET /api/boards/:id/members`

**Response:**
```json
[
  {
    "id": "member_id",
    "boardId": "board_id",
    "userId": "user_id",
    "role": "owner|admin|member",
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "avatar": "avatar_url"
    }
  }
]
```

---

## Summary

✅ **Fixed:** Board sharing authorization now works reliably  
✅ **Added:** Optional account deletion when removing users  
✅ **Improved:** Better error messages for debugging  
✅ **Result:** More robust user management workflow

The system now properly identifies board owners and allows them to share boards with new users. When removing users, you have the flexibility to either keep their account (if they're on other boards) or delete it completely (if they have no other associations).
