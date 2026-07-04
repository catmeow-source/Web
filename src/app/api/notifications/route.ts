import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function syncNotifications(userId: string, reminderTimingDays: number) {
  const now = new Date();
  
  // Find all projects with deadlines
  const projects = await db.project.findMany({
    where: {
      userId,
      deadline: { not: null },
      status: { not: 'done' }, 
    },
  });

  const warningThresholdMs = reminderTimingDays * 24 * 60 * 60 * 1000;

  for (const project of projects) {
    if (!project.deadline) continue;
    const diff = project.deadline.getTime() - now.getTime();
    
    // Within threshold, and not overdue by more than 3 days
    if (diff <= warningThresholdMs && diff > -3 * 24 * 60 * 60 * 1000) {
      const existing = await db.notification.findFirst({
        where: {
          userId,
          type: 'deadline_project',
          refId: project.id,
        },
      });

      if (!existing) {
        await db.notification.create({
          data: {
            userId,
            type: 'deadline_project',
            refId: project.id,
            refType: 'project',
            dueDate: project.deadline,
            title: 'Project Deadline Alert',
            message: `The project "${project.name}" is due in less than ${reminderTimingDays} days (on ${project.deadline.toLocaleDateString()}).`,
          },
        });
      }
    }
  }

  // Find all tasks with deadlines
  const tasks = await db.task.findMany({
    where: {
      project: { userId },
      deadline: { not: null },
      status: { not: 'done' },
    },
    include: { project: true },
  });

  for (const task of tasks) {
    if (!task.deadline) continue;
    const diff = task.deadline.getTime() - now.getTime();
    
    if (diff <= warningThresholdMs && diff > -3 * 24 * 60 * 60 * 1000) {
      const existing = await db.notification.findFirst({
        where: {
          userId,
          type: 'deadline_task',
          refId: task.id,
        },
      });

      if (!existing) {
        await db.notification.create({
          data: {
            userId,
            type: 'deadline_task',
            refId: task.id,
            refType: 'task',
            dueDate: task.deadline,
            title: 'Task Deadline Alert',
            message: `The task "${task.name}" in project "${task.project.name}" is due in less than ${reminderTimingDays} days (on ${task.deadline.toLocaleDateString()}).`,
          },
        });
      }
    }

    // Stale Task Detector (AI 13)
    const untouchedDays = Math.floor((now.getTime() - task.createdAt.getTime()) / (24 * 60 * 60 * 1000));
    if (task.deadline && untouchedDays >= 7) {
      const diff = task.deadline.getTime() - now.getTime();
      // Untouched for 7+ days and deadline is within 4 days
      if (diff > 0 && diff <= 4 * 24 * 60 * 60 * 1000) {
        const existingStale = await db.notification.findFirst({
          where: {
            userId,
            type: 'stale_task',
            refId: task.id,
          },
        });

        if (!existingStale) {
          await db.notification.create({
            data: {
              userId,
              type: 'stale_task',
              refId: task.id,
              refType: 'task',
              dueDate: task.deadline,
              title: 'Stale Task Warning',
              message: `"${task.name}" hasn't been touched in ${untouchedDays} days. Deadline is in ${Math.ceil(diff / (24 * 60 * 60 * 1000))} days. It is now your most urgent task.`,
            },
          });
        }
      }
    }
  }

  // Find all scheduled tasks
  const scheduledTasks = await db.scheduledTask.findMany({
    where: { userId },
  });

  for (const st of scheduledTasks) {
    const [year, month, day] = st.date.split('-').map(Number);
    const [hours, minutes] = st.time.split(':').map(Number);
    const stDueDate = new Date(year, month - 1, day, hours, minutes);

    const diff = stDueDate.getTime() - now.getTime();
    const thirtyMinutesMs = 30 * 60 * 1000;

    // Warn if due within 30 minutes, and not past by more than 1 hour
    if (diff <= thirtyMinutesMs && diff > -1 * 60 * 60 * 1000) {
      const existing = await db.notification.findFirst({
        where: {
          userId,
          type: 'scheduled_reminder',
          refId: st.id,
        },
      });

      if (!existing) {
        await db.notification.create({
          data: {
            userId,
            type: 'scheduled_reminder',
            refId: st.id,
            refType: 'scheduled',
            dueDate: stDueDate,
            title: 'Scheduled Task Reminder',
            message: `The scheduled task "${st.name}" starts at ${st.time}.`,
          },
        });
      }
    }
  }
}

// GET all notifications (running sync first)
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sync reminders
    await syncNotifications(user.id, user.reminderTiming);

    // Retrieve notifications
    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('GET notifications error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST mark notifications read
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, id } = await request.json();

    if (action === 'mark-read') {
      if (id) {
        // Mark specific read
        await db.notification.updateMany({
          where: { id, userId: user.id },
          data: { read: true },
        });
      } else {
        // Mark all read
        await db.notification.updateMany({
          where: { userId: user.id },
          data: { read: true },
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST notifications error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
