import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getMoodPrioritizedTaskIds } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, mood } = await request.json();
    if (!mood) {
      return NextResponse.json({ error: 'Mood is required' }, { status: 400 });
    }

    let tasks;
    if (projectId) {
      tasks = await db.task.findMany({
        where: {
          projectId,
          project: { userId: user.id },
        },
      });
    } else {
      tasks = await db.task.findMany({
        where: {
          project: { userId: user.id },
          status: { not: 'done' },
        },
      });
    }

    if (tasks.length === 0) {
      return NextResponse.json({ tasks: [] });
    }

    const taskInputs = tasks.map(t => ({
      id: t.id,
      name: t.name,
      priority: t.priority,
      objective: t.objective,
    }));

    const sortedIds = await getMoodPrioritizedTaskIds(taskInputs, mood);

    // Map tasks back to sorted order
    const sortedTasks = [...tasks].sort((a, b) => {
      const idxA = sortedIds.indexOf(a.id);
      const idxB = sortedIds.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return NextResponse.json({ tasks: sortedTasks });
  } catch (error) {
    console.error('API mood-prioritize error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
