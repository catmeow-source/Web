import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true, message: 'Logged out successfully' }, { status: 200 });
  } catch (error) {
    console.error('Logout API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error during logout' },
      { status: 500 }
    );
  }
}
