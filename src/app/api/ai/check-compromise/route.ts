import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { detectCompromisePattern } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { compromise } = await request.json();

    if (!compromise || compromise.trim().length === 0) {
      return NextResponse.json({ warning: null });
    }

    // Fetch all past compromises for user
    const projects = await db.project.findMany({
      where: {
        userId: user.id,
        compromise: { not: '' },
      },
      select: { compromise: true },
    });

    const tasks = await db.task.findMany({
      where: {
        project: { userId: user.id },
        compromise: { not: '' },
      },
      select: { compromise: true },
    });

    const habits = await db.habit.findMany({
      where: {
        userId: user.id,
        compromise: { not: '' },
      },
      select: { compromise: true },
    });

    const pastCompromises = [
      ...projects.map(p => p.compromise),
      ...tasks.map(t => t.compromise),
      ...habits.map(h => h.compromise),
    ].filter(c => c && c.trim().toLowerCase() !== compromise.trim().toLowerCase()); // exclude current text if already saved

    const warning = await detectCompromisePattern(compromise, pastCompromises);

    return NextResponse.json({ warning });
  } catch (error) {
    console.error('Check compromise API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
