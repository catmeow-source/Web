import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all projects for current user
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await db.project.findMany({
      where: { userId: user.id },
      include: {
        tasks: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('GET projects error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create project
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, status, deadline, objective, result, lesson, compromise } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const parsedDeadline = deadline ? new Date(deadline) : null;

    const project = await db.project.create({
      data: {
        name,
        status: status || 'planning',
        deadline: parsedDeadline,
        objective: objective || '',
        result: result || '',
        lesson: lesson || '',
        compromise: compromise || '',
        userId: user.id,
      },
      include: {
        tasks: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('POST projects error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
