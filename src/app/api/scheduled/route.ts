import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all scheduled tasks for current user
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tasks = await db.scheduledTask.findMany({
      where: { userId: user.id },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('GET scheduled tasks error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create scheduled task
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, date, time, objective, result, lesson, compromise } = await request.json();

    if (!name || !date || !time) {
      return NextResponse.json({ error: 'Name, date (YYYY-MM-DD), and time (HH:MM) are required' }, { status: 400 });
    }

    const task = await db.scheduledTask.create({
      data: {
        name,
        date,
        time,
        objective: objective || '',
        result: result || '',
        lesson: lesson || '',
        compromise: compromise || '',
        userId: user.id,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('POST scheduled task error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
