// Dual-mode AI Engine for Taskflow — powered by Google Gemini 2.0 Flash

import { GoogleGenAI } from '@google/genai';

interface SortTaskInput {
  id: string;
  name: string;
  deadline: Date | null;
  objective: string;
  lesson: string;
  status: string;
  priority?: string;
}

interface DebriefMetrics {
  tasksCompleted: number;
  habitsKept: number;
  deadlinesHit: number;
  deadlinesMissed: number;
  lessons: string[];
  results: string[];
}

// Core Gemini caller — falls back to simulator if no key or call fails
export async function callAI(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 1500,
          temperature: 0.4,
        },
      });

      const text = response.text;
      if (text) return text;
      console.warn('Gemini returned empty response, falling back to simulator.');
    } catch (err) {
      console.error('Error calling Gemini API, falling back to simulator:', err);
    }
  }

  // Fallback simulator if key is missing or calls fail
  return simulateAI(prompt, systemPrompt);
}

// AI Simulator (used when no API key is set)
function simulateAI(prompt: string, _systemPrompt: string): string {
  const normalized = prompt.toLowerCase();

  // 1. Task Prioritizer
  if (normalized.includes('prioritize') || normalized.includes('sort tasks')) {
    return JSON.stringify({ sortedTaskIds: [], reasonings: {} });
  }

  // 2. Today's top actions
  if (normalized.includes('what to do right now') || normalized.includes('top 3 actions')) {
    return JSON.stringify({
      actions: [
        { name: 'Finalize high-priority project deliverables', estimate: '45 mins', reason: 'Due soonest and blocks project completion.' },
        { name: 'Complete habit streak', estimate: '15 mins', reason: 'Consistency builds momentum.' },
        { name: 'Review weekly scheduled checklist', estimate: '20 mins', reason: 'Prepare for upcoming calendar deadlines.' },
      ],
    });
  }

  // 3. Compromise Detector
  if (normalized.includes('compromise detector') || normalized.includes('compromise field')) {
    return 'No recurring pattern detected yet. Keep logging compromises to unlock comparative insights.';
  }

  // 4. Weekly Debrief Generator
  if (normalized.includes('weekly debrief') || normalized.includes('debrief metrics')) {
    return JSON.stringify({
      topLesson: 'Consistent daily execution is the key to managing project deadline congestion.',
      topResult: 'Successfully launched project milestones and maintained code streaks.',
      summary: 'An active and structured week. While habit tracking was stable, project congestion remains high. Consider spacing out task deadlines next week to avoid burnouts.',
    });
  }

  // 5. Lesson Pattern Spotter
  if (normalized.includes('lesson pattern') || normalized.includes('spot lessons')) {
    return JSON.stringify([
      'Incremental progress prevents blockers.',
      'Drafting database architecture saves front-end setup delays.',
      'Scheduling habit timings improves check-in consistency.',
    ]);
  }

  // 6. Habit Coach
  if (normalized.includes('habit coach') || normalized.includes('habit feedback')) {
    return 'Streaks drop when deadlines are high. Try scheduling workouts in the morning to protect them.';
  }

  // 9. Smart Task Breakdown
  if (normalized.includes('breakdown') || normalized.includes('suggest tasks')) {
    return JSON.stringify([
      { name: 'Draft technical design document', estimate: '3 hours' },
      { name: 'Configure database schema & Prisma migrations', estimate: '2 hours' },
      { name: 'Implement core backend API endpoints', estimate: '4 hours' },
      { name: 'Build frontend dashboard layout components', estimate: '5 hours' },
      { name: 'Write unit tests for authentication logic', estimate: '2 hours' },
    ]);
  }

  // 10. Objective Clarity Checker
  if (normalized.includes('clarity checker') || normalized.includes('objective check')) {
    return "Objective is clear, but could be sharper. Try adding a measurable metric (e.g. 'implement in 3 days').";
  }

  // 11. Result vs Objective Gap Analyser
  if (normalized.includes('gap analyser') || normalized.includes('result vs objective')) {
    return 'Complete match. However, note that 2 sub-tasks were completed late. Watch out for time-scoping blockers.';
  }

  // 12. Focus Block Suggester
  if (normalized.includes('focus block') || normalized.includes('suggest focus blocks')) {
    return JSON.stringify([
      { time: '09:00 - 11:30 AM', task: 'Deep Work: Core implementation and coding tasks', type: 'deep', duration: '2.5 hrs' },
      { time: '01:00 - 01:30 PM', task: 'Lunch break & short walk', type: 'break', duration: '30 min' },
      { time: '02:00 - 03:00 PM', task: 'Review scheduled checklist & reply to notifications', type: 'review', duration: '1 hr' },
      { time: '04:30 - 05:00 PM', task: 'Habits execution & daily reflection wrap-up', type: 'habits', duration: '30 min' },
    ]);
  }

  // 14. Mood-Aware Reprioritiser
  if (normalized.includes('mood') || normalized.includes('energy level')) {
    return JSON.stringify({ sortedTaskIds: [] });
  }

  // 16. Monthly Productivity Report
  if (normalized.includes('monthly productivity') || normalized.includes('monthly report')) {
    return JSON.stringify({
      summary: 'You completed 85% of planned tasks this month. Longest streak was 12 days. Project compromises were centered around test coverage.',
      trends: 'Design velocity remains twice as fast as backend coding. Repeated lessons suggest that database setup blockades frontend work.',
    });
  }

  return 'AI Engine completed simulated response successfully.';
}

