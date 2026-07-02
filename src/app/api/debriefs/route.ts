import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { generateWeeklyDebrief } from '@/lib/ai';

export const dynamic = 'force-dynamic';

// Helper to get previous Sunday
function getPreviousSunday(): string {
  const d = new Date();
  const day = d.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const diff = d.getDate() - day; // Adjust to previous Sunday
  const sunday = new Date(d.setDate(diff));
  return sunday.toISOString().split('T')[0];
}

// GET all weekly debriefs for the user
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const debriefs = await db.weeklyDebrief.findMany({
      where: { userId: user.id },
      orderBy: { weekStart: 'desc' },
    });

    return NextResponse.json(debriefs);
  } catch (error) {
    console.error('GET debriefs error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST generate/regenerate weekly debrief for current week
export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weekStart = getPreviousSunday();

    // 1. Gather Tasks Completed (marked 'done' inside user's projects)
    const completedTasksCount = await db.task.count({
      where: {
        project: { userId: user.id },
        status: 'done',
      },
    });

    // 2. Gather Habits Kept (count total check-ins in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const habitsKeptCount = await db.habitCheckIn.count({
      where: {
        habit: { userId: user.id },
        date: { gte: sevenDaysAgoStr },
      },
    });

    // 3. Gather Deadlines Hit (projects/tasks due in last 7 days that are 'done')
    const deadlinesHitProjects = await db.project.count({
      where: {
        userId: user.id,
        deadline: {
          gte: sevenDaysAgo,
          lte: new Date(),
        },
        status: 'done',
      },
    });

    const deadlinesHitTasks = await db.task.count({
      where: {
        project: { userId: user.id },
        deadline: {
          gte: sevenDaysAgo,
          lte: new Date(),
        },
        status: 'done',
      },
    });

    const totalDeadlinesHit = deadlinesHitProjects + deadlinesHitTasks;

    // 4. Gather Deadlines Missed (projects/tasks due in last 7 days that are NOT 'done')
    const deadlinesMissedProjects = await db.project.count({
      where: {
        userId: user.id,
        deadline: {
          gte: sevenDaysAgo,
          lte: new Date(),
        },
        status: { not: 'done' },
      },
    });

    const deadlinesMissedTasks = await db.task.count({
      where: {
        project: { userId: user.id },
        deadline: {
          gte: sevenDaysAgo,
          lte: new Date(),
        },
        status: { not: 'done' },
      },
    });

    const totalDeadlinesMissed = deadlinesMissedProjects + deadlinesMissedTasks;

    // 5. Gather Lessons and Results text
    const projectsWithData = await db.project.findMany({
      where: { userId: user.id },
      select: { lesson: true, result: true },
    });

    const tasksWithData = await db.task.findMany({
      where: { project: { userId: user.id } },
      select: { lesson: true, result: true },
    });

    const habitsWithData = await db.habit.findMany({
      where: { userId: user.id },
      select: { lesson: true, result: true },
    });

    const lessons = [
      ...projectsWithData.map(p => p.lesson),
      ...tasksWithData.map(t => t.lesson),
      ...habitsWithData.map(h => h.lesson)
    ].filter(l => l && l.trim().length > 0);

    const results = [
      ...projectsWithData.map(p => p.result),
      ...tasksWithData.map(t => t.result),
      ...habitsWithData.map(h => h.result)
    ].filter(r => r && r.trim().length > 0);

    // Call AI helper to compile summary details
    const debriefInfo = await generateWeeklyDebrief({
      tasksCompleted: completedTasksCount,
      habitsKept: habitsKeptCount,
      deadlinesHit: totalDeadlinesHit,
      deadlinesMissed: totalDeadlinesMissed,
      lessons,
      results,
    });

    // Upsert debrief
    const debrief = await db.weeklyDebrief.upsert({
      where: {
        userId_weekStart: {
          userId: user.id,
          weekStart,
        },
      },
      update: {
        tasksCompleted: completedTasksCount,
        habitsKept: habitsKeptCount,
        deadlinesHit: totalDeadlinesHit,
        deadlinesMissed: totalDeadlinesMissed,
        topLesson: debriefInfo.topLesson,
        topResult: debriefInfo.topResult,
        summary: debriefInfo.summary,
        generatedAt: new Date(),
      },
      create: {
        userId: user.id,
        weekStart,
        tasksCompleted: completedTasksCount,
        habitsKept: habitsKeptCount,
        deadlinesHit: totalDeadlinesHit,
        deadlinesMissed: totalDeadlinesMissed,
        topLesson: debriefInfo.topLesson,
        topResult: debriefInfo.topResult,
        summary: debriefInfo.summary,
      },
    });

    return NextResponse.json(debrief);
  } catch (error) {
    console.error('POST generate debrief error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
