import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function getUserIdFromRequest(request: NextRequest): string | null {
  try {
    let token = request.cookies.get('token')?.value;
    if (!token) {
      const auth = request.headers.get('authorization') || '';
      const m = auth.match(/^Bearer\s+(.+)$/i);
      if (m) token = m[1];
    }
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId.toString();
  } catch (error) {
    return null;
  }
}