// 1. On-Demand: Sort Tasks Inside a Project
export async function prioritizeTasks(tasks: SortTaskInput[]): Promise<{ sorted: SortTaskInput[]; reasonings: Record<string, string> }> {
  const sorted = [...tasks].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    if (a.deadline && b.deadline) return a.deadline.getTime() - b.deadline.getTime();
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const systemPrompt =
      "You are an expert AI productivity coach. Prioritize the following list of tasks in a JSON format. Return a JSON object with 'sortedTaskIds' (array of IDs in priority order) and 'reasonings' (an object mapping task IDs to a single-sentence reasoning string under 15 words). Consider deadlines, objectives, and dependencies.";
    const prompt = `Project Tasks:\n${tasks.map(t => `- [ID: ${t.id}] "${t.name}" (Status: ${t.status}, Deadline: ${t.deadline?.toLocaleDateString() || 'None'}, Objective: ${t.objective}, Past Lesson: ${t.lesson})`).join('\n')}`;

    try {
      const res = await callAI(prompt, systemPrompt);
      const cleanJsonStr = res.substring(res.indexOf('{'), res.lastIndexOf('}') + 1);
      const parsed = JSON.parse(cleanJsonStr);
      if (parsed.sortedTaskIds && parsed.reasonings) {
        const sortedIds = parsed.sortedTaskIds as string[];
        const reasonings = parsed.reasonings as Record<string, string>;
        const resultTasks = [...tasks].sort((a, b) => sortedIds.indexOf(a.id) - sortedIds.indexOf(b.id));
        return { sorted: resultTasks, reasonings };
      }
    } catch (e) {
      console.warn('Failed parsing AI prioritization response, using fallback:', e);
    }
  }

  const reasonings: Record<string, string> = {};
  sorted.forEach(t => {
    if (t.status === 'done') {
      reasonings[t.id] = 'Task completed. No action needed.';
    } else if (t.deadline && t.deadline.getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000) {
      reasonings[t.id] = 'Due soon. Crucial path item.';
    } else if (t.objective.toLowerCase().includes('core') || t.objective.toLowerCase().includes('database')) {
      reasonings[t.id] = 'Foundation element. High priority.';
    } else {
      reasonings[t.id] = 'Standard item. Follow sequential execution.';
    }
  });

  return { sorted, reasonings };
}

// 2. On-Demand: What to do right now (Top 3 Actions + Time Estimate)
export async function getTopActions(items: { name: string; type: string; details: string; deadline?: Date }[]) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    const systemPrompt =
      "You are an AI life coach. Look at the list of projects, habits, and tasks. Select the top 3 actions the user should do today. Return as JSON array of objects, each containing: 'name' (the action), 'estimate' (duration e.g. '30 mins'), and 'reason' (why it is high priority). Keep reasoning under 15 words.";
    const prompt = `Items for review:\n${items.map(i => `- [${i.type}] "${i.name}" (${i.details}, Deadline: ${i.deadline?.toLocaleDateString() || 'None'})`).join('\n')}`;

    try {
      const res = await callAI(prompt, systemPrompt);
      const cleanJsonStr = res.substring(res.indexOf('['), res.lastIndexOf(']') + 1);
      return JSON.parse(cleanJsonStr);
    } catch (e) {
      console.warn('Failed parsing AI top actions, using fallback:', e);
    }
  }

  return [
    { name: 'Prioritize pending task reflections', estimate: '15 mins', reason: 'Reflections fuel the weekly learning metrics.' },
    { name: 'Complete streak-critical habits', estimate: '20 mins', reason: 'Streaks are fragile. Keep momentum active.' },
    { name: 'Review closest project deadlines', estimate: '40 mins', reason: 'Prevent task build-up in calendar.' },
  ];
}

