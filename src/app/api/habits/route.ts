import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all habits for current user
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const habits = await db.habit.findMany({
      where: { userId: user.id },
      include: {
        checkIns: {
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(habits);
  } catch (error) {
    console.error('GET habits error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create habit
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, objective, result, lesson, compromise } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Habit name is required' }, { status: 400 });
    }

    const habit = await db.habit.create({
      data: {
        name,
        objective: objective || '',
        result: result || '',
        lesson: lesson || '',
        compromise: compromise || '',
        userId: user.id,
      },
      include: {
        checkIns: true,
      },
    });

    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    console.error('POST habits error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
