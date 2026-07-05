'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedModal } from '@/components/AnimatedModal';
import { 
  Bell, User, Info, Folder, RotateCcw, Calendar as CalendarIcon, Clock, Plus, Trash2, 
  Edit, Brain, Check, X, ChevronLeft, ChevronRight, Sparkles, Sun, Moon, LogOut, 
  Settings, AlertTriangle, Play, CheckCircle, HelpCircle, BarChart2
} from 'lucide-react';

// Data models interfaces matching backend
interface Task {
  id: string;
  projectId: string;
  name: string;
  status: string;
  deadline: string | null;
  priority: string;
  aiReason: string;
  objective: string;
  result: string;
  lesson: string;
  compromise: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  deadline: string | null;
  objective: string;
  result: string;
  lesson: string;
  compromise: string;
  tasks: Task[];
}

interface HabitCheckIn {
  id: string;
  habitId: string;
  date: string;
}

interface Habit {
  id: string;
  name: string;
  streak: number;
  lastCheckedIn: string | null;
  objective: string;
  result: string;
  lesson: string;
  compromise: string;
  checkIns: HabitCheckIn[];
}

interface ScheduledTask {
  id: string;
  name: string;
  date: string;
  time: string;
  objective: string;
  result: string;
  lesson: string;
  compromise: string;
}