// 3. Auto: Suggest Deadline (density warning)
export async function getDeadlineSuggestion(targetWeekDeadlinesCount: number, _chosenDateStr: string): Promise<string | null> {
  if (targetWeekDeadlinesCount >= 3) {
    return `You have ${targetWeekDeadlinesCount} deadlines that week — consider spacing it out.`;
  }
  return null;
}

// 4. Auto: Compromise Detector
export async function detectCompromisePattern(compromiseInput: string, pastCompromises: string[]): Promise<string | null> {
  const cleanInput = compromiseInput.trim().toLowerCase();
  if (cleanInput.length < 3) return null;

  const matches = pastCompromises.filter(c => {
    const cleanPast = c.trim().toLowerCase();
    const inputWords = cleanInput.split(/\s+/).filter(w => w.length > 3);
    return inputWords.some(w => cleanPast.includes(w));
  });

  if (matches.length >= 2) {
    return `Recurring compromise pattern flagged: you've noted similar compromises ${matches.length} times recently.`;
  }

  return null;
}

// 5. Periodic: Lesson Pattern Spotter
export async function spotWeeklyLessonPatterns(lessons: string[]): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && lessons.length > 0) {
    try {
      const systemPrompt =
        "You are an AI growth advisor. Spot 2-3 recurring lessons/patterns from the user's weekly reflections. Return them as a JSON string array of short key takeaways (max 12 words per lesson).";
      const prompt = `Lessons logged:\n${lessons.map(l => `- ${l}`).join('\n')}`;
      const res = await callAI(prompt, systemPrompt);
      const cleanJsonStr = res.substring(res.indexOf('['), res.lastIndexOf(']') + 1);
      return JSON.parse(cleanJsonStr);
    } catch (e) {
      console.warn('Failed parsing lesson patterns, using fallback:', e);
    }
  }

  return [
    'Incremental progress prevents blockers.',
    'Drafting database architecture saves front-end setup delays.',
    'Scheduling habit timings improves check-in consistency.',
  ];
}

// 6. Periodic: Habit Coach
export async function generateHabitCoachFeedback(habits: { name: string; streak: number }[], deadlinesCount: number): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const systemPrompt =
        "You are an AI habit coach. Analyze the user's habits, streaks, and current weekly deadline density. Provide a single constructive advice statement (under 30 words) explaining how deadline stress might impact their streaks.";
      const prompt = `Habits:\n${habits.map(h => `- ${h.name} (Streak: ${h.streak})`).join('\n')}\nDeadlines this week: ${deadlinesCount}`;
      return await callAI(prompt, systemPrompt);
    } catch (e) {
      console.warn('Failed calling Habit Coach, using fallback:', e);
    }
  }

  return `Habit streaks tend to decline when deadlines rise. You have ${deadlinesCount} deadlines this week. Protect your habits by scheduling them early in the morning.`;
}

// 7. Periodic: Weekly Debrief Generator
export async function generateWeeklyDebrief(metrics: DebriefMetrics): Promise<{ topLesson: string; topResult: string; summary: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    const systemPrompt =
      "You are a personal growth advisor. Synthesize the weekly task metrics and reflections into a debrief. Return JSON with 'topLesson' (under 15 words), 'topResult' (under 15 words), and 'summary' (under 50 words).";
    const prompt = `Metrics:\nTasks Completed: ${metrics.tasksCompleted}\nHabits Kept: ${metrics.habitsKept}\nDeadlines Hit: ${metrics.deadlinesHit}\nDeadlines Missed: ${metrics.deadlinesMissed}\nLessons learned this week:\n${metrics.lessons.map(l => `- ${l}`).join('\n')}\nResults recorded:\n${metrics.results.map(r => `- ${r}`).join('\n')}`;

    try {
      const res = await callAI(prompt, systemPrompt);
      const cleanJsonStr = res.substring(res.indexOf('{'), res.lastIndexOf('}') + 1);
      return JSON.parse(cleanJsonStr);
    } catch (e) {
      console.warn('Failed parsing debrief, using fallback:', e);
    }
  }

  const hasMissed = metrics.deadlinesMissed > 0;
  const topLesson = metrics.lessons.length > 0 ? metrics.lessons[0] : 'Planning task spacing reduces last-minute deadline stress.';
  const topResult = metrics.results.length > 0 ? metrics.results[0] : 'Completed critical database architecture and core features.';
  let summary = `An active week with ${metrics.tasksCompleted} tasks completed and ${metrics.habitsKept} habits logged. `;
  summary += hasMissed
    ? `You missed ${metrics.deadlinesMissed} deadlines. Consider prioritizing these first in the upcoming cycle.`
    : `Perfect score on deadlines! Maintain this high-performance layout in the next week.`;

  return { topLesson, topResult, summary };
}

