import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getFocusBlocks } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Gather today's scheduled tasks
    const scheduled = await db.scheduledTask.findMany({
      where: {
        userId: user.id,
        date: todayStr,
      },
      select: { name: true, time: true },
    });

    // Gather tasks due today or high priority in progress
    const tasks = await db.task.findMany({
      where: {
        project: { userId: user.id },
        status: { not: 'done' },
        OR: [
          { deadline: { not: null } }, // has deadline
          { priority: 'high' }
        ]
      },
      select: { name: true, priority: true, deadline: true },
    });

    // filter tasks due today
    const todayTasks = tasks.filter(t => {
      if (t.priority === 'high') return true;
      if (t.deadline) {
        const dStr = t.deadline.toISOString().split('T')[0];
        return dStr === todayStr;
      }
      return false;
    });

    const blocks = await getFocusBlocks(
      todayTasks.map(t => ({ name: t.name, priority: t.priority })),
      scheduled.map(s => ({ name: s.name, time: s.time }))
    );

    return NextResponse.json({ blocks });
  } catch (error) {
    console.error('API focus-blocks error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
