import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSmartTaskBreakdown } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { objective } = await request.json();
    if (!objective) {
      return NextResponse.json({ error: 'Objective is required' }, { status: 400 });
    }

    const suggestions = await getSmartTaskBreakdown(objective);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('API breakdown error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