// 9. On-Demand: Smart Task Breakdown
export async function getSmartTaskBreakdown(objective: string): Promise<{ name: string; estimate: string }[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const systemPrompt =
        "You are an AI productivity planner. Generate a list of 4-6 recommended actionable tasks to achieve the user's objective. Return a JSON array of objects, each with 'name' (task description) and 'estimate' (estimated duration, e.g. '2 hours', '1 day').";
      const prompt = `Project Objective: "${objective}"`;
      const res = await callAI(prompt, systemPrompt);
      const cleanJsonStr = res.substring(res.indexOf('['), res.lastIndexOf(']') + 1);
      return JSON.parse(cleanJsonStr);
    } catch (e) {
      console.warn('Failed calling Smart Task Breakdown, using fallback:', e);
    }
  }

  return [
    { name: 'Draft specifications and wireframes', estimate: '4 hours' },
    { name: 'Configure database schema & Prisma setup', estimate: '2 hours' },
    { name: 'Implement core backend API endpoints', estimate: '4 hours' },
    { name: 'Build responsive layout components', estimate: '1 day' },
    { name: 'Write integration tests and verify', estimate: '3 hours' },
  ];
}

// 10. Auto: Objective Clarity Checker
export async function checkObjectiveClarity(objective: string): Promise<string | null> {
  if (objective.trim().split(/\s+/).length < 3) return 'Objective is too short. Try to define what success looks like.';

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const systemPrompt =
        "You are a writing editor. Analyze if the user's objective is specific, measurable, and action-oriented. If it is clear, return nothing. If it is vague, return a constructive tip (under 18 words) on how to sharpen it. Examples: 'Vague. Try: Reduce auth errors by 50%.'";
      const prompt = `Objective text: "${objective}"`;
      const res = await callAI(prompt, systemPrompt);
      const trimmed = res.trim();
      return trimmed.length > 5 && !trimmed.toLowerCase().includes('clear') ? trimmed : null;
    } catch (e) {
      console.warn('Failed calling clarity checker, using fallback:', e);
    }
  }

  const lowRef = objective.toLowerCase();
  if (lowRef.includes('build') || lowRef.includes('implement') || lowRef.includes('complete') || lowRef.includes('learn')) {
    if (!lowRef.match(/\b(days?|hours?|by|\d+|MVP|release)\b/)) {
      return 'Try specifying a deadline or specific target outcome to make this objective measurable.';
    }
  }
  return null;
}

// 11. Auto: Result vs Objective Gap Analyser
export async function checkResultObjectiveGap(objective: string, result: string): Promise<string | null> {
  if (!result || result.trim().length === 0) return null;

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const systemPrompt =
        "You are an AI retro specialist. Compare the user's result against their original objective. Generate a single gap analysis reflection under 15 words explaining why they hit or missed the goal.";
      const prompt = `Objective: "${objective}"\nResult: "${result}"`;
      return await callAI(prompt, systemPrompt);
    } catch (e) {
      console.warn('Failed gap analyzer, using fallback:', e);
    }
  }

  if (result.toLowerCase().includes('delay') || result.toLowerCase().includes('missed') || result.toLowerCase().includes('deferred')) {
    return 'Check lesson reflections — did scheduling bottlenecks or scope creep cause the delay?';
  }
  return 'Successful alignment. Good estimation layout and scoping control.';
}

// 12. On-Demand: Focus Block Suggester
export async function getFocusBlocks(
  tasks: { name: string; priority: string }[],
  scheduled: { name: string; time: string }[]
): Promise<{ time: string; task: string; type?: string; duration?: string; note?: string }[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const systemPrompt =
        "You are an AI schedule planner. Synthesize a 4-block structured layout for today based on high-priority tasks and scheduled items. Return a JSON array of objects, each containing: 'time' (e.g. '09:00 - 11:30 AM'), 'task' (focus description), 'type' (one of: deep, review, break, habits), and 'duration' (e.g. '2.5 hrs').";
      const prompt = `Tasks:\n${tasks.map(t => `- ${t.name} (${t.priority} priority)`).join('\n')}\nScheduled items:\n${scheduled.map(s => `- ${s.name} at ${s.time}`).join('\n')}`;
      const res = await callAI(prompt, systemPrompt);
      const cleanJsonStr = res.substring(res.indexOf('['), res.lastIndexOf(']') + 1);
      return JSON.parse(cleanJsonStr);
    } catch (e) {
      console.warn('Failed focus blocks, using fallback:', e);
    }
  }

  return [
    { time: '09:00 - 11:30 AM', task: 'Deep Work: Core implementation and coding tasks', type: 'deep', duration: '2.5 hrs' },
    { time: '01:00 - 01:30 PM', task: 'Lunch break & short walk', type: 'break', duration: '30 min' },
    { time: '02:00 - 03:00 PM', task: 'Review scheduled checklist & notifications', type: 'review', duration: '1 hr' },
    { time: '04:30 - 05:00 PM', task: 'Habits check-in & daily reflection wrap-up', type: 'habits', duration: '30 min' },
  ];
}

