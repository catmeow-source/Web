import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { generateMonthlyReport } from '@/lib/ai';

export const dynamic = 'force-dynamic';

function getCurrentMonth(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reports = await db.monthlyReport.findMany({
      where: { userId: user.id },
      orderBy: { monthStart: 'desc' },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('GET reports error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const monthStart = getCurrentMonth();

    // 1. Gather monthly stats (completed in the current month)
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const tasksCompleted = await db.task.count({
      where: {
        project: { userId: user.id },
        status: 'done',
        createdAt: { gte: firstOfMonth },
      },
    });

    const habitsKept = await db.habitCheckIn.count({
      where: {
        habit: { userId: user.id },
        date: { gte: monthStart + '-01' },
      },
    });

    const deadlinesHitProjects = await db.project.count({
      where: {
        userId: user.id,
        deadline: { gte: firstOfMonth, lte: now },
        status: 'done',
      },
    });

    const deadlinesHitTasks = await db.task.count({
      where: {
        project: { userId: user.id },
        deadline: { gte: firstOfMonth, lte: now },
        status: 'done',
      },
    });

    const deadlinesHit = deadlinesHitProjects + deadlinesHitTasks;

    const deadlinesMissedProjects = await db.project.count({
      where: {
        userId: user.id,
        deadline: { gte: firstOfMonth, lte: now },
        status: { not: 'done' },
      },
    });

    const deadlinesMissedTasks = await db.task.count({
      where: {
        project: { userId: user.id },
        deadline: { gte: firstOfMonth, lte: now },
        status: { not: 'done' },
      },
    });

    const deadlinesMissed = deadlinesMissedProjects + deadlinesMissedTasks;

    // Gather lessons & compromises
    const projectsWithData = await db.project.findMany({
      where: { userId: user.id, createdAt: { gte: firstOfMonth } },
      select: { lesson: true, compromise: true },
    });

    const tasksWithData = await db.task.findMany({
      where: { project: { userId: user.id }, createdAt: { gte: firstOfMonth } },
      select: { lesson: true, compromise: true },
    });

    const habitsWithData = await db.habit.findMany({
      where: { userId: user.id },
      select: { lesson: true, compromise: true },
    });

    const lessons = [
      ...projectsWithData.map(p => p.lesson),
      ...tasksWithData.map(t => t.lesson),
      ...habitsWithData.map(h => h.lesson)
    ].filter(l => l && l.trim().length > 0);

    const compromises = [
      ...projectsWithData.map(p => p.compromise),
      ...tasksWithData.map(t => t.compromise),
      ...habitsWithData.map(h => h.compromise)
    ].filter(c => c && c.trim().length > 0);

    // Call AI monthly report generator
    const reportData = await generateMonthlyReport({
      monthStart,
      tasksCompleted,
      habitsKept,
      deadlinesHit,
      deadlinesMissed,
      lessons,
      compromises,
    });

    // Upsert Monthly Report
    const report = await db.monthlyReport.upsert({
      where: {
        userId_monthStart: {
          userId: user.id,
          monthStart,
        },
      },
      update: {
        summary: reportData.summary,
        trends: reportData.trends,
        generatedAt: new Date(),
      },
      create: {
        userId: user.id,
        monthStart,
        summary: reportData.summary,
        trends: reportData.trends,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('POST monthly report error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
