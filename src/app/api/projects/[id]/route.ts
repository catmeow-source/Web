import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { calculateProjectHealth } from '../../route';

export async function GET(
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
      include: {
        tasks: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 444 });
    }

    if (project.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const health = calculateProjectHealth(project);
    const enriched = {
      ...project,
      healthScore: health.score,
      healthDetails: health.summary,
    };

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('GET project id error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const project = await db.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 444 });
    }

    if (project.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.objective !== undefined) updateData.objective = body.objective;
    if (body.result !== undefined) updateData.result = body.result;
    if (body.lesson !== undefined) updateData.lesson = body.lesson;
    if (body.compromise !== undefined) updateData.compromise = body.compromise;

    const updatedProject = await db.project.update({
      where: { id },
      data: updateData,
      include: { tasks: true },
    });

    const health = calculateProjectHealth(updatedProject);
    const enriched = {
      ...updatedProject,
      healthScore: health.score,
      healthDetails: health.summary,
    };

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('PUT project id error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
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
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 444 });
    }

    if (project.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('DELETE project id error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
