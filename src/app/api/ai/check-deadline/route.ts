import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getDeadlineSuggestion } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date } = await request.json(); // YYYY-MM-DD

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // Calculate start and end of that week (Sunday to Saturday)
    const day = targetDate.getDay();
    const diff = targetDate.getDate() - day;
    
    const startOfWeek = new Date(targetDate.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Count project deadlines in this range
    const projectDeadlines = await db.project.count({
      where: {
        userId: user.id,
        deadline: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
        status: { not: 'done' },
      },
    });

    // Count task deadlines in this range
    const taskDeadlines = await db.task.count({
      where: {
        project: { userId: user.id },
        deadline: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
        status: { not: 'done' },
      },
    });

    const totalDeadlines = projectDeadlines + taskDeadlines;
    const suggestion = await getDeadlineSuggestion(totalDeadlines, date);

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Check deadline API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