interface AppNotification {
  id: string;
  type: string;
  refId: string;
  refType: string;
  dueDate: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface WeeklyDebrief {
  id: string;
  weekStart: string;
  tasksCompleted: number;
  habitsKept: number;
  deadlinesHit: number;
  deadlinesMissed: number;
  topLesson: string;
  topResult: string;
  summary: string;
  generatedAt: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  theme: string;
  reminderTiming: number;
}

export default function DashboardPage() {
  const router = useRouter();

  // Active Bottom Tab: "projects" | "habits" | "calendar" | "scheduled"
  const [activeTab, setActiveTab] = useState<'projects' | 'habits' | 'calendar' | 'scheduled'>('projects');

  // Master State
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Toast State
  const [toast, setToast] = useState<{message: string, type: 'info'|'success'|'error'} | null>(null);
  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  const [projects, setProjects] = useState<Project[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [debriefs, setDebriefs] = useState<WeeklyDebrief[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<any[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [moodTasks, setMoodTasks] = useState<Task[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [loadingMood, setLoadingMood] = useState(false);
  const [focusBlocks, setFocusBlocks] = useState<any[]>([]);
  const [loadingFocus, setLoadingFocus] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [objectiveClarityWarning, setObjectiveClarityWarning] = useState<string | null>(null);
  const [taskObjectiveClarityWarning, setTaskObjectiveClarityWarning] = useState<string | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<string | null>(null);
  const [taskGapAnalysis, setTaskGapAnalysis] = useState<string | null>(null);
  const [suggestedBreakdown, setSuggestedBreakdown] = useState<any[]>([]);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [selectedBreakdownTasks, setSelectedBreakdownTasks] = useState<Record<number, boolean>>({});

  // Selected Detail views
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [selectedScheduled, setSelectedScheduled] = useState<ScheduledTask | null>(null);

  // Active Overlays
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // AI Widget recommendations state
  const [aiActions, setAiActions] = useState<any[]>([]);
  const [aiBestAction, setAiBestAction] = useState<any | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Form Modals
  const [modalType, setModalType] = useState<'' | 'new-project' | 'new-task' | 'new-habit' | 'new-scheduled'>('');
  const [loadingForm, setLoadingForm] = useState(false);

  // Form Inputs
  const [formName, setFormName] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formObjective, setFormObjective] = useState('');

  // AI Helpers Alert states during creation / edits
  const [deadlineWarning, setDeadlineWarning] = useState<string | null>(null);
  const [compromiseWarning, setCompromiseWarning] = useState<string | null>(null);
  const [prioritizingProjId, setPrioritizingProjId] = useState<string | null>(null);
  const [generatingDebrief, setGeneratingDebrief] = useState(false);

  // Global loading
  const [loading, setLoading] = useState(true);

  // Calendar Date selection
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedCalendarDayStr, setSelectedCalendarDayStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Initialize and Fetch data
  useEffect(() => {
    fetchInitialData();

    // Register service worker and request notifications permissions
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registered with scope:', reg.scope))
        .catch(err => console.error('Service Worker registration failed:', err));
        
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Get current user
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (!userData.user) {
        router.push('/login');
        return;
      }
      setUser(userData.user);

      // Apply initial theme layout
      if (userData.user.theme === 'light') {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }

      // 2. Fetch Dashboard items
      await refreshAllData();
      
      // 3. Fetch AI recommendations
      fetchAiRecommendations();

    } catch (e) {
      console.error('Error loading initial data:', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshAllData = async () => {
    try {
      const [projRes, habitRes, schedRes, notifRes, debriefRes, reportRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/habits'),
        fetch('/api/scheduled'),
        fetch('/api/notifications'),
        fetch('/api/debriefs'),
        fetch('/api/reports')
      ]);

      const projs = await projRes.json();
      const habs = await habitRes.json();
      const sched = await schedRes.json();
      const notifs = await notifRes.json();
      const debs = await debriefRes.json();
      const reps = await reportRes.json();

      // Trigger native notification for any newly fetched unread notification
      if (notifications && notifications.length > 0 && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const currentIds = new Set(notifications.map(n => n.id));
        const newUnread = notifs.filter((n: AppNotification) => !n.read && !currentIds.has(n.id));
        
        for (const notif of newUnread) {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification(notif.title, {
                body: notif.message,
                icon: '/favicon.ico',
                tag: notif.id,
              });
            });
          } else {
            new Notification(notif.title, { body: notif.message });
          }
        }
      }

      setProjects(projs);
      setHabits(habs);
      setScheduledTasks(sched);
      setNotifications(notifs);
      setDebriefs(debs);
      setMonthlyReports(reps);

      // Refresh selected details state to pick up newest values
      if (selectedProject) {
        const updatedProj = projs.find((p: Project) => p.id === selectedProject.id);
        setSelectedProject(updatedProj || null);
        
        if (selectedTask && updatedProj) {
          const updatedT = updatedProj.tasks.find((t: Task) => t.id === selectedTask.id);
          setSelectedTask(updatedT || null);
        }
      }
      if (selectedHabit) {
        const updatedHab = habs.find((h: Habit) => h.id === selectedHabit.id);
        setSelectedHabit(updatedHab || null);
      }
      if (selectedScheduled) {
        const updatedSch = sched.find((s: ScheduledTask) => s.id === selectedScheduled.id);
        setSelectedScheduled(updatedSch || null);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  const fetchAiRecommendations = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/recommend');
      const data = await res.json();
      setAiActions(data.topActions || []);
      setAiBestAction(data.singleBestAction || null);
    } catch (err) {
      console.error('Failed fetching AI tips:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  // User log out
  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    }
  };

  // Profile update
  const handleUpdateProfile = async (updates: { name: string; email: string; theme: string; reminderTiming: number }) => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed updating profile', 'error');
        return;
      }
      setUser(data);
      
      // Update theme classes
      if (data.theme === 'light') {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }
      showToast('Settings updated successfully!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed updating profile settings', 'error');
    }
  };

  // Dynamic Deadline suggester checker (counts densities in chosen date week)
  const handleDeadlineChange = async (dateStr: string) => {
    setFormDeadline(dateStr);
    setDeadlineWarning(null);
    if (!dateStr) return;

    try {
      const res = await fetch('/api/ai/check-deadline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr })
      });
      const data = await res.json();
      if (data.suggestion) {
        setDeadlineWarning(data.suggestion);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Dynamic Compromise Detector
  const handleCompromiseBlur = async (text: string) => {
    setCompromiseWarning(null);
    if (!text || text.trim().length === 0) return;

    try {
      const res = await fetch('/api/ai/check-compromise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compromise: text })
      });
      const data = await res.json();
      if (data.warning) {
        setCompromiseWarning(data.warning);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // CREATE Entities
  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingForm(true);
    setErrorForm('');

    let endpoint = '';
    let payload: any = { name: formName, objective: formObjective };

    if (modalType === 'new-project') {
      endpoint = '/api/projects';
      payload.deadline = formDeadline || null;
    } else if (modalType === 'new-task') {
      endpoint = '/api/tasks';
      payload.projectId = selectedProject?.id;
      payload.deadline = formDeadline || null;
    } else if (modalType === 'new-habit') {
      endpoint = '/api/habits';
    } else if (modalType === 'new-scheduled') {
      endpoint = '/api/scheduled';
      payload.date = formDeadline;
      payload.time = formTime;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create');
      }

      // Close modal & reset inputs
      setModalType('');
      setFormName('');
      setFormDeadline('');
      setFormTime('');
      setFormObjective('');
      setDeadlineWarning(null);

      // Refresh list
      await refreshAllData();
      fetchAiRecommendations();
    } catch (err: any) {
      setErrorForm(err.message || 'Creation failed');
    } finally {
      setLoadingForm(false);
    }
  };
  const [errorForm, setErrorForm] = useState('');

  // UPDATE Reflections
  const handleSaveReflections = async (
    type: 'project' | 'task' | 'habit' | 'scheduled',
    id: string,
    reflections: { objective?: string; result?: string; lesson?: string; compromise?: string; name?: string; status?: string }
  ) => {
    let endpoint = '';
    if (type === 'project') endpoint = `/api/projects/${id}`;
    else if (type === 'task') endpoint = `/api/tasks/${id}`;
    else if (type === 'habit') endpoint = `/api/habits/${id}`;
    else if (type === 'scheduled') endpoint = `/api/scheduled/${id}`;

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reflections)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed saving reflections');
      }

      await refreshAllData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // DELETE Entities
  const handleDeleteEntity = async (type: 'project' | 'task' | 'habit' | 'scheduled', id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    let endpoint = '';
    if (type === 'project') endpoint = `/api/projects/${id}`;
    else if (type === 'task') endpoint = `/api/tasks/${id}`;
    else if (type === 'habit') endpoint = `/api/habits/${id}`;
    else if (type === 'scheduled') endpoint = `/api/scheduled/${id}`;

    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');

      // Reset select details
      if (type === 'project') {
        setSelectedProject(null);
        setSelectedTask(null);
      } else if (type === 'task') {
        setSelectedTask(null);
      } else if (type === 'habit') {
        setSelectedHabit(null);
      } else if (type === 'scheduled') {
        setSelectedScheduled(null);
      }

      await refreshAllData();
      fetchAiRecommendations();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete item.', 'error');
    }
  };

  // Habit Check In
  const handleHabitCheckIn = async (habitId: string) => {
    const todayLocalStr = new Date().toISOString().split('T')[0];
    try {
      const res = await fetch(`/api/habits/${habitId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayLocalStr })
      });
      if (!res.ok) throw new Error('Checkin failed');
      await refreshAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // Prioritize Tasks with AI
  const handlePrioritizeTasks = async (projectId: string) => {
    setPrioritizingProjId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}/prioritize`, { method: 'POST' });
      if (!res.ok) throw new Error('Prioritization failed');
      await refreshAllData();
      showToast('AI task prioritization complete! Tasks have been reordered and AI priority badges applied.', 'success');
    } catch (e) {
      console.error(e);
      showToast('AI prioritize failed. Check server console.', 'error');
    } finally {
      setPrioritizingProjId(null);
    }
  };

  // Generate Weekly Debrief (Sunday retrospective)
  const handleGenerateDebrief = async () => {
    setGeneratingDebrief(true);
    try {
      const res = await fetch('/api/debriefs', { method: 'POST' });
      if (!res.ok) throw new Error('Debrief generation failed');
      await refreshAllData();
      showToast('Weekly Debrief generated successfully!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed generating debrief', 'error');
    } finally {
      setGeneratingDebrief(false);
    }
  };

  // Generate Monthly Productivity Report (AI 16)
  const handleGenerateMonthlyReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch('/api/reports', { method: 'POST' });
      if (!res.ok) throw new Error('Monthly report generation failed');
      await refreshAllData();
      showToast('Monthly Productivity Report generated successfully!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed generating monthly report', 'error');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Mood-Aware Reprioritizer (AI 14)
  const handleMoodReprioritize = async (mood: string, projectId?: string) => {
    setSelectedMood(mood);
    setLoadingMood(true);
    try {
      const res = await fetch('/api/ai/mood-prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, projectId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mood reprioritisation failed');
      setMoodTasks(data.tasks || []);
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Mood reprioritization failed', 'error');
    } finally {
      setLoadingMood(false);
    }
  };

  // Focus Blocks Suggester (AI 12)
  const handleFetchFocusBlocks = async () => {
    setLoadingFocus(true);
    try {
      const res = await fetch('/api/ai/focus-blocks');
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to fetch focus blocks');
      setFocusBlocks(data.blocks || []);
      setShowFocusModal(true);
    } catch (e) {
      console.error(e);
      showToast('Failed to get focus block suggestions.', 'error');
    } finally {
      setLoadingFocus(false);
    }
  };

  // Objective Clarity Checker (AI 10)
  const handleObjectiveClarityCheck = async (objective: string, isTask = false) => {
    if (isTask) setTaskObjectiveClarityWarning(null);
    else setObjectiveClarityWarning(null);

    if (!objective || objective.trim().length === 0) return;

    try {
      const res = await fetch('/api/ai/check-clarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective })
      });
      const data = await res.json();
      if (data.warning) {
        if (isTask) setTaskObjectiveClarityWarning(data.warning);
        else setObjectiveClarityWarning(data.warning);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Result vs Objective Gap Analyser (AI 11)
  const handleResultGapCheck = async (objective: string, result: string, isTask = false) => {
    if (isTask) setTaskGapAnalysis(null);
    else setGapAnalysis(null);

    if (!objective || !result || result.trim().length === 0) return;

    try {
      const res = await fetch('/api/ai/analyse-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective, result })
      });
      const data = await res.json();
      if (data.gap) {
        if (isTask) setTaskGapAnalysis(data.gap);
        else setGapAnalysis(data.gap);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Smart Task Breakdown (AI 9)
  const handleFetchSmartBreakdown = async (objective: string) => {
    setLoadingBreakdown(true);
    setSuggestedBreakdown([]);
    setSelectedBreakdownTasks({});
    try {
      const res = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate breakdown');
      setSuggestedBreakdown(data.suggestions || []);
      const checks: Record<number, boolean> = {};
      (data.suggestions || []).forEach((_: any, idx: number) => {
        checks[idx] = true;
      });
      setSelectedBreakdownTasks(checks);
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Failed task breakdown generation.', 'error');
    } finally {
      setLoadingBreakdown(false);
    }
  };

  const handleCreateSuggestedTasks = async (projectId: string) => {
    const tasksToCreate = suggestedBreakdown.filter((_, idx) => selectedBreakdownTasks[idx]);
    if (tasksToCreate.length === 0) {
      showToast('Please check at least one suggested task.', 'info');
      return;
    }

    setLoadingBreakdown(true);
    try {
      for (const t of tasksToCreate) {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            name: `${t.name} (${t.estimate})`,
            objective: `Auto-suggested sub-task for project goal.`
          })
        });
      }
      setSuggestedBreakdown([]);
      setSelectedBreakdownTasks({});
      await refreshAllData();
      showToast('Suggested tasks added to project successfully!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed adding suggested tasks.', 'error');
    } finally {
      setLoadingBreakdown(false);
    }
  };

  // Read Notifications Action
  const handleMarkNotificationsRead = async (id?: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read', id })
      });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Deep Link from Notifications
  const handleNotificationClick = async (notif: AppNotification) => {
    await handleMarkNotificationsRead(notif.id);
    setShowNotifications(false);

    if (notif.refType === 'project') {
      const proj = projects.find(p => p.id === notif.refId);
      if (proj) {
        setActiveTab('projects');
        setSelectedProject(proj);
        setSelectedTask(null);
      }
    } else if (notif.refType === 'task') {
      const task = projects.flatMap(p => p.tasks).find(t => t.id === notif.refId);
      if (task) {
        const proj = projects.find(p => p.id === task.projectId);
        setActiveTab('projects');
        setSelectedProject(proj || null);
        setSelectedTask(task);
      }
    } else if (notif.refType === 'scheduled') {
      const sched = scheduledTasks.find(s => s.id === notif.refId);
      if (sched) {
        setActiveTab('scheduled');
        setSelectedScheduled(sched);
      }
    }
  };

  // Calendar Helpers
  const changeMonth = (offset: number) => {
    const d = new Date(currentCalendarDate);
    d.setMonth(d.getMonth() + offset);
    setCurrentCalendarDate(d);
  };

  const getCalendarDays = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Padding preceding days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    
    // Actual month days
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getCalendarDotsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dots = [];

    // Projects (Purple)
    const hasProj = projects.some(p => p.deadline && p.deadline.split('T')[0] === dateStr);
    if (hasProj) dots.push('bg-brand-purple');

    // Tasks (Coral)
    const hasTask = projects.flatMap(p => p.tasks).some(t => t.deadline && t.deadline.split('T')[0] === dateStr);
    if (hasTask) dots.push('bg-brand-coral');

    // Scheduled (Teal)
    const hasSched = scheduledTasks.some(s => s.date === dateStr);
    if (hasSched) dots.push('bg-brand-teal');

    return dots;
  };

