import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import db from './db';

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Session life: 7 days
const SESSION_EXPIRY_DAYS = 7;

// Create a session in DB and set cookie
export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  const session = await db.session.create({
    data: {
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set('session', session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return session.id;
}

// Get the currently logged-in user from the session cookie
export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) {
      return null;
    }

    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            theme: true,
            reminderTiming: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      // Clean up expired session
      await db.session.delete({
        where: { id: sessionId },
      }).catch(() => {});
      
      const cookieStore = await cookies();
      cookieStore.delete('session');
      return null;
    }

    return session.user;
  } catch (error) {
    console.error('Error getting session user:', error);
    return null;
  }
}

// Delete the current session and clear cookie
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (sessionId) {
      await db.session.delete({
        where: { id: sessionId },
      }).catch(() => {});
    }

    cookieStore.delete('session');
  } catch (error) {
    console.error('Error destroying session:', error);
  }
}
