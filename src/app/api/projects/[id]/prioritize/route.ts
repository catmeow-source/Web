import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { prioritizeTasks } from '@/lib/ai';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const project = await db.project.findUnique({
      where: { id },
      include: { tasks: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 444 });
    }

    if (project.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (project.tasks.length === 0) {
      return NextResponse.json({ error: 'No tasks to prioritize' }, { status: 400 });
    }

    // Call AI prioritizing helper
    const sortInput = project.tasks.map(t => ({
      id: t.id,
      name: t.name,
      deadline: t.deadline,
      objective: t.objective,
      lesson: t.lesson,
      status: t.status,
    }));

    const { sorted, reasonings } = await prioritizeTasks(sortInput);

    // Save the new priorities and reasons to the database
    // We can write updates sequentially or in a transactions
    const updatePromises = sorted.map((task, index) => {
      // Map index to priority value
      let priority = 'medium';
      if (index === 0) priority = 'high';
      else if (index === sorted.length - 1 && sorted.length > 2) priority = 'low';

      return db.task.update({
        where: { id: task.id },
        data: {
          priority,
          aiReason: reasonings[task.id] || 'Re-prioritized based on timeline.',
        },
      });
    });

    await db.$transaction(updatePromises);

    // Fetch and return the newly sorted tasks
    const updatedTasks = await db.task.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' }, // Or standard order, the client will display sorted by priority or list order
    });

    return NextResponse.json(updatedTasks);
  } catch (error) {
    console.error('Task prioritization error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
