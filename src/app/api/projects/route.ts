import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export function calculateProjectHealth(project: any) {
  let score = 100;
  const reasons: string[] = [];

  const totalTasks = project.tasks?.length || 0;
  const doneTasks = project.tasks?.filter((t: any) => t.status === 'done').length || 0;
  const pendingTasks = project.tasks?.filter((t: any) => t.status !== 'done') || [];

  // 1. Task Completion Rate
  if (totalTasks > 0) {
    const completionRate = doneTasks / totalTasks;
    if (completionRate < 0.5) {
      score -= 20;
      reasons.push("Low task completion rate.");
    }
  }

  // 2. Overdue Tasks
  const now = new Date();
  const overdueTasksCount = pendingTasks.filter((t: any) => t.deadline && new Date(t.deadline) < now).length;
  if (overdueTasksCount > 0) {
    score -= overdueTasksCount * 10;
    reasons.push(`${overdueTasksCount} overdue task(s).`);
  }

  // 3. Compromises Count
  let compromiseCount = 0;
  if (project.compromise && project.compromise.trim().length > 0) compromiseCount += 1;
  project.tasks?.forEach((t: any) => {
    if (t.compromise && t.compromise.trim().length > 0) compromiseCount += 1;
  });
  if (compromiseCount > 0) {
    score -= compromiseCount * 5;
    reasons.push(`Compromises logged: ${compromiseCount}.`);
  }

  // 4. Repeated Lessons unaddressed
  const lessonsCount = (project.tasks?.filter((t: any) => t.lesson && t.lesson.trim().length > 0).length || 0) + (project.lesson && project.lesson.trim().length > 0 ? 1 : 0);
  if (compromiseCount > 2 && lessonsCount < 1) {
    score -= 15;
    reasons.push("High compromises without lessons.");
  }

  // 5. Deadline Proximity
  if (project.deadline && project.status !== 'done') {
    const deadlineDate = new Date(project.deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 0) {
      score -= 30;
      reasons.push("Deadline passed.");
    } else if (diffDays <= 3) {
      score -= 15;
      reasons.push("Deadline near.");
    }
  }

  score = Math.max(0, Math.min(100, score));

  let summary = `Health Score: ${score} — Stable. Keep up the good momentum!`;
  if (score < 40) {
    summary = `Health Score: ${score} — Critical warning: ${reasons.join(' ') || 'Immediate attention needed.'}`;
  } else if (score < 70) {
    summary = `Health Score: ${score} — Moderate alert: ${reasons.join(' ')}`;
  } else if (reasons.length > 0) {
    summary = `Health Score: ${score} — Healthy. Notes: ${reasons.join(' ')}`;
  }

  return {
    score,
    summary,
  };
}

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

    // Attach health score to projects
    const enrichedProjects = projects.map(p => {
      const health = calculateProjectHealth(p);
      return {
        ...p,
        healthScore: health.score,
        healthDetails: health.summary,
      };
    });

    return NextResponse.json(enrichedProjects);
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

    const health = calculateProjectHealth(project);
    const enriched = {
      ...project,
      healthScore: health.score,
      healthDetails: health.summary,
    };

    return NextResponse.json(enriched, { status: 201 });
  } catch (error) {
    console.error('POST projects error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
