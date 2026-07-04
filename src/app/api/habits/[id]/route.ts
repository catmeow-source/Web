import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  
  // Sort unique dates descending
  const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a));
  const datesSet = new Set(uniqueDates);
  
  // Helper to subtract days
  const subtractDays = (dateStr: string, days: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const getLocalDateStr = (offset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  const todayStr = getLocalDateStr(0);
  const yesterdayStr = getLocalDateStr(-1);

  let startSearchStr = '';
  if (datesSet.has(todayStr)) {
    startSearchStr = todayStr;
  } else if (datesSet.has(yesterdayStr)) {
    startSearchStr = yesterdayStr;
  } else {
    // Both today and yesterday were missed, streak reset to 0
    return 0;
  }

  let streak = 0;
  let currentSearch = startSearchStr;

  while (datesSet.has(currentSearch)) {
    streak++;
    currentSearch = subtractDays(currentSearch, 1);
  }

  return streak;
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

    const habit = await db.habit.findUnique({
      where: { id },
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 444 });
    }

    if (habit.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.objective !== undefined) updateData.objective = body.objective;
    if (body.result !== undefined) updateData.result = body.result;
    if (body.lesson !== undefined) updateData.lesson = body.lesson;
    if (body.compromise !== undefined) updateData.compromise = body.compromise;
    
    // Allow administrative overrides of streak if needed
    if (body.streak !== undefined) updateData.streak = body.streak;

    const updatedHabit = await db.habit.update({
      where: { id },
      data: updateData,
      include: { checkIns: true },
    });

    return NextResponse.json(updatedHabit);
  } catch (error) {
    console.error('PUT habit id error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST check-in habit (mark as completed or toggle)
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
    const { date } = await request.json(); // expected local format YYYY-MM-DD

    if (!date) {
      return NextResponse.json({ error: 'Date is required (YYYY-MM-DD)' }, { status: 400 });
    }

    const habit = await db.habit.findUnique({
      where: { id },
      include: { checkIns: true },
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 444 });
    }

    if (habit.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Normalize both sides to plain YYYY-MM-DD for reliable comparison
    // (SQLite may store dates as ISO timestamps like "2026-07-04T00:00:00.000Z")
    const normalizeDate = (d: string) => d.split('T')[0];
    const dateNorm = normalizeDate(date);

    // Toggle check-in: if already exists, delete it (uncheck), otherwise insert it
    const existingCheckIn = habit.checkIns.find(c => normalizeDate(c.date) === dateNorm);

    if (existingCheckIn) {
      // Uncheck
      await db.habitCheckIn.delete({
        where: { id: existingCheckIn.id },
      });
    } else {
      // Check in — store as plain YYYY-MM-DD to avoid future comparison issues
      await db.habitCheckIn.create({
        data: {
          habitId: id,
          date: dateNorm,
        },
      });
    }

    // Get all check-ins to compute new streak
    const checkIns = await db.habitCheckIn.findMany({
      where: { habitId: id },
      select: { date: true },
    });

    const dates = checkIns.map(c => c.date);
    const newStreak = calculateStreak(dates);
    
    // Update streak and lastCheckedIn in habit table
    const updatedHabit = await db.habit.update({
      where: { id },
      data: {
        streak: newStreak,
        lastCheckedIn: existingCheckIn ? undefined : new Date(), // Set checked in timestamp
      },
      include: { checkIns: true },
    });

    return NextResponse.json(updatedHabit);
  } catch (error) {
    console.error('POST habit check-in error:', error);
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

    const habit = await db.habit.findUnique({
      where: { id },
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 444 });
    }

    if (habit.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.habit.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Habit deleted' });
  } catch (error) {
    console.error('DELETE habit error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