// 14. On-Demand: Mood-Aware Reprioritiser
export async function getMoodPrioritizedTaskIds(
  tasks: { id: string; name: string; priority: string; objective: string }[],
  mood: string
): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const systemPrompt =
        "You are an AI life coach. Prioritize tasks based on user's current energy level/mood: 'high', 'medium', 'low', 'creative', 'analytical'. Return a JSON object with 'sortedTaskIds' containing ordered IDs. High energy puts hardest tasks first. Low energy puts reviews, habit logs, easy wins first.";
      const prompt = `Energy Level: "${mood}"\nTasks:\n${tasks.map(t => `- [ID: ${t.id}] "${t.name}" (Priority: ${t.priority}, Objective: ${t.objective})`).join('\n')}`;
      const res = await callAI(prompt, systemPrompt);
      const cleanJsonStr = res.substring(res.indexOf('{'), res.lastIndexOf('}') + 1);
      const parsed = JSON.parse(cleanJsonStr);
      if (parsed.sortedTaskIds) return parsed.sortedTaskIds;
    } catch (e) {
      console.warn('Failed mood reprioritization, using fallback:', e);
    }
  }

  const copy = [...tasks];
  if (mood === 'low') {
    copy.sort((a, b) => {
      const aEasy = a.name.toLowerCase().match(/(review|check|reflect|log|fill|write comment)/) ? -1 : 1;
      const bEasy = b.name.toLowerCase().match(/(review|check|reflect|log|fill|write comment)/) ? -1 : 1;
      return aEasy - bEasy;
    });
  } else if (mood === 'high' || mood === 'analytical') {
    copy.sort((a, b) => {
      const aVal = a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : 2;
      const bVal = b.priority === 'high' ? 0 : b.priority === 'medium' ? 1 : 2;
      return aVal - bVal;
    });
  }
  return copy.map(t => t.id);
}

// 16. Periodic: Monthly Productivity Report
export async function generateMonthlyReport(metrics: {
  monthStart: string;
  tasksCompleted: number;
  habitsKept: number;
  deadlinesHit: number;
  deadlinesMissed: number;
  lessons: string[];
  compromises: string[];
}): Promise<{ summary: string; trends: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const systemPrompt =
        "You are a productivity auditor. Synthesize 4 weeks of productivity metrics into a monthly report. Return JSON with 'summary' (takeaway under 50 words) and 'trends' (key insights on habits and compromises under 50 words).";
      const prompt = `Month: ${metrics.monthStart}\nCompleted Tasks: ${metrics.tasksCompleted}\nHabits Kept: ${metrics.habitsKept}\nDeadlines Hit: ${metrics.deadlinesHit}\nDeadlines Missed: ${metrics.deadlinesMissed}\nLessons learned:\n${metrics.lessons.map(l => `- ${l}`).join('\n')}\nCompromises logged:\n${metrics.compromises.map(c => `- ${c}`).join('\n')}`;
      const res = await callAI(prompt, systemPrompt);
      const cleanJsonStr = res.substring(res.indexOf('{'), res.lastIndexOf('}') + 1);
      return JSON.parse(cleanJsonStr);
    } catch (e) {
      console.warn('Failed monthly report synthesis, using fallback:', e);
    }
  }

  const hitRate = Math.round((metrics.deadlinesHit / (metrics.deadlinesHit + metrics.deadlinesMissed || 1)) * 100);
  const summary = `Monthly audit: You successfully completed ${metrics.tasksCompleted} tasks and logged ${metrics.habitsKept} habit check-ins. Scoped deadlines had a hit rate of ${hitRate}%.`;
  let trends = 'Compromises tend to center around design reviews and testing setup during tight deadlines. ';
  if (metrics.lessons.length > 0) {
    trends += `Insights suggest a focus on: "${metrics.lessons[0]}".`;
  }

  return { summary, trends };
}
