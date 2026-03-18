import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function decodeUserId(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string | number };
    if (decoded?.userId === undefined || decoded?.userId === null) return null;
    return String(decoded.userId);
  } catch {
    return null;
  }
}

export function getUserIdFromRequest(request: NextRequest): string | null {
  const auth = request.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  const headerToken = m?.[1];
  const cookieToken = request.cookies.get('token')?.value;

  // Try bearer first; if it's stale/invalid, fall back to cookie token.
  return decodeUserId(headerToken) || decodeUserId(cookieToken);
}
