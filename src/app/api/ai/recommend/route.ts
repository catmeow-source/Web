import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getTopActions } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Gather all tasks in progress or todo
    const tasks = await db.task.findMany({
      where: {
        project: { userId: user.id },
        status: { not: 'done' },
      },
      include: { project: true },
      take: 10,
    });

    // 2. Gather habits
    const habits = await db.habit.findMany({
      where: { userId: user.id },
      take: 5,
    });

    // 3. Gather scheduled tasks
    const scheduled = await db.scheduledTask.findMany({
      where: { userId: user.id },
      take: 5,
    });

    // Compile into items array for AI
    const items = [
      ...tasks.map(t => ({
        name: t.name,
        type: 'Task',
        details: `Project: ${t.project.name}. Priority: ${t.priority}. Objective: ${t.objective}`,
        deadline: t.deadline || undefined,
      })),
      ...habits.map(h => ({
        name: h.name,
        type: 'Habit',
        details: `Current Streak: ${h.streak} days. Last checked: ${h.lastCheckedIn ? h.lastCheckedIn.toLocaleDateString() : 'Never'}. Objective: ${h.objective}`,
      })),
      ...scheduled.map(s => ({
        name: s.name,
        type: 'Scheduled Task',
        details: `Due: ${s.date} at ${s.time}. Objective: ${s.objective}`,
      })),
    ];

    if (items.length === 0) {
      return NextResponse.json({
        topActions: [
          { name: "Create your first project", estimate: "5 mins", reason: "Get started by planning your primary project objective." },
          { name: "Establish a daily habit", estimate: "5 mins", reason: "Consistency starts with baby steps. Set up a daily routine." },
          { name: "Schedule a task", estimate: "3 mins", reason: "Lock in a calendar item for today." }
        ],
        singleBestAction: {
          name: "Add a project or habit",
          estimate: "5 mins",
          reason: "You have no active projects or habits in your dashboard right now. Adding one helps you structure your workflow.",
          explanation: "Defining clear objectives and tracing compromises from day one will maximize your personal productivity and retrospective benefits."
        }
      });
    }

    const topActions = await getTopActions(items);

    // Dynamic compilation of the single best action
    const singleBestAction = {
      name: topActions[0]?.name || "Focus on your daily coding habit",
      estimate: topActions[0]?.estimate || "30 mins",
      reason: topActions[0]?.reason || "Keep your streak alive today.",
      explanation: "This action blocks downstream items or represents a daily streak at risk. Completing this will keep your momentum high and clear your calendar clutter."
    };

    return NextResponse.json({
      topActions,
      singleBestAction,
    });
  } catch (error) {
    console.error('GET recommendations error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
