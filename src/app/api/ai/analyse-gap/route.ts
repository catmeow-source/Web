import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { checkResultObjectiveGap } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { objective, result } = await request.json();
    if (!objective || !result) {
      return NextResponse.json({ gap: null });
    }

    const gap = await checkResultObjectiveGap(objective, result);
    return NextResponse.json({ gap });
  } catch (error) {
    console.error('API analyse-gap error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
