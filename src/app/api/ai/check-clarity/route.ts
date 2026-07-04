import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { checkObjectiveClarity } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { objective } = await request.json();
    if (!objective) {
      return NextResponse.json({ warning: null });
    }

    const warning = await checkObjectiveClarity(objective);
    return NextResponse.json({ warning });
  } catch (error) {
    console.error('API check-clarity error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
