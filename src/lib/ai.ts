// Dual-mode AI Engine for Taskflow

interface SortTaskInput {
  id: string;
  name: string;
  deadline: Date | null;
  objective: string;
  lesson: string;
  status: string;
}

interface DebriefMetrics {
  tasksCompleted: number;
  habitsKept: number;
  deadlinesHit: number;
  deadlinesMissed: number;
  lessons: string[];
  results: string[];
}

export async function callAI(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.content[0].text;
      } else {
        const errText = await response.text();
        console.warn('Anthropic API error, falling back to simulator:', errText);
      }
    } catch (err) {
      console.error('Error calling Anthropic API, falling back to simulator:', err);
    }
  }

  // Fallback simulator if key is missing or calls fail
  return simulateAI(prompt, systemPrompt);
}

// AI Simulator
function simulateAI(prompt: string, systemPrompt: string): string {
  const normalized = prompt.toLowerCase();

  // 1. Task Prioritizer
  if (normalized.includes('prioritize') || normalized.includes('sort tasks')) {
    return JSON.stringify({
      sortedTaskIds: [], // Will be handled on endpoint by mapping tasks
      reasonings: {
        // Will be generated dynamically for the tasks
      }
    });
  }

  // 2. What to do right now (Today's top actions)
  if (normalized.includes('what to do right now') || normalized.includes('top 3 actions')) {
    return JSON.stringify({
      actions: [
        { name: "Finalize high-priority project deliverables", estimate: "45 mins", reason: "Due in 2 days and blocks project completion." },
        { name: "Complete habit streak", estimate: "15 mins", reason: "Maintain streak. Consistency is key." },
        { name: "Review weekly scheduled checklist", estimate: "20 mins", reason: "Prepare for upcoming calendar deadlines." }
      ]
    });
  }

  // 3. Compromise Detector
  if (normalized.includes('compromise detector') || normalized.includes('compromise field')) {
    return "No recurring pattern detected yet. Keep logging compromises to unlock comparative insights.";
  }

  // 4. Weekly Debrief Generator
  if (normalized.includes('weekly debrief') || normalized.includes('debrief metrics')) {
    return JSON.stringify({
      topLesson: "Consistent daily execution is the key to managing project deadline congestion.",
      topResult: "Successfully launched project milestones and maintained code streaks.",
      summary: "An active and structured week. While habit tracking was stable, project congestion remains high. Consider spacing out task deadlines next week to avoid burnouts."
    });
  }

  return "AI Engine completed simulated response successfully.";
}

// 1. On-Demand: Sort Tasks Inside a Project
export async function prioritizeTasks(tasks: SortTaskInput[]): Promise<{ sorted: SortTaskInput[], reasonings: Record<string, string> }> {
  // Sort algorithm for fallback
  const sorted = [...tasks].sort((a, b) => {
    // 1. status: put 'done' at the bottom
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    
    // 2. deadline: due soonest first
    if (a.deadline && b.deadline) return a.deadline.getTime() - b.deadline.getTime();
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    
    return 0;
  });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    const systemPrompt = "You are an expert AI productivity coach. Prioritize the following list of tasks in a JSON format. Return a JSON object with 'sortedTaskIds' (array of IDs in priority order) and 'reasonings' (an object mapping task IDs to a single-sentence reasoning string under 15 words). Consider deadlines, objectives, and dependencies.";
    const prompt = `Project Tasks:\n${tasks.map(t => `- [ID: ${t.id}] "${t.name}" (Status: ${t.status}, Deadline: ${t.deadline?.toLocaleDateString() || 'None'}, Objective: ${t.objective}, Past Lesson: ${t.lesson})`).join('\n')}`;
    
    try {
      const res = await callAI(prompt, systemPrompt);
      // Clean JSON formatting from Claude
      const cleanJsonStr = res.substring(res.indexOf('{'), res.lastIndexOf('}') + 1);
      const parsed = JSON.parse(cleanJsonStr);
      if (parsed.sortedTaskIds && parsed.reasonings) {
        const sortedIds = parsed.sortedTaskIds as string[];
        const reasonings = parsed.reasonings as Record<string, string>;
        
        // Map back
        const resultTasks = [...tasks].sort((a, b) => sortedIds.indexOf(a.id) - sortedIds.indexOf(b.id));
        return { sorted: resultTasks, reasonings };
      }
    } catch (e) {
      console.warn('Failed parsing AI prioritization response, using rule-based fallback:', e);
    }
  }

  // Simulated Priority Reasonings
  const reasonings: Record<string, string> = {};
  sorted.forEach(t => {
    if (t.status === 'done') {
      reasonings[t.id] = "Task completed. No action needed.";
    } else if (t.deadline && (t.deadline.getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000)) {
      reasonings[t.id] = "Due soon. Crucial path item.";
    } else if (t.objective.toLowerCase().includes('core') || t.objective.toLowerCase().includes('database')) {
      reasonings[t.id] = "Foundation element. High priority.";
    } else {
      reasonings[t.id] = "Standard item. Follow sequential execution.";
    }
  });

  return { sorted, reasonings };
}

