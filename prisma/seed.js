const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await db.session.deleteMany({});
  await db.weeklyDebrief.deleteMany({});
  await db.notification.deleteMany({});
  await db.scheduledTask.deleteMany({});
  await db.habitCheckIn.deleteMany({});
  await db.habit.deleteMany({});
  await db.task.deleteMany({});
  await db.project.deleteMany({});
  await db.user.deleteMany({});

  // Create default test user
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await db.user.create({
    data: {
      name: 'John Doe',
      email: 'test@taskflow.com',
      passwordHash,
      theme: 'dark',
      reminderTiming: 2,
    },
  });

  console.log(`Created test user: ${user.email}`);

  // Create Projects
  const project1 = await db.project.create({
    data: {
      name: 'Launch Taskflow MVP',
      status: 'in progress',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      objective: 'Build a working version of Taskflow with AI and reflections',
      result: 'Main layouts and database schemas configured.',
      lesson: 'Setting up Prisma early saves database modeling headaches.',
      compromise: 'Deferred native mobile push notification service; using client service worker instead.',
      userId: user.id,
    },
  });

  const project2 = await db.project.create({
    data: {
      name: 'Health & Vitality 2026',
      status: 'planning',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      objective: 'Establish stable workout routines and diet tracking',
      result: '',
      lesson: '',
      compromise: '',
      userId: user.id,
    },
  });

  console.log('Created sample projects.');

  // Create Tasks for Project 1
  await db.task.createMany({
    data: [
      {
        projectId: project1.id,
        name: 'Design Database Schemas',
        status: 'done',
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday
        priority: 'high',
        aiReason: 'Core foundation. Blocks all UI development.',
        objective: 'Map out relationships between users, tasks, habits, and debriefs.',
        result: 'Prisma schema created and SQLite db push successful.',
        lesson: 'SQLite is great for rapid local prototyping.',
        compromise: 'Decided not to deploy to AWS RDS yet to save setup time.',
      },
      {
        projectId: project1.id,
        name: 'Implement Cookie Authentication',
        status: 'in progress',
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
        priority: 'high',
        aiReason: 'Prerequisite for saving individual user profiles and tasks.',
        objective: 'Secure registration, login, and dashboard page protection.',
        result: '',
        lesson: '',
        compromise: '',
      },
      {
        projectId: project1.id,
        name: 'Integrate AI Task Prioritizer',
        status: 'todo',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        priority: 'medium',
        aiReason: 'Key product differentiator. Enhances project planning.',
        objective: 'Use LLM feedback to reorder tasks based on deadlines and objectives.',
        result: '',
        lesson: '',
        compromise: '',
      },
    ],
  });

  // Create Tasks for Project 2
  await db.task.createMany({
    data: [
      {
        projectId: project2.id,
        name: 'Research gym memberships',
        status: 'todo',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priority: 'low',
        aiReason: 'Not time-sensitive, but helpful first step.',
        objective: 'Find a well-equipped gym within 15 mins driving distance.',
        result: '',
        lesson: '',
        compromise: '',
      },
    ],
  });

  console.log('Created sample tasks.');

  // Create Habits
  const habit1 = await db.habit.create({
    data: {
      name: 'Write Code Daily',
      streak: 3,
      lastCheckedIn: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      objective: 'Maintain active momentum on developer projects',
      result: 'Coded consistently for 3 days straight.',
      lesson: 'Visual streaks build powerful positive feedback loops.',
      compromise: 'Sometimes coding late at night impacts sleep quality.',
      userId: user.id,
    },
  });

  const habit2 = await db.habit.create({
    data: {
      name: 'Daily Meditation (10m)',
      streak: 0,
      lastCheckedIn: null,
      objective: 'Reduce cognitive load and improve focus',
      result: '',
      lesson: '',
      compromise: '',
      userId: user.id,
    },
  });

  // Create Habit CheckIns
  const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dayBeforeStr = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const threeDaysAgoStr = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  await db.habitCheckIn.createMany({
    data: [
      { habitId: habit1.id, date: yesterdayStr },
      { habitId: habit1.id, date: dayBeforeStr },
      { habitId: habit1.id, date: threeDaysAgoStr },
    ],
  });

  console.log('Created sample habits & check-ins.');

  // Create Scheduled Tasks
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  await db.scheduledTask.create({
    data: {
      name: 'Doctor Appointment',
      date: todayStr,
      time: '14:30',
      objective: 'Annual physical health checkup.',
      result: 'Checked blood pressure and scheduled blood tests.',
      lesson: 'Preventative checkups avoid future emergencies.',
      compromise: 'Had to move a client meeting to accommodate.',
      userId: user.id,
    },
  });

  await db.scheduledTask.create({
    data: {
      name: 'Weekly Car Wash',
      date: tomorrowStr,
      time: '09:00',
      objective: 'Keep vehicle clean and protected.',
      result: '',
      lesson: '',
      compromise: '',
      userId: user.id,
    },
  });

  console.log('Created scheduled tasks.');

  // Create dummy debrief
  const prevSunday = new Date();
  prevSunday.setDate(prevSunday.getDate() - (prevSunday.getDay() || 7)); // last Sunday
  const prevSundayStr = prevSunday.toISOString().split('T')[0];

  await db.weeklyDebrief.create({
    data: {
      weekStart: prevSundayStr,
      tasksCompleted: 4,
      habitsKept: 2,
      deadlinesHit: 3,
      deadlinesMissed: 1,
      topLesson: 'Planning the exact hours of tasks prevents overflow.',
      topResult: 'Completed database sync for Taskflow ahead of schedule.',
      summary: 'A very successful week focused on building the core structural foundation. Habits remained stable, and the project plan is moving quickly.',
      userId: user.id,
    },
  });

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
