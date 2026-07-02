import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

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

    const task = await db.scheduledTask.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Scheduled task not found' }, { status: 444 });
    }

    if (task.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.time !== undefined) updateData.time = body.time;
    if (body.objective !== undefined) updateData.objective = body.objective;
    if (body.result !== undefined) updateData.result = body.result;
    if (body.lesson !== undefined) updateData.lesson = body.lesson;
    if (body.compromise !== undefined) updateData.compromise = body.compromise;

    const updatedTask = await db.scheduledTask.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('PUT scheduled task id error:', error);
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

    const task = await db.scheduledTask.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Scheduled task not found' }, { status: 444 });
    }

    if (task.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.scheduledTask.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Scheduled task deleted' });
  } catch (error) {
    console.error('DELETE scheduled task id error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