// 2. On-Demand: What to do right now (Top 3 Actions + Time Estimate)
export async function getTopActions(items: { name: string; type: string; details: string; deadline?: Date }[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (apiKey) {
    const systemPrompt = "You are an AI life coach. Look at the list of projects, habits, and tasks. Select the top 3 actions the user should do today. Return as JSON array of objects, each containing: 'name' (the action), 'estimate' (duration e.g. '30 mins'), and 'reason' (why it is high priority). Keep reasoning under 15 words.";
    const prompt = `Items for review:\n${items.map(i => `- [${i.type}] "${i.name}" (${i.details}, Deadline: ${i.deadline?.toLocaleDateString() || 'None'})`).join('\n')}`;

    try {
      const res = await callAI(prompt, systemPrompt);
      const cleanJsonStr = res.substring(res.indexOf('['), res.lastIndexOf(']') + 1);
      return JSON.parse(cleanJsonStr);
    } catch (e) {
      console.warn('Failed parsing AI top actions, using fallback:', e);
    }
  }

  // Static Fallback
  return [
    { name: "Prioritize pending task reflections", estimate: "15 mins", reason: "Reflections fuel the weekly learning metrics." },
    { name: "Complete streak-critical habits", estimate: "20 mins", reason: "streaks are fragile. Keep momentum active." },
    { name: "Review closest project deadlines", estimate: "40 mins", reason: "Prevent task build-up in calendar." }
  ];
}

// 3. Auto: Suggest Deadline (density warning)
export async function getDeadlineSuggestion(targetWeekDeadlinesCount: number, chosenDateStr: string): Promise<string | null> {
  if (targetWeekDeadlinesCount >= 3) {
    return `You have ${targetWeekDeadlinesCount} deadlines that week — consider spacing it out.`;
  }
  return null;
}

// 4. Auto: Compromise Detector
export async function detectCompromisePattern(compromiseInput: string, pastCompromises: string[]): Promise<string | null> {
  const cleanInput = compromiseInput.trim().toLowerCase();
  if (cleanInput.length < 3) return null;

  // Simple substring check across past logs
  const matches = pastCompromises.filter(c => {
    const cleanPast = c.trim().toLowerCase();
    // check words overlap
    const inputWords = cleanInput.split(/\s+/).filter(w => w.length > 3);
    return inputWords.some(w => cleanPast.includes(w));
  });

  if (matches.length >= 2) {
    return `Recurring compromise pattern flagged: you've noted similar compromises ${matches.length} times recently.`;
  }

  return null;
}

// 5. Periodic: Weekly Debrief Generator
export async function generateWeeklyDebrief(metrics: DebriefMetrics): Promise<{ topLesson: string; topResult: string; summary: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    const systemPrompt = "You are a personal growth advisor. Synthesize the weekly task metrics and reflections into a debrief. Return JSON with 'topLesson' (under 15 words), 'topResult' (under 15 words), and 'summary' (under 50 words).";
    const prompt = `Metrics:\nTasks Completed: ${metrics.tasksCompleted}\nHabits Kept: ${metrics.habitsKept}\nDeadlines Hit: ${metrics.deadlinesHit}\nDeadlines Missed: ${metrics.deadlinesMissed}\nLessons learned this week:\n${metrics.lessons.map(l => `- ${l}`).join('\n')}\nResults recorded:\n${metrics.results.map(r => `- ${r}`).join('\n')}`;

    try {
      const res = await callAI(prompt, systemPrompt);
      const cleanJsonStr = res.substring(res.indexOf('{'), res.lastIndexOf('}') + 1);
      return JSON.parse(cleanJsonStr);
    } catch (e) {
      console.warn('Failed parsing debrief, using fallback:', e);
    }
  }

  // Simulated synthesis based on actual metrics
  const hasMissed = metrics.deadlinesMissed > 0;
  
  let topLesson = "Planning task spacing reduces last-minute deadline stress.";
  if (metrics.lessons.length > 0) {
    topLesson = metrics.lessons[0];
  }

  let topResult = "Completed critical database architecture and core features.";
  if (metrics.results.length > 0) {
    topResult = metrics.results[0];
  }

  let summary = `An active week with ${metrics.tasksCompleted} tasks completed and ${metrics.habitsKept} habits logged. `;
  if (hasMissed) {
    summary += `You missed ${metrics.deadlinesMissed} deadlines. Consider prioritizing these first in the upcoming cycle.`;
  } else {
    summary += `Perfect score on deadlines! Maintain this high-performance layout in the next week.`;
  }

  return { topLesson, topResult, summary };
}
