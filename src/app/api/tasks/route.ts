import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// POST create task
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, name, status, deadline, priority, objective, result, lesson, compromise } = await request.json();

    if (!projectId || !name) {
      return NextResponse.json({ error: 'Project ID and task name are required' }, { status: 400 });
    }

    // Verify parent project belongs to user
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 444 });
    }

    if (project.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parsedDeadline = deadline ? new Date(deadline) : null;

    const task = await db.task.create({
      data: {
        projectId,
        name,
        status: status || 'todo',
        deadline: parsedDeadline,
        priority: priority || 'medium',
        objective: objective || '',
        result: result || '',
        lesson: lesson || '',
        compromise: compromise || '',
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('POST tasks error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
