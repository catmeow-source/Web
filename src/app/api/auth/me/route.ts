import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

// Force dynamic is required because headers() / cookies() are dynamic functions
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error checking auth state' },
      { status: 500 }
    );
  }
}