  const getDueItemsForSelectedDay = () => {
    const dueProj = projects.filter(p => p.deadline && p.deadline.split('T')[0] === selectedCalendarDayStr);
    const dueTasks = projects.flatMap(p => p.tasks).filter(t => t.deadline && t.deadline.split('T')[0] === selectedCalendarDayStr);
    const dueSched = scheduledTasks.filter(s => s.date === selectedCalendarDayStr);

    return { projects: dueProj, tasks: dueTasks, scheduled: dueSched };
  };

  // Render Loader
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <Sparkles className="w-12 h-12 text-brand-purple animate-pulse mb-4" />
        <p className="text-sm font-semibold tracking-wider uppercase text-neutral-400">Loading Taskflow...</p>
      </div>
    );
  }

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex-grow flex flex-col bg-neutral-950 text-neutral-100 max-w-5xl mx-auto w-full min-h-screen relative pb-24 shadow-2xl">
      {/* Toast Notification Overlay */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-fade-in">
          <div className={`px-6 py-3 rounded-lg shadow-lg border backdrop-blur-md whitespace-pre-wrap ${
            toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-100' :
            toast.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-100' :
            'bg-brand-purple/20 border-brand-purple/50 text-brand-purple-100'
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* 1. TOP BAR */}
      <header className="sticky top-0 z-30 h-16 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between px-6">
        {/* Brand */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedProject(null); setSelectedHabit(null); setSelectedScheduled(null); }}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-purple to-brand-teal flex items-center justify-center font-bold text-white shadow-md shadow-purple-500/20">
            T
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-50 to-neutral-200">
            Taskflow
          </span>
        </div>

        {/* Actions header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAbout(true)} 
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition"
            title="About Taskflow"
          >
            <Info className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setShowNotifications(true)}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-amber text-black font-bold text-[9px] flex items-center justify-center animate-bounce">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => setShowProfile(true)}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 flex items-center justify-center font-semibold text-xs tracking-wider uppercase text-brand-teal hover:scale-105 transition"
            title="Profile & Settings"
          >
            {user?.name.slice(0, 2) || 'JD'}
          </button>
        </div>
      </header>

      {/* CORE CONTAINER */}
      <main className="flex-grow px-6 py-6 overflow-y-auto space-y-6">
        
        {/* AI Recommendations persisted widget on Dashboard */}
        {activeTab === 'projects' && !selectedProject && (
          <div className="space-y-6">
            <section className="glass p-5 rounded-2xl bg-neutral-900/25 border-neutral-900 shadow-xl flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[40%] h-[100%] bg-brand-amber/5 blur-[60px] pointer-events-none" />
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-amber/15 text-brand-amber text-[10px] font-bold uppercase tracking-wider">
                  <Brain className="w-3.5 h-3.5" /> AI Productivity Coach
                </div>
                {aiBestAction ? (
                  <div>
                    <h3 className="text-base font-bold text-white mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-brand-amber" />
                      {aiBestAction.name}
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed mb-1">
                      <span className="font-semibold text-brand-teal">Reason:</span> {aiBestAction.reason}
                    </p>
                    <p className="text-[11px] italic text-neutral-500">
                      {aiBestAction.explanation}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400">Loading your customized AI advice widget...</p>
                )}

                {/* Mood Selector Widget (AI 14) */}
                <div className="pt-3 border-t border-neutral-900/60">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider block mb-2">Select Your Energy Level Today</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {['high', 'medium', 'low', 'creative', 'analytical'].map((m) => (
                      <button
                        key={m}
                        onClick={() => handleMoodReprioritize(m)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
                          selectedMood === m 
                            ? 'bg-brand-amber text-black' 
                            : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0 md:justify-center">
                <button 
                  onClick={fetchAiRecommendations}
                  disabled={loadingAi}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition disabled:opacity-50"
                >
                  {loadingAi ? 'Calculating...' : 'Recalculate Focus'}
                </button>
                <button 
                  onClick={() => {
                    showToast(`Today's Top 3 Planned Actions:\n\n` + 
                      aiActions.map((a, i) => `${i+1}. ${a.name} (${a.estimate})\n   Reason: ${a.reason}`).join('\n\n')
                    , 'info');
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-brand-amber to-brand-coral text-white transition hover:opacity-95"
                >
                  Show Today's Top 3
                </button>
                {/* Focus Block Suggester (AI 12) */}
                <button 
                  onClick={handleFetchFocusBlocks}
                  disabled={loadingFocus}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal border border-brand-teal/20 transition disabled:opacity-50 text-left"
                >
                  {loadingFocus ? 'Generating schedule...' : 'Suggest Daily Schedule'}
                </button>
              </div>
            </section>

            {/* Energy-Aligned Agenda Display */}
            {selectedMood && (
              <div className="glass p-5 rounded-2xl bg-neutral-900/15 border-neutral-900/50 space-y-3 animate-slide-up">
                <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-amber animate-spin" />
                    Today's Energy-Aligned Agenda ({selectedMood.toUpperCase()})
                  </h4>
                  <button onClick={() => { setSelectedMood(''); setMoodTasks([]); }} className="text-xs text-neutral-500 hover:text-white">
                    Clear Agenda
                  </button>
                </div>
                
                {loadingMood ? (
                  <p className="text-xs text-neutral-500 py-2">Consulting coach model...</p>
                ) : moodTasks.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-2">No pending tasks found. All clear!</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-neutral-400 italic">
                      Coach advice: optimized sequence based on {selectedMood} energy level.
                    </p>
                    {moodTasks.map((t, idx) => (
                      <div key={t.id} className="p-3 bg-neutral-950 rounded-lg border border-neutral-900 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-white block">{idx + 1}. {t.name}</span>
                          {t.priority && (
                            <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">Priority: {t.priority}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-brand-teal font-semibold">Ready</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dynamic routing of views based on active bottom tab */}
        
        {/* ======================================================== */}
        {/* TAB 1 — PROJECTS */}
        {/* ======================================================== */}
        {activeTab === 'projects' && (
          <div>
            {!selectedProject ? (
              // Project list view
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight">Active Projects</h2>
                    <p className="text-xs text-neutral-400">Establish objectives and analyze lessons learned</p>
                  </div>
                  <button 
                    onClick={() => setModalType('new-project')}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-brand-purple to-brand-purple-dark text-white flex items-center gap-1.5 hover:scale-102 hover:opacity-95 transition"
                  >
                    <Plus className="w-4 h-4" /> New Project
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map(project => (
                    <div 
                      key={project.id}
                      onClick={() => { setSelectedProject(project); setSelectedTask(null); }}
                      className="glass p-5 rounded-xl border-neutral-900 bg-neutral-900/10 hover:border-brand-purple/30 hover:bg-neutral-900/20 cursor-pointer flex flex-col justify-between h-44 transition group"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              project.status === 'done' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                              project.status === 'in progress' ? 'bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30' :
                              'bg-neutral-800 text-neutral-400 border border-neutral-700'
                            }`}>
                              {project.status}
                            </span>
                            {(project as any).healthScore !== undefined && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showToast(`${project.name} Health Details:\n\n${(project as any).healthDetails}`, 'info');
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition hover:opacity-85 cursor-help ${
                                  (project as any).healthScore >= 70 ? 'bg-emerald-950/40 text-emerald-400 border-emerald-950' :
                                  (project as any).healthScore >= 40 ? 'bg-amber-950/40 text-brand-amber border-amber-950' :
                                  'bg-red-950/40 text-red-400 border-red-950'
                                }`}
                              >
                                Health: {(project as any).healthScore}%
                              </span>
                            )}
                          </div>
                          {project.deadline && (
                            <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {new Date(project.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-base text-white group-hover:text-brand-purple-light transition">
                          {project.name}
                        </h3>
                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                          {project.objective || 'No objective set yet. Add reflection.'}
                        </p>
                      </div>

                      <div className="text-[11px] text-neutral-500 pt-2 border-t border-neutral-900 flex justify-between items-center">
                        <span>{project.tasks.length} tasks nested</span>
                        <span className="text-brand-purple group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                          View details <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Project details view
              <div className="space-y-6 animate-slide-up">
                {/* Back button */}
                <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                  <button 
                    onClick={() => { setSelectedProject(null); setSelectedTask(null); }}
                    className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1 transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to Projects
                  </button>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handlePrioritizeTasks(selectedProject.id)}
                      disabled={prioritizingProjId === selectedProject.id}
                      className="px-3.5 py-1.5 rounded-lg border border-brand-amber bg-brand-amber/10 text-brand-amber text-xs font-semibold flex items-center gap-1.5 hover:bg-brand-amber/20 transition disabled:opacity-50"
                    >
                      <Brain className="w-3.5 h-3.5" /> {prioritizingProjId === selectedProject.id ? 'Reordering...' : 'Prioritize with AI'}
                    </button>
                    <button 
                      onClick={() => handleDeleteEntity('project', selectedProject.id)}
                      className="p-1.5 rounded-lg border border-red-950 text-red-400 hover:bg-red-950/40 transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Project Header details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">{selectedProject.name}</h2>
                    <select
                      value={selectedProject.status}
                      onChange={(e) => handleSaveReflections('project', selectedProject.id, { status: e.target.value })}
                      className="text-xs rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-white outline-none"
                    >
                      <option value="planning">planning</option>
                      <option value="in progress">in progress</option>
                      <option value="done">done</option>
                    </select>
                  </div>
                  {selectedProject.deadline && (
                    <p className="text-xs text-neutral-400 flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-brand-purple" />
                      Deadline: <span className="text-white font-medium">{new Date(selectedProject.deadline).toLocaleDateString()}</span> (purple calendar dot)
                    </p>
                  )}
                </div>

                {/* 4 REFLECTIVE FIELDS FOR PROJECT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Objective */}
                  <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-purple flex items-center gap-1">
                      <Folder className="w-3 h-3" /> Objective — what we want to achieve
                    </label>
                    <textarea
                      defaultValue={selectedProject.objective}
                      onBlur={(e) => {
                        handleSaveReflections('project', selectedProject.id, { objective: e.target.value });
                        handleObjectiveClarityCheck(e.target.value, false);
                      }}
                      placeholder="Add target project goal..."
                      className="w-full text-xs bg-transparent border-0 resize-none focus:ring-0 outline-none text-neutral-300 h-16 leading-relaxed"
                    />
                    {objectiveClarityWarning && (
                      <span className="text-[10px] text-brand-amber font-semibold block pt-1 leading-normal border-t border-neutral-900">
                        ⚠️ Objective Nudge: {objectiveClarityWarning}
                      </span>
                    )}
                  </div>

                  {/* Result */}
                  <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Result — what we actually accomplished
                    </label>
                    <textarea
                      defaultValue={selectedProject.result}
                      onBlur={(e) => {
                        handleSaveReflections('project', selectedProject.id, { result: e.target.value });
                        handleResultGapCheck(selectedProject.objective, e.target.value, false);
                      }}
                      placeholder="Log final project outcome..."
                      className="w-full text-xs bg-transparent border-0 resize-none focus:ring-0 outline-none text-neutral-300 h-16 leading-relaxed"
                    />
                    {gapAnalysis && (
                      <span className="text-[10px] text-emerald-400 font-semibold block pt-1 leading-normal border-t border-neutral-900">
                        💡 Gap Analysis: {gapAnalysis}
                      </span>
                    )}
                  </div>

                  {/* Lesson */}
                  <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-amber flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Lesson — what we learned from it
                    </label>
                    <textarea
                      defaultValue={selectedProject.lesson}
                      onBlur={(e) => handleSaveReflections('project', selectedProject.id, { lesson: e.target.value })}
                      placeholder="Spot learnings and growth patterns..."
                      className="w-full text-xs bg-transparent border-0 resize-none focus:ring-0 outline-none text-neutral-300 h-16 leading-relaxed"
                    />
                  </div>

                  {/* Compromise */}
                  <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-coral flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Compromise — what we sacrificed
                    </label>
                    <textarea
                      defaultValue={selectedProject.compromise}
                      onBlur={(e) => {
                        handleSaveReflections('project', selectedProject.id, { compromise: e.target.value });
                        handleCompromiseBlur(e.target.value);
                      }}
                      placeholder="Specify shortcuts or delayed scope..."
                      className="w-full text-xs bg-transparent border-0 resize-none focus:ring-0 outline-none text-neutral-300 h-16 leading-relaxed"
                    />
                    {compromiseWarning && (
                      <span className="text-[10px] text-brand-amber font-semibold block pt-1 leading-normal border-t border-neutral-900">
                        ⚠️ {compromiseWarning}
                      </span>
                    )}
                  </div>
                </div>

                {/* PROJECT NESTED TASKS */}
                <div className="border-t border-neutral-900 pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-base text-white">Project Tasks</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFetchSmartBreakdown(selectedProject.objective || selectedProject.name)}
                        disabled={loadingBreakdown}
                        className="px-3 py-1.5 rounded-lg border border-brand-teal/20 bg-brand-teal/5 hover:bg-brand-teal/10 text-xs font-semibold text-brand-teal flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        <Brain className="w-3.5 h-3.5" /> {loadingBreakdown ? 'Breaking down...' : 'AI Suggest Tasks'}
                      </button>
                      <button
                        onClick={() => setModalType('new-task')}
                        className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-900 text-xs font-semibold text-neutral-300 flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Task
                      </button>
                    </div>
                  </div>

                  {/* Suggested Tasks Panel (AI 9) */}
                  {suggestedBreakdown.length > 0 && (
                    <div className="p-5 rounded-2xl border border-brand-teal/20 bg-brand-teal/5 space-y-4 animate-slide-up">
                      <div className="flex justify-between items-center border-b border-brand-teal/10 pb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-brand-teal" /> AI Task Suggestions
                        </span>
                        <button 
                          onClick={() => setSuggestedBreakdown([])} 
                          className="text-xs text-neutral-500 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {suggestedBreakdown.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-2.5 bg-neutral-950/40 rounded-xl border border-neutral-900">
                            <label className="flex items-center gap-2 cursor-pointer text-neutral-300 font-medium">
                              <input 
                                type="checkbox" 
                                checked={!!selectedBreakdownTasks[idx]}
                                onChange={(e) => setSelectedBreakdownTasks({ ...selectedBreakdownTasks, [idx]: e.target.checked })}
                                className="rounded border-neutral-850 bg-neutral-900 text-brand-teal focus:ring-brand-teal w-4 h-4"
                              />
                              {item.name}
                            </label>
                            <span className="text-[10px] text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-800">
                              Est: {item.estimate}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handleCreateSuggestedTasks(selectedProject.id)}
                        className="w-full py-2 bg-brand-teal text-black font-extrabold text-xs rounded-xl hover:opacity-95 transition"
                      >
                        Create Selected Tasks ({Object.values(selectedBreakdownTasks).filter(Boolean).length})
                      </button>
                    </div>
                  )}

                  {/* Tasks Table/List */}
                  <div className="space-y-2">
                    {selectedProject.tasks.length === 0 ? (
                      <p className="text-xs text-neutral-500 py-4 text-center">No tasks inside this project yet. Use AI prioritizer after adding tasks.</p>
                    ) : (
                      selectedProject.tasks.map(task => (
                        <div 
                          key={task.id}
                          className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition cursor-pointer ${
                            selectedTask?.id === task.id ? 'border-brand-purple bg-neutral-900/30' : 'border-neutral-900 hover:border-neutral-800'
                          }`}
                          onClick={() => setSelectedTask(task)}
                        >
                          <div className="space-y-2 flex-grow">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Checkbox toggle status */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveReflections('task', task.id, { status: task.status === 'done' ? 'todo' : 'done' });
                                }}
                                className={`w-5 h-5 rounded flex items-center justify-center border transition ${
                                  task.status === 'done' ? 'bg-brand-purple border-brand-purple text-white' : 'border-neutral-700 hover:border-neutral-500'
                                }`}
                              >
                                {task.status === 'done' && <Check className="w-3.5 h-3.5" />}
                              </button>
                              
                              <span className={`font-bold text-sm text-neutral-200 ${task.status === 'done' ? 'line-through text-neutral-500' : ''}`}>
                                {task.name}
                              </span>

                              {/* AI priority badges */}
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                                task.priority === 'high' ? 'bg-red-950 text-red-400 border border-red-900' :
                                task.priority === 'medium' ? 'bg-amber-950 text-brand-amber border border-amber-900' :
                                'bg-slate-900 text-slate-400 border border-slate-700'
                              }`}>
                                {task.priority} Priority
                              </span>
                            </div>
                            
                            {task.aiReason && (
                              <p className="text-[11px] text-brand-amber font-medium italic">
                                💡 {task.aiReason}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                            {task.deadline && (
                              <span className="text-[10px] text-brand-coral font-medium flex items-center gap-1 bg-brand-coral/10 px-2 py-1 rounded-full border border-brand-coral/20">
                                <CalendarIcon className="w-3 h-3" />
                                {new Date(task.deadline).toLocaleDateString()}
                              </span>
                            )}
                            <ChevronRight className={`w-4 h-4 text-neutral-600 transition-transform ${selectedTask?.id === task.id ? 'rotate-90' : ''}`} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* TASK DETAIL RETRO DRAWER (visible if selected) */}
                {selectedTask && (
                  <div className="border border-neutral-800 bg-neutral-900/10 p-5 rounded-2xl space-y-4 animate-slide-up">
                    <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                      <div>
                        <h4 className="text-xs text-brand-coral font-bold uppercase tracking-wider">Active Task Audit</h4>
                        <p className="font-bold text-white">{selectedTask.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleDeleteEntity('task', selectedTask.id)}
                          className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 border border-red-950 rounded-lg"
                        >
                          Delete Task
                        </button>
                        <button onClick={() => setSelectedTask(null)} className="p-1.5 text-neutral-500 hover:text-white rounded-lg hover:bg-neutral-800">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Task objective */}
                      <div className="space-y-1 bg-neutral-950 p-3 rounded-lg">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Objective</span>
                        <textarea
                          defaultValue={selectedTask.objective}
                          onBlur={(e) => {
                            handleSaveReflections('task', selectedTask.id, { objective: e.target.value });
                            handleObjectiveClarityCheck(e.target.value, true);
                          }}
                          placeholder="Log task target..."
                          className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 text-neutral-200 h-12"
                        />
                        {taskObjectiveClarityWarning && (
                          <span className="text-[9px] text-brand-amber font-semibold block pt-1 border-t border-neutral-900 leading-normal">
                            ⚠️ Clarity: {taskObjectiveClarityWarning}
                          </span>
                        )}
                      </div>

                      {/* Task result */}
                      <div className="space-y-1 bg-neutral-950 p-3 rounded-lg">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Result</span>
                        <textarea
                          defaultValue={selectedTask.result}
                          onBlur={(e) => {
                            handleSaveReflections('task', selectedTask.id, { result: e.target.value });
                            handleResultGapCheck(selectedTask.objective, e.target.value, true);
                          }}
                          placeholder="Log completed result..."
                          className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 text-neutral-200 h-12"
                        />
                        {taskGapAnalysis && (
                          <span className="text-[9px] text-emerald-400 font-semibold block pt-1 border-t border-neutral-900 leading-normal">
                            💡 Gap: {taskGapAnalysis}
                          </span>
                        )}
                      </div>

                      {/* Task lesson */}
                      <div className="space-y-1 bg-neutral-950 p-3 rounded-lg">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Lesson</span>
                        <textarea
                          defaultValue={selectedTask.lesson}
                          onBlur={(e) => handleSaveReflections('task', selectedTask.id, { lesson: e.target.value })}
                          placeholder="Log learnings..."
                          className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 text-neutral-200 h-12"
                        />
                      </div>

                      {/* Task compromise */}
                      <div className="space-y-1 bg-neutral-950 p-3 rounded-lg">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Compromise</span>
                        <textarea
                          defaultValue={selectedTask.compromise}
                          onBlur={(e) => {
                            handleSaveReflections('task', selectedTask.id, { compromise: e.target.value });
                            handleCompromiseBlur(e.target.value);
                          }}
                          placeholder="Log sacrifice..."
                          className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 text-neutral-200 h-12"
                        />
                        {compromiseWarning && (
                          <span className="text-[9px] text-brand-amber font-semibold block pt-1 border-t border-neutral-900 leading-normal">
                            ⚠️ {compromiseWarning}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2 — HABITS */}
        {/* ======================================================== */}
        {activeTab === 'habits' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">Daily Habits</h2>
                <p className="text-xs text-neutral-400">Lock streaks and build behavioral feedback loops</p>
              </div>
              <button 
                onClick={() => setModalType('new-habit')}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white flex items-center gap-1.5 hover:scale-102 hover:opacity-95 transition"
              >
                <Plus className="w-4 h-4" /> New Habit
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Habits List */}
              <div className="space-y-2">
                {habits.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-6 text-center">No habits established yet. Create one above.</p>
                ) : (
                  habits.map(habit => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isCheckedToday = habit.checkIns.some(c => c.date === todayStr);

                    return (
                      <div 
                        key={habit.id}
                        onClick={() => setSelectedHabit(habit)}
                        className={`p-4 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition ${
                          selectedHabit?.id === habit.id ? 'border-brand-teal bg-neutral-900/30' : 'border-neutral-900 hover:border-neutral-800'
                        }`}
                      >
                        <div className="space-y-1">
                          <h3 className="font-bold text-white text-sm">{habit.name}</h3>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                            <span className="text-brand-teal font-semibold">Streak: {habit.streak} days 🔥</span>
                            <span>•</span>
                            <span>Objective truncated</span>
                          </div>
                        </div>

                        {/* Checkin button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHabitCheckIn(habit.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition ${
                            isCheckedToday 
                              ? 'bg-brand-teal border-brand-teal text-white' 
                              : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                          }`}
                        >
                          {isCheckedToday ? <CheckCircle className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          {isCheckedToday ? 'Done Today' : 'Mark Done'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Habit details form reflection */}
              <div className="glass p-5 rounded-2xl border-neutral-900 bg-neutral-900/10 min-h-64 flex flex-col justify-between">
                {selectedHabit ? (
                  <div className="space-y-4 animate-slide-up flex-grow flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
                        <h3 className="font-bold text-white text-base">{selectedHabit.name}</h3>
                        <button 
                          onClick={() => handleDeleteEntity('habit', selectedHabit.id)}
                          className="text-[10px] font-semibold text-red-400 hover:text-red-300 border border-red-950 px-2 py-1 rounded"
                        >
                          Delete Habit
                        </button>
                      </div>

                      {/* Streaks details */}
                      <p className="text-xs text-neutral-400">
                        Streaks resets to zero if daily check-in is missed. Keep logging objectives and lessons.
                      </p>

                      <div className="grid grid-cols-1 gap-3 text-xs">
                        <div className="space-y-1 bg-neutral-950 p-3 rounded-lg">
                          <label className="text-[9px] font-bold text-brand-teal uppercase tracking-widest block">Objective</label>
                          <textarea
                            defaultValue={selectedHabit.objective}
                            onBlur={(e) => handleSaveReflections('habit', selectedHabit.id, { objective: e.target.value })}
                            placeholder="Add habit objective..."
                            className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 text-neutral-200 h-10"
                          />
                        </div>

                        <div className="space-y-1 bg-neutral-950 p-3 rounded-lg">
                          <label className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">Result</label>
                          <textarea
                            defaultValue={selectedHabit.result}
                            onBlur={(e) => handleSaveReflections('habit', selectedHabit.id, { result: e.target.value })}
                            placeholder="Add habit result..."
                            className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 text-neutral-200 h-10"
                          />
                        </div>

                        <div className="space-y-1 bg-neutral-950 p-3 rounded-lg">
                          <label className="text-[9px] font-bold text-brand-amber uppercase tracking-widest block">Lesson</label>
                          <textarea
                            defaultValue={selectedHabit.lesson}
                            onBlur={(e) => handleSaveReflections('habit', selectedHabit.id, { lesson: e.target.value })}
                            placeholder="Add habit lesson..."
                            className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 text-neutral-200 h-10"
                          />
                        </div>

                        <div className="space-y-1 bg-neutral-950 p-3 rounded-lg">
                          <label className="text-[9px] font-bold text-brand-coral uppercase tracking-widest block">Compromise</label>
                          <textarea
                            defaultValue={selectedHabit.compromise}
                            onBlur={(e) => {
                              handleSaveReflections('habit', selectedHabit.id, { compromise: e.target.value });
                              handleCompromiseBlur(e.target.value);
                            }}
                            placeholder="Add habit compromise..."
                            className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 text-neutral-200 h-10"
                          />
                          {compromiseWarning && (
                            <span className="text-[9px] text-brand-amber font-semibold block pt-1 border-t border-neutral-900 leading-normal">
                              ⚠️ {compromiseWarning}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-20 text-neutral-500">
                    <CalendarIcon className="w-10 h-10 text-neutral-700 mb-2 animate-bounce" />
                    <p className="text-xs">Select a habit from the list to view reflective logs.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3 — CALENDAR */}
        {/* ======================================================== */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Task & Deadline Calendar</h2>
              <p className="text-xs text-neutral-400">Color-coded deadlines: Purple (Projects), Coral (Tasks), Teal (Scheduled)</p>
            </div>

            {/* MONTH SWITCHER GRID */}
            <div className="glass p-5 rounded-2xl border border-neutral-900 bg-neutral-900/10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white text-base">
                  {currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex items-center gap-1">
                  <button onClick={() => changeMonth(-1)} className="p-2 border border-neutral-800 bg-neutral-950 rounded-lg hover:bg-neutral-900 transition">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => changeMonth(1)} className="p-2 border border-neutral-800 bg-neutral-950 rounded-lg hover:bg-neutral-900 transition">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-neutral-500">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Day Grid cells */}
              <div className="grid grid-cols-7 gap-2">
                {getCalendarDays().map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="aspect-square bg-transparent rounded-lg" />;
                  }

                  const dateStr = date.toISOString().split('T')[0];
                  const dots = getCalendarDotsForDay(date);
                  const isSelected = dateStr === selectedCalendarDayStr;
                  const isToday = dateStr === new Date().toISOString().split('T')[0];

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedCalendarDayStr(dateStr)}
                      className={`aspect-square p-2 border flex flex-col justify-between items-center rounded-xl cursor-pointer relative hover:scale-105 active:scale-98 transition duration-150 ${
                        isSelected 
                          ? 'border-brand-purple bg-brand-purple/5 shadow-md shadow-purple-500/5' 
                          : isToday 
                            ? 'border-brand-teal bg-brand-teal/5' 
                            : 'border-neutral-900 bg-neutral-950/40 hover:border-neutral-700'
                      }`}
                    >
                      <span className={`text-xs font-bold ${isToday ? 'text-brand-teal' : 'text-neutral-300'}`}>
                        {date.getDate()}
                      </span>

                      {/* Color-coded Dots */}
                      <div className="flex gap-1 items-center justify-center flex-wrap h-2">
                        {dots.map((color, di) => (
                          <div key={di} className={`w-1.5 h-1.5 rounded-full ${color}`} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DETAIL STRIP (drawer below calendar grid) */}
            <div className="glass p-5 rounded-2xl border border-neutral-900 bg-neutral-900/10 space-y-4">
              <h3 className="font-bold text-sm border-b border-neutral-900 pb-2">
                Due on {new Date(selectedCalendarDayStr).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>

              {(() => {
                const { projects: dueP, tasks: dueT, scheduled: dueS } = getDueItemsForSelectedDay();

                if (dueP.length === 0 && dueT.length === 0 && dueS.length === 0) {
                  return <p className="text-xs text-neutral-500 py-2">No deadlines scheduled for this day.</p>;
                }

                return (
                  <div className="space-y-3">
                    {/* Projects (Purple) */}
                    {dueP.map(p => (
                      <div key={p.id} className="p-3 rounded-lg bg-purple-950/20 border border-brand-purple/20 flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-brand-purple-light uppercase tracking-wider block">Project Deadline</span>
                          <span className="font-bold text-white text-xs">{p.name}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setActiveTab('projects');
                            setSelectedProject(p);
                            setSelectedTask(null);
                          }}
                          className="text-[10px] text-brand-purple-light hover:underline font-semibold"
                        >
                          Deep Link &rarr;
                        </button>
                      </div>
                    ))}

                    {/* Tasks (Coral) */}
                    {dueT.map(t => (
                      <div key={t.id} className="p-3 rounded-lg bg-orange-950/20 border border-brand-coral/20 flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-brand-coral-light uppercase tracking-wider block">Task Deadline</span>
                          <span className="font-bold text-white text-xs">{t.name}</span>
                        </div>
                        <button 
                          onClick={() => {
                            const p = projects.find(proj => proj.id === t.projectId);
                            setActiveTab('projects');
                            setSelectedProject(p || null);
                            setSelectedTask(t);
                          }}
                          className="text-[10px] text-brand-coral-light hover:underline font-semibold"
                        >
                          Deep Link &rarr;
                        </button>
                      </div>
                    ))}

                    {/* Scheduled (Teal) */}
                    {dueS.map(s => (
                      <div key={s.id} className="p-3 rounded-lg bg-teal-950/20 border border-brand-teal/20 flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-brand-teal-light uppercase tracking-wider block">Scheduled task ({s.time})</span>
                          <span className="font-bold text-white text-xs">{s.name}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setActiveTab('scheduled');
                            setSelectedScheduled(s);
                          }}
                          className="text-[10px] text-brand-teal-light hover:underline font-semibold"
                        >
                          Deep Link &rarr;
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4 — SCHEDULED TASKS */}
        {/* ======================================================== */}
        {activeTab === 'scheduled' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">One-Off Scheduled Tasks</h2>
                <p className="text-xs text-neutral-400">Chronological checklist of non-project appointments and duties</p>
              </div>
              <button 
                onClick={() => setModalType('new-scheduled')}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white flex items-center gap-1.5 hover:scale-102 hover:opacity-95 transition"
              >
                <Plus className="w-4 h-4" /> Schedule Task
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scheduled checklist */}
              <div className="space-y-2">
                {scheduledTasks.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-6 text-center">No scheduled items. Create one above.</p>
                ) : (
                  scheduledTasks.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedScheduled(item)}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition ${
                        selectedScheduled?.id === item.id ? 'border-brand-teal bg-neutral-900/30' : 'border-neutral-900 hover:border-neutral-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <h3 className="font-bold text-white text-sm">{item.name}</h3>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-semibold uppercase">
                          <span className="text-brand-teal">{item.date}</span>
                          <span>at</span>
                          <span className="text-neutral-300">{item.time}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-600" />
                    </div>
                  ))
                )}
              </div>

              {/* Reflections block for scheduled item */}
              <div className="glass p-5 rounded-2xl border-neutral-900 bg-neutral-900/10 min-h-64 flex flex-col justify-between">
                {selectedScheduled ? (
                  <div className="space-y-4 animate-slide-up flex-grow flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
                        <h3 className="font-bold text-white text-base">{selectedScheduled.name}</h3>
                        <button 
                          onClick={() => handleDeleteEntity('scheduled', selectedScheduled.id)}
                          className="text-[10px] font-semibold text-red-400 hover:text-red-300 border border-red-950 px-2 py-1 rounded"
                        >
                          Delete Task
                        </button>
                      </div>

                      <p className="text-xs text-neutral-400">
                        Date: <span className="text-white">{selectedScheduled.date}</span> at <span className="text-white">{selectedScheduled.time}</span> (Teal calendar dot)
                      </p>

                      <div className="grid grid-cols-1 gap-3 text-xs">
                        <div className="space-y-1 bg-neutral-950 p-3 rounded-lg">
                          <label className="text-[9px] font-bold text-brand-teal uppercase tracking-widest block">Objective</label>
                          <textarea
                            defaultValue={selectedScheduled.objective}
                            onBlur={(e) => handleSaveReflections('scheduled', selectedScheduled.id, { objective: e.target.value })}
                            placeholder="Add objective reflections..."
                            className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 text-neutral-200 h-10"
                          />
                        </div>

                        <div className="space-y-1 bg-neutral-950 p-3 rounded-lg">
                          <label className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">Result</label>
                          <textarea
                            defaultValue={selectedScheduled.result}
                            onBlur={(e) => handleSaveReflections('scheduled', selectedScheduled.id, { result: e.target.value })}
                            placeholder="Add result reflections..."
                            className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 text-neutral-200 h-10"
                          />
                        </div>

                        <div className="space-y-1 bg-neutral-950 p-3 rounded-lg">
                          <label className="text-[9px] font-bold text-brand-amber uppercase tracking-widest block">Lesson</label>
                          <textarea
                            defaultValue={selectedScheduled.lesson}
                            onBlur={(e) => handleSaveReflections('scheduled', selectedScheduled.id, { lesson: e.target.value })}
                            placeholder="Add lesson reflections..."
                            className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 text-neutral-200 h-10"
                          />
                        </div>

                        <div className="space-y-1 bg-neutral-950 p-3 rounded-lg">
                          <label className="text-[9px] font-bold text-brand-coral uppercase tracking-widest block">Compromise</label>
                          <textarea
                            defaultValue={selectedScheduled.compromise}
                            onBlur={(e) => {
                              handleSaveReflections('scheduled', selectedScheduled.id, { compromise: e.target.value });
                              handleCompromiseBlur(e.target.value);
                            }}
                            placeholder="Add compromise reflections..."
                            className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 text-neutral-200 h-10"
                          />
                          {compromiseWarning && (
                            <span className="text-[9px] text-brand-amber font-semibold block pt-1 border-t border-neutral-900 leading-normal">
                              ⚠️ {compromiseWarning}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-20 text-neutral-500">
                    <Clock className="w-10 h-10 text-neutral-700 mb-2 animate-pulse" />
                    <p className="text-xs">Select a scheduled task from the checklist to edit.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* 2. BOTTOM TABS NAVIGATION */}
      {/* ======================================================== */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 max-w-5xl mx-auto w-full border-t border-neutral-900 bg-neutral-950 px-6 py-3 flex justify-around items-center">
        {/* Tab 1 - Projects */}
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex flex-col items-center gap-1.5 transition ${
            activeTab === 'projects' ? 'text-brand-purple' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Folder className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wide uppercase">Projects</span>
        </button>

        {/* Tab 2 - Habits */}
        <button
          onClick={() => setActiveTab('habits')}
          className={`flex flex-col items-center gap-1.5 transition ${
            activeTab === 'habits' ? 'text-brand-teal' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <RotateCcw className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wide uppercase">Habits</span>
        </button>

        {/* Tab 3 - Calendar */}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-1.5 transition ${
            activeTab === 'calendar' ? 'text-brand-purple' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wide uppercase">Calendar</span>
        </button>

        {/* Tab 4 - Scheduled */}
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`flex flex-col items-center gap-1.5 transition ${
            activeTab === 'scheduled' ? 'text-brand-teal' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wide uppercase">Scheduled</span>
        </button>
      </footer>

      {/* ======================================================== */}
      {/* OVERLAY PANEL 1: NOTIFICATIONS FEED */}
      {/* ======================================================== */}
      <AnimatedModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} position="right">

          <div 
            className="w-full max-w-md h-full bg-neutral-900 border-l border-neutral-800 p-6 flex flex-col justify-between text-left animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6 overflow-y-auto">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                <h3 className="font-extrabold text-lg text-white flex items-center gap-1.5">
                  <Bell className="w-5 h-5 text-brand-amber" /> Notifications Center
                </h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleMarkNotificationsRead()}
                    className="text-[10px] font-semibold text-brand-amber hover:underline"
                  >
                    Clear All Read
                  </button>
                  <button onClick={() => setShowNotifications(false)} className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-10 text-center">No active notifications. Check deadlines on calendar tab.</p>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 rounded-xl border cursor-pointer hover:bg-neutral-950 transition ${
                        notif.read ? 'border-neutral-900 bg-neutral-950/20 opacity-60' : 'border-brand-amber bg-brand-amber/5'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider ${
                          notif.type === 'deadline_project' ? 'text-brand-purple' :
                          notif.type === 'deadline_task' ? 'text-brand-coral' : 'text-brand-teal'
                        }`}>
                          {notif.title}
                        </span>
                        <span className="text-[9px] text-neutral-500">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-200 leading-normal mb-2">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-brand-amber font-semibold block text-right hover:underline">
                        Deep Link Item &rarr;
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </AnimatedModal>
      

      {/* ======================================================== */}
      {/* OVERLAY PANEL 2: PROFILE & SETTINGS */}
      {/* ======================================================== */}
      <AnimatedModal isOpen={showProfile && !!user} onClose={() => setShowProfile(false)} position="right">

          <div 
            className="w-full max-w-md h-full bg-neutral-900 border-l border-neutral-800 p-6 flex flex-col gap-6 text-left overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3 flex-shrink-0">
              <h3 className="font-extrabold text-lg text-white flex items-center gap-1.5">
                <Settings className="w-5 h-5 text-brand-teal" /> Profile & Settings
              </h3>
              <button onClick={() => setShowProfile(false)} className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User details */}
            <div className="space-y-4 flex-shrink-0">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Full Name</label>
                <input
                  type="text"
                  defaultValue={user?.name ?? ""}
                  id="profile-name"
                  placeholder="Enter name"
                  className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-xs focus:border-brand-teal outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Email Address</label>
                <input
                  type="email"
                  defaultValue={user?.email ?? ""}
                  id="profile-email"
                  placeholder="Enter email"
                  className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-xs focus:border-brand-teal outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Reminder Window</label>
                <select
                  defaultValue={user?.reminderTiming ?? "0"}
                  id="profile-reminder"
                  className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-xs focus:border-brand-teal outline-none text-white"
                >
                  <option value={1}>1 Day before deadline</option>
                  <option value={2}>2 Days before deadline (Default)</option>
                  <option value={3}>3 Days before deadline</option>
                  <option value={5}>5 Days before deadline</option>
                </select>
              </div>

              {/* Theme toggle layout class */}
              <div className="space-y-1.5 flex justify-between items-center p-3 rounded-xl bg-neutral-950 border border-neutral-850">
                <div>
                  <label className="text-xs font-bold text-white block">Theme Mode</label>
                  <span className="text-[10px] text-neutral-500">Toggle between Light and Dark interface</span>
                </div>
                <button
                  onClick={() => {
                    const nextTheme = user.theme === 'dark' ? 'light' : 'dark';
                    handleUpdateProfile({
                      name: (document.getElementById('profile-name') as HTMLInputElement).value,
                      email: (document.getElementById('profile-email') as HTMLInputElement).value,
                      theme: nextTheme,
                      reminderTiming: parseInt((document.getElementById('profile-reminder') as HTMLSelectElement).value, 10),
                    });
                  }}
                  className="p-2 border border-neutral-800 rounded bg-neutral-900 text-brand-teal hover:text-white transition"
                >
                  {user.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={() => {
                  handleUpdateProfile({
                    name: (document.getElementById('profile-name') as HTMLInputElement).value,
                    email: (document.getElementById('profile-email') as HTMLInputElement).value,
                    theme: user.theme,
                    reminderTiming: parseInt((document.getElementById('profile-reminder') as HTMLSelectElement).value, 10),
                  });
                }}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white font-semibold text-xs hover:opacity-95 transition"
              >
                Save Settings
              </button>
            </div>

            {/* Monthly Reports (AI 16) */}
            <div className="space-y-3 flex-shrink-0">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-amber" /> Monthly Reports
                </span>
                <button
                  onClick={handleGenerateMonthlyReport}
                  disabled={generatingReport}
                  className="px-3 py-1 rounded-lg bg-brand-amber/10 border border-brand-amber/20 text-brand-amber text-[10px] font-bold uppercase tracking-wider hover:bg-brand-amber/20 transition disabled:opacity-50"
                >
                  {generatingReport ? 'Generating...' : '+ Generate'}
                </button>
              </div>

              {monthlyReports.length === 0 ? (
                <p className="text-[11px] text-neutral-500 italic py-1">
                  No monthly reports yet. Generate your first AI-powered productivity retrospective!
                </p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {monthlyReports.map((report: any) => (
                    <div key={report.id} className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-amber">
                          {report.month ? new Date(report.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Monthly Report'}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-300 leading-relaxed line-clamp-3">{report.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly Debriefs Log */}
            <div className="space-y-3 flex-shrink-0">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-brand-purple" /> Weekly Debriefs
                </span>
                <button
                  onClick={handleGenerateDebrief}
                  disabled={generatingDebrief}
                  className="px-3 py-1 rounded-lg bg-brand-purple/10 border border-brand-purple/20 text-brand-purple-light text-[10px] font-bold uppercase tracking-wider hover:bg-brand-purple/20 transition disabled:opacity-50"
                >
                  {generatingDebrief ? 'Generating...' : '+ Generate'}
                </button>
              </div>

              {debriefs.length === 0 ? (
                <p className="text-[11px] text-neutral-500 italic py-1">
                  No debriefs yet. Generate your Sunday retrospective when ready.
                </p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {debriefs.map((debrief: any) => (
                    <div key={debrief.id} className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-purple-light">
                          Week of {debrief.weekStart ? new Date(debrief.weekStart).toLocaleDateString() : '—'}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {new Date(debrief.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-300 leading-relaxed line-clamp-3">{debrief.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-neutral-800 pt-4 flex-shrink-0">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-lg border border-red-950 hover:bg-red-950/20 text-red-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </AnimatedModal>
      

      {/* ======================================================== */}
      {/* FOCUS BLOCK MODAL (AI 12) */}
      {/* ======================================================== */}
      <AnimatedModal isOpen={showFocusModal} onClose={() => setShowFocusModal(false)} position="center">

          <div
            className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-brand-teal" /> Daily Focus Schedule
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">AI-generated time blocks based on your tasks & habits</p>
              </div>
              <button onClick={() => setShowFocusModal(false)} className="p-1.5 text-neutral-500 hover:text-white rounded-lg hover:bg-neutral-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {focusBlocks.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center italic">No schedule blocks generated yet.</p>
            ) : (
              <div className="space-y-3">
                {focusBlocks.map((block: any, idx: number) => (
                  <div key={idx} className="flex gap-4 p-4 bg-neutral-950 rounded-xl border border-neutral-800 group hover:border-brand-teal/30 transition">
                    <div className="text-right shrink-0 w-20">
                      <span className="text-xs font-bold text-brand-teal block">{block.time}</span>
                      {block.duration && (
                        <span className="text-[10px] text-neutral-500">{block.duration}</span>
                      )}
                    </div>
                    <div className="flex-grow space-y-1">
                      <span className="text-xs font-bold text-white block">{block.task}</span>
                      {block.note && (
                        <span className="text-[11px] text-neutral-400 italic block">{block.note}</span>
                      )}
                      {block.type && (
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block ${
                          block.type === 'deep' ? 'bg-brand-purple/10 text-brand-purple-light border-brand-purple/20' :
                          block.type === 'break' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900' :
                          'bg-brand-teal/10 text-brand-teal border-brand-teal/20'
                        }`}>
                          {block.type}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowFocusModal(false)}
              className="w-full py-2.5 bg-brand-teal text-black font-extrabold text-xs rounded-xl hover:opacity-95 transition"
            >
              Got it, let's focus!
            </button>
          </div>
        </AnimatedModal>
      

      {/* ======================================================== */}
      {/* OVERLAY PANEL 3: ABOUT (PHILOSOPHY & STATS) */}
      {/* ======================================================== */}
      <AnimatedModal isOpen={showAbout} onClose={() => setShowAbout(false)} position="right">

          <div 
            className="w-full max-w-md h-full bg-neutral-900 border-l border-neutral-800 p-6 flex flex-col justify-between text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6 overflow-y-auto flex-grow">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                <h3 className="font-extrabold text-lg text-white flex items-center gap-1.5">
                  <Info className="w-5 h-5 text-brand-purple" /> About Taskflow
                </h3>
                <button onClick={() => setShowAbout(false)} className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Philosophy explainer */}
              <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
                <div>
                  <h4 className="font-bold text-white mb-1">Plan. Reflect. Improve.</h4>
                  <p>
                    Taskflow utilizes a unique reflection layer to record not just what you plan, but what happened. Reflecting on lessons and compromises turns action trackers into long-term growth tools.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-3 rounded-xl border border-neutral-850">
                  <div className="p-2 space-y-0.5">
                    <span className="font-bold text-brand-purple block uppercase text-[8px]">Objective</span>
                    <span className="text-[11px] text-neutral-400">Target target</span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <span className="font-bold text-emerald-400 block uppercase text-[8px]">Result</span>
                    <span className="text-[11px] text-neutral-400">Actual outcome</span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <span className="font-bold text-brand-amber block uppercase text-[8px]">Lesson</span>
                    <span className="text-[11px] text-neutral-400">Growth takeaway</span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <span className="font-bold text-brand-coral block uppercase text-[8px]">Compromise</span>
                    <span className="text-[11px] text-neutral-400">Sacrificed scope</span>
                  </div>
                </div>

                {/* USER PERFORMANCE STATS */}
                <div className="space-y-3 border-t border-neutral-800 pt-4">
                  <h4 className="font-bold text-white flex items-center gap-1">
                    <BarChart2 className="w-4 h-4 text-brand-teal" /> Personal Stats
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-neutral-950 rounded-lg">
                      <span className="block text-lg font-bold text-brand-purple">{projects.filter(p => p.status === 'done').length}</span>
                      <span className="text-[9px] text-neutral-500 uppercase">Projects Done</span>
                    </div>
                    <div className="p-3 bg-neutral-950 rounded-lg">
                      <span className="block text-lg font-bold text-brand-teal">{habits.reduce((acc, h) => acc + h.streak, 0)}</span>
                      <span className="text-[9px] text-neutral-500 uppercase">Total Streaks</span>
                    </div>
                    <div className="p-3 bg-neutral-950 rounded-lg">
                      <span className="block text-lg font-bold text-brand-amber">{notifications.length}</span>
                      <span className="text-[9px] text-neutral-500 uppercase">Alerts Issued</span>
                    </div>
                  </div>
                </div>

                {/* WEEKLY DEBRIEF LIST */}
                <div className="space-y-3 border-t border-neutral-800 pt-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-white flex items-center gap-1">
                      <BarChart2 className="w-4 h-4 text-brand-amber" /> Weekly Sunday Debriefs
                    </h4>
                    <button
                      onClick={handleGenerateDebrief}
                      disabled={generatingDebrief}
                      className="px-2 py-1 bg-brand-amber/15 text-brand-amber text-[10px] rounded font-semibold border border-brand-amber/30 disabled:opacity-50"
                    >
                      {generatingDebrief ? 'Synthesizing...' : 'Generate New'}
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {debriefs.length === 0 ? (
                      <p className="text-[10px] text-neutral-500 italic py-2">No debrief logs yet. Generate one on Sunday!</p>
                    ) : (
                      debriefs.map(deb => (
                        <div key={deb.id} className="p-3 rounded-lg bg-neutral-950 border border-neutral-850 space-y-1.5 text-[11px]">
                          <div className="flex justify-between items-center text-[9px] text-brand-teal uppercase font-bold">
                            <span>Week starting {deb.weekStart}</span>
                            <span className="text-neutral-500">Issued {new Date(deb.generatedAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-neutral-300 leading-normal">
                            {deb.summary}
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] border-t border-neutral-900 pt-1.5 text-neutral-400">
                            <div>
                              <span className="font-semibold text-brand-purple">Top Lesson:</span> {deb.topLesson}
                            </div>
                            <div>
                              <span className="font-semibold text-emerald-400">Top Result:</span> {deb.topResult}
                            </div>
                          </div>
                          <div className="text-[9px] text-neutral-500 pt-1">
                            Completed {deb.tasksCompleted} tasks • Kept {deb.habitsKept} habits • Hit {deb.deadlinesHit} deadlines • Missed {deb.deadlinesMissed} deadlines
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-[10px] text-neutral-500 border-t border-neutral-800 pt-4 text-center">
              Taskflow App Sandbox • Version 1.0.0 • Plan. Reflect. Improve.
            </div>
          </div>
        </AnimatedModal>
      

      {/* ======================================================== */}
      {/* 4. MODALS (CREATE ENTITIES) */}
      {/* ======================================================== */}
      <AnimatedModal isOpen={modalType !== ''} onClose={() => setModalType('')} position="center">

          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5 animate-slide-up text-left">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {modalType === 'new-project' && 'Create New Project'}
                {modalType === 'new-task' && `Add Task to ${selectedProject?.name}`}
                {modalType === 'new-habit' && 'Establish Daily Habit'}
                {modalType === 'new-scheduled' && 'Schedule One-Off Task'}
              </h3>
              <button 
                onClick={() => { setModalType(''); setDeadlineWarning(null); }}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEntity} className="space-y-4">
              {errorForm && (
                <div className="p-3 bg-red-950/20 border border-red-900 rounded text-red-300 text-xs">
                  {errorForm}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Name / Label</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter details..."
                  className="w-full px-3 py-2.5 text-xs rounded bg-neutral-950 border border-neutral-800 focus:border-brand-purple outline-none text-white"
                />
              </div>

              {/* Objective */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Objective (Reflective field)</label>
                <textarea
                  required
                  value={formObjective}
                  onChange={(e) => setFormObjective(e.target.value)}
                  placeholder="What do we want to achieve with this item?"
                  className="w-full px-3 py-2.5 text-xs rounded bg-neutral-950 border border-neutral-800 focus:border-brand-purple outline-none text-white h-16 resize-none"
                />
              </div>

              {/* Deadline inputs */}
              {(modalType === 'new-project' || modalType === 'new-task' || modalType === 'new-scheduled') && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                    {modalType === 'new-scheduled' ? 'Scheduled Date' : 'Deadline (Optional)'}
                  </label>
                  <input
                    type="date"
                    required={modalType === 'new-scheduled'}
                    value={formDeadline}
                    onChange={(e) => handleDeadlineChange(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded bg-neutral-950 border border-neutral-800 focus:border-brand-purple outline-none text-white"
                  />
                  {deadlineWarning && (
                    <span className="text-[10px] text-brand-amber font-semibold block leading-normal pt-1">
                      ⚠️ {deadlineWarning}
                    </span>
                  )}
                </div>
              )}

              {/* Time input (scheduled only) */}
              {modalType === 'new-scheduled' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Time (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded bg-neutral-950 border border-neutral-800 focus:border-brand-purple outline-none text-white"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loadingForm}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-teal text-white font-semibold text-xs hover:opacity-95 transition disabled:opacity-50"
              >
                {loadingForm ? 'Creating item...' : 'Create Item'}
              </button>
            </form>
          </div>
        </AnimatedModal>
      

    </div>
  );
}
