import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, inviteToken } = await request.json();

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    // If registration came from an invite, accept it and add membership
    if (inviteToken) {
      const invitation = await prisma.invitation.findUnique({
        where: { token: inviteToken },
      });

      if (
        invitation &&
        !invitation.accepted &&
        new Date() <= invitation.expiresAt &&
        invitation.email.toLowerCase() === email.toLowerCase()
      ) {
        if (invitation.boardId) {
          const exists = await prisma.boardMember.findUnique({
            where: { boardId_userId: { boardId: invitation.boardId, userId: user.id } },
          });
          if (!exists) {
            await prisma.boardMember.create({
              data: { boardId: invitation.boardId, userId: user.id, role: invitation.role || 'member' },
            });
          }
        }

        if (invitation.teamId) {
          const exists = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId: invitation.teamId, userId: user.id } },
          });
          if (!exists) {
            await prisma.teamMember.create({
              data: { teamId: invitation.teamId, userId: user.id, role: invitation.role || 'member' },
            });
          }
        }

        await prisma.invitation.update({
          where: { token: inviteToken },
          data: { accepted: true },
        });
      }
    }

    // Auto-login after successful registration
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({ user, token }, { status: 201 });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
