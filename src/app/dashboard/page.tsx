'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, User, Info, Folder, RotateCcw, Calendar as CalendarIcon, Clock, Plus, Trash2, 
  Edit, Brain, Check, X, ChevronLeft, ChevronRight, Sparkles, Sun, Moon, LogOut, 
  Settings, AlertTriangle, Play, CheckCircle, HelpCircle, BarChart2, Palette
} from 'lucide-react';
import { THEMES, applyTheme, getInitialTheme, type ThemeDefinition } from '@/lib/themes';

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

// ============================================================
// THEME SWATCH — shows 3 color dots for a theme
// ============================================================
function ThemeSwatch({ swatches }: { swatches: [string, string, string] }) {
  return (
    <div className="flex gap-1 items-center">
      {swatches.map((color, i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full ring-1 ring-black/10"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

// ============================================================
// THEME SELECTOR GRID — keyboard accessible popover
// ============================================================
interface ThemeSelectorProps {
  currentThemeId: string;
  onSelect: (themeId: string) => void;
  onClose: () => void;
}

function ThemeSelector({ currentThemeId, onSelect, onClose }: ThemeSelectorProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Theme selector"
      className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border p-3 animate-slide-up shadow-xl"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Choose Theme
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg transition"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Close theme selector"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {THEMES.map((theme: ThemeDefinition) => {
          const isActive = theme.id === currentThemeId;
          return (
            <button
              key={theme.id}
              onClick={() => { onSelect(theme.id); onClose(); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition group"
              style={{
                background: isActive ? 'var(--hover-bg)' : 'transparent',
                color: 'var(--text-primary)',
                outline: isActive ? `2px solid var(--focus-ring)` : 'none',
                outlineOffset: '-2px',
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
              aria-pressed={isActive}
            >
              <span className="text-base leading-none" aria-hidden="true">{theme.emoji}</span>
              <span className="flex-grow text-xs font-semibold">{theme.name}</span>
              <ThemeSwatch swatches={theme.swatches} />
              {isActive && (
                <Check className="w-3.5 h-3.5 ml-1 flex-shrink-0" style={{ color: 'var(--primary)' }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  // Active Bottom Tab: "projects" | "habits" | "calendar" | "scheduled"
  const [activeTab, setActiveTab] = useState<'projects' | 'habits' | 'calendar' | 'scheduled'>('projects');

  // Master State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [debriefs, setDebriefs] = useState<WeeklyDebrief[]>([]);

  // Selected Detail views
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [selectedScheduled, setSelectedScheduled] = useState<ScheduledTask | null>(null);

  // Active Overlays
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // Theme state
  const [currentThemeId, setCurrentThemeId] = useState<string>(() => getInitialTheme());

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
  // Diagnostic theme attribute updater
  useEffect(() => {
    const interval = setInterval(() => {
      const el = document.getElementById('debug-theme-attr');
      if (el) {
        const attr = document.documentElement.getAttribute('data-theme') || 'none';
        const classes = document.documentElement.className || 'none';
        el.innerText = `ThemeAttr: ${attr} | Classes: ${classes}`;
      }
    }, 500);
    return () => clearInterval(interval);
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

      // Apply initial theme from user profile (or use what's already applied)
      const savedTheme = localStorage.getItem('theme');
      const themeToApply = savedTheme || userData.user.theme || 'dark';
      applyTheme(themeToApply);
      setCurrentThemeId(themeToApply);

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
      const [projRes, habitRes, schedRes, notifRes, debriefRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/habits'),
        fetch('/api/scheduled'),
        fetch('/api/notifications'),
        fetch('/api/debriefs')
      ]);

      const projs = await projRes.json();
      const habs = await habitRes.json();
      const sched = await schedRes.json();
      const notifs = await notifRes.json();
      const debs = await debriefRes.json();

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

  // Handle theme switch
  const handleThemeSelect = async (themeId: string) => {
    applyTheme(themeId);
    setCurrentThemeId(themeId);

    // Persist to user profile in backend
    if (user) {
      try {
        const res = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: user.name,
            email: user.email,
            theme: themeId,
            reminderTiming: user.reminderTiming,
          }),
        });
        const data = await res.json();
        if (res.ok) setUser(data);
      } catch (e) {
        console.error('Failed persisting theme to profile:', e);
      }
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
        alert(data.error || 'Failed updating profile');
        return;
      }
      setUser(data);
      alert('Settings updated successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed updating profile settings');
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
      alert(err.message);
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
      alert('Failed to delete item.');
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
      if (!res.ok) {
        let message = 'Prioritization failed';
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // ignore json parse errors
        }
        throw new Error(message);
      }
      await refreshAllData();
      alert('AI task prioritization complete! Tasks have been reordered and AI priority badges applied.');
    } catch (e) {
      console.error(e);
      alert(`AI prioritize failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
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
      alert('Weekly Debrief generated successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed generating debrief');
    } finally {
      setGeneratingDebrief(false);
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
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <Sparkles className="w-12 h-12 text-brand-purple animate-pulse mb-4" />
        <p className="text-sm font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Loading Taskflow...</p>
      </div>
    );
  }

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // ──────────────────────────────────────────────
  // Inline style helpers for themed Tailwind classes
  // that would otherwise be hardcoded neutrals
  // ──────────────────────────────────────────────
  const S = {
    // Surfaces
    bgBase: { background: 'var(--bg-base)' },
    surface: { background: 'var(--surface)' },
    surfaceElevated: { background: 'var(--surface-elevated)' },
    // Text
    textPrimary: { color: 'var(--text-primary)' },
    textSecondary: { color: 'var(--text-secondary)' },
    textMuted: { color: 'var(--text-muted)' },
    // Borders
    border: { borderColor: 'var(--border)' },
    borderSubtle: { borderColor: 'var(--border-subtle)' },
    // Cards with border
    card: { background: 'var(--surface)', borderColor: 'var(--border)' },
    cardElevated: { background: 'var(--surface-elevated)', borderColor: 'var(--border)' },
    // Panel (overlay panels)
    panel: { background: 'var(--surface)', borderColor: 'var(--border)' },
    // Input
    input: { background: 'var(--surface-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' },
    // Overlay backdrop
    overlay: { background: 'var(--overlay)' },
  };

  return (
    <div
      className="flex-grow flex flex-col max-w-5xl mx-auto w-full min-h-screen relative pb-24 shadow-2xl"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* 1. TOP BAR */}
      <header
        className="sticky top-0 z-30 h-16 border-b flex items-center justify-between px-6"
        style={{
          borderColor: 'var(--border)',
          background: 'color-mix(in srgb, var(--bg-base) 80%, transparent)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedProject(null); setSelectedHabit(null); setSelectedScheduled(null); }}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-purple to-brand-teal flex items-center justify-center font-bold text-white shadow-md shadow-purple-500/20">
            T
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Taskflow
          </span>
          <span className="text-[10px] text-red-500 font-mono px-2 py-0.5 rounded border border-red-500/30" id="debug-theme-attr">
            ThemeAttr: Loading
          </span>
        </div>

        {/* Actions header */}
        <div className="flex items-center gap-3">
          {/* Theme Picker Button */}
          <div className="relative">
            <button
              onClick={() => setShowThemeSelector(prev => !prev)}
              className="p-2 rounded-lg transition flex items-center gap-1.5"
              style={{ color: 'var(--text-muted)' }}
              title={`Theme: ${currentThemeId}`}
              aria-label="Open theme selector"
              aria-expanded={showThemeSelector}
              aria-haspopup="dialog"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
            >
              <Palette className="w-5 h-5" />
            </button>
            {showThemeSelector && (
              <ThemeSelector
                currentThemeId={currentThemeId}
                onSelect={handleThemeSelect}
                onClose={() => setShowThemeSelector(false)}
              />
            )}
          </div>

          <button
            onClick={() => setShowAbout(true)}
            className="p-2 rounded-lg transition"
            style={{ color: 'var(--text-muted)' }}
            title="About Taskflow"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
          >
            <Info className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowNotifications(true)}
            className="p-2 rounded-lg transition relative"
            style={{ color: 'var(--text-muted)' }}
            title="Notifications"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
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
            className="w-8 h-8 rounded-full border flex items-center justify-center font-semibold text-xs tracking-wider uppercase hover:scale-105 transition"
            style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border)', color: 'var(--secondary)' }}
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
          <section
            className="glass p-5 rounded-2xl border shadow-xl flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="absolute top-0 right-0 w-[40%] h-[100%] bg-brand-amber/5 blur-[60px] pointer-events-none" />
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-amber/15 text-brand-amber text-[10px] font-bold uppercase tracking-wider">
                <Brain className="w-3.5 h-3.5" /> AI Productivity Coach
              </div>
              {aiBestAction ? (
                <div>
                  <h3 className="text-base font-bold mb-1 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <Sparkles className="w-4 h-4 text-brand-amber" />
                    {aiBestAction.name}
                  </h3>
                  <p className="text-xs leading-relaxed mb-1" style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-semibold text-brand-teal">Reason:</span> {aiBestAction.reason}
                  </p>
                  <p className="text-[11px] italic" style={{ color: 'var(--text-muted)' }}>
                    {aiBestAction.explanation}
                  </p>
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Loading your customized AI advice widget...</p>
              )}
            </div>

            <div className="flex flex-col gap-2 shrink-0 md:justify-center">
              <button
                onClick={fetchAiRecommendations}
                disabled={loadingAi}
                className="px-4 py-2 text-xs font-semibold rounded-lg border transition disabled:opacity-50"
                style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-elevated)'; }}
              >
                {loadingAi ? 'Calculating...' : 'Recalculate Focus'}
              </button>
              <button
                onClick={() => {
                  alert(`Today's Top 3 Planned Actions:\n\n` + 
                    aiActions.map((a, i) => `${i+1}. ${a.name} (${a.estimate})\n   Reason: ${a.reason}`).join('\n\n')
                  );
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-brand-amber to-brand-coral text-white transition hover:opacity-95"
              >
                Show Today's Top 3
              </button>
            </div>
          </section>
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
                    <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Active Projects</h2>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Establish objectives and analyze lessons learned</p>
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
                      className="glass p-5 rounded-xl border flex flex-col justify-between h-44 transition group cursor-pointer"
                      style={{ borderColor: 'var(--border)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,85,247,0.3)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            project.status === 'done' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50' :
                            project.status === 'in progress' ? 'bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30' :
                            'border'
                          }`}
                            style={project.status !== 'done' && project.status !== 'in progress' ? { background: 'var(--surface-elevated)', color: 'var(--text-muted)', borderColor: 'var(--border)' } : {}}
                          >
                            {project.status}
                          </span>
                          {project.deadline && (
                            <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                              <CalendarIcon className="w-3 h-3" />
                              {new Date(project.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-base group-hover:text-brand-purple-light transition" style={{ color: 'var(--text-primary)' }}>
                          {project.name}
                        </h3>
                        <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {project.objective || 'No objective set yet. Add reflection.'}
                        </p>
                      </div>

                      <div className="text-[11px] pt-2 border-t flex justify-between items-center" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
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
                <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                  <button
                    onClick={() => { setSelectedProject(null); setSelectedTask(null); }}
                    className="text-xs font-semibold flex items-center gap-1 transition hover:text-brand-purple-light"
                    style={{ color: 'var(--text-secondary)' }}
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
                      className="p-1.5 rounded-lg border border-red-950/70 text-red-400 hover:bg-red-950/40 transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Project Header details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedProject.name}</h2>
                    <select
                      value={selectedProject.status}
                      onChange={(e) => handleSaveReflections('project', selectedProject.id, { status: e.target.value })}
                      className="text-xs rounded border px-2 py-1 outline-none"
                      style={{ ...S.input }}
                    >
                      <option value="planning">planning</option>
                      <option value="in progress">in progress</option>
                      <option value="done">done</option>
                    </select>
                  </div>
                  {selectedProject.deadline && (
                    <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <CalendarIcon className="w-3.5 h-3.5 text-brand-purple" />
                      Deadline: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{new Date(selectedProject.deadline).toLocaleDateString()}</span> (purple calendar dot)
                    </p>
                  )}
                </div>

                {/* 4 REFLECTIVE FIELDS FOR PROJECT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Objective */}
                  <div className="p-4 rounded-xl border space-y-1.5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-purple flex items-center gap-1">
                      <Folder className="w-3 h-3" /> Objective — what we want to achieve
                    </label>
                    <textarea
                      defaultValue={selectedProject.objective}
                      onBlur={(e) => handleSaveReflections('project', selectedProject.id, { objective: e.target.value })}
                      placeholder="Add target project goal..."
                      className="w-full text-xs bg-transparent border-0 resize-none focus:ring-0 outline-none h-16 leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    />
                  </div>

                  {/* Result */}
                  <div className="p-4 rounded-xl border space-y-1.5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Result — what we actually accomplished
                    </label>
                    <textarea
                      defaultValue={selectedProject.result}
                      onBlur={(e) => handleSaveReflections('project', selectedProject.id, { result: e.target.value })}
                      placeholder="Log final project outcome..."
                      className="w-full text-xs bg-transparent border-0 resize-none focus:ring-0 outline-none h-16 leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    />
                  </div>

                  {/* Lesson */}
                  <div className="p-4 rounded-xl border space-y-1.5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-amber flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Lesson — what we learned from it
                    </label>
                    <textarea
                      defaultValue={selectedProject.lesson}
                      onBlur={(e) => handleSaveReflections('project', selectedProject.id, { lesson: e.target.value })}
                      placeholder="Spot learnings and growth patterns..."
                      className="w-full text-xs bg-transparent border-0 resize-none focus:ring-0 outline-none h-16 leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    />
                  </div>

                  {/* Compromise */}
                  <div className="p-4 rounded-xl border space-y-1.5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
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
                      className="w-full text-xs bg-transparent border-0 resize-none focus:ring-0 outline-none h-16 leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    />
                    {compromiseWarning && (
                      <span className="text-[10px] text-brand-amber font-semibold block pt-1 leading-normal border-t" style={{ borderColor: 'var(--border)' }}>
                        ⚠️ {compromiseWarning}
                      </span>
                    )}
                  </div>
                </div>

                {/* PROJECT NESTED TASKS */}
                <div className="border-t pt-6 space-y-4" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Project Tasks</h3>
                    <button
                      onClick={() => setModalType('new-task')}
                      className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Task
                    </button>
                  </div>

                  {/* Tasks Table/List */}
                  <div className="space-y-2">
                    {selectedProject.tasks.length === 0 ? (
                      <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>No tasks inside this project yet. Use AI prioritizer after adding tasks.</p>
                    ) : (
                      selectedProject.tasks.map(task => (
                        <div
                          key={task.id}
                          className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition cursor-pointer`}
                          style={{
                            borderColor: selectedTask?.id === task.id ? 'var(--primary)' : 'var(--border)',
                            background: selectedTask?.id === task.id ? 'color-mix(in srgb, var(--primary) 8%, var(--surface))' : 'transparent',
                          }}
                          onClick={() => setSelectedTask(task)}
                          onMouseEnter={(e) => {
                            if (selectedTask?.id !== task.id) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
                          }}
                          onMouseLeave={(e) => {
                            if (selectedTask?.id !== task.id) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                          }}
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
                                  task.status === 'done' ? 'bg-brand-purple border-brand-purple text-white' : ''
                                }`}
                                style={task.status !== 'done' ? { borderColor: 'var(--border)' } : {}}
                              >
                                {task.status === 'done' && <Check className="w-3.5 h-3.5" />}
                              </button>
                              
                              <span className={`font-bold text-sm ${task.status === 'done' ? 'line-through' : ''}`}
                                style={{ color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                                {task.name}
                              </span>

                              {/* AI priority badges */}
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                                task.priority === 'high' ? 'bg-red-950/60 text-red-400 border border-red-900/50' :
                                task.priority === 'medium' ? 'bg-amber-950/60 text-brand-amber border border-amber-900/50' :
                                'border'
                              }`}
                                style={task.priority !== 'high' && task.priority !== 'medium' ? { background: 'var(--surface-elevated)', color: 'var(--text-muted)', borderColor: 'var(--border)' } : {}}
                              >
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
                            <ChevronRight className={`w-4 h-4 transition-transform ${selectedTask?.id === task.id ? 'rotate-90' : ''}`}
                              style={{ color: 'var(--text-muted)' }} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* TASK DETAIL RETRO DRAWER (visible if selected) */}
                {selectedTask && (
                  <div className="border p-5 rounded-2xl space-y-4 animate-slide-up" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 50%, transparent)' }}>
                    <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                      <div>
                        <h4 className="text-xs text-brand-coral font-bold uppercase tracking-wider">Active Task Audit</h4>
                        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{selectedTask.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteEntity('task', selectedTask.id)}
                          className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 border border-red-950/70 rounded-lg"
                        >
                          Delete Task
                        </button>
                        <button onClick={() => setSelectedTask(null)} className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition" style={{ color: 'var(--text-muted)' }}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Task objective */}
                      <div className="space-y-1 p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                        <span className="text-[9px] font-bold uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>Objective</span>
                        <textarea
                          defaultValue={selectedTask.objective}
                          onBlur={(e) => handleSaveReflections('task', selectedTask.id, { objective: e.target.value })}
                          placeholder="Log task target..."
                          className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 h-12"
                          style={{ color: 'var(--text-secondary)' }}
                        />
                      </div>

                      {/* Task result */}
                      <div className="space-y-1 p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                        <span className="text-[9px] font-bold uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>Result</span>
                        <textarea
                          defaultValue={selectedTask.result}
                          onBlur={(e) => handleSaveReflections('task', selectedTask.id, { result: e.target.value })}
                          placeholder="Log completed result..."
                          className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 h-12"
                          style={{ color: 'var(--text-secondary)' }}
                        />
                      </div>

                      {/* Task lesson */}
                      <div className="space-y-1 p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                        <span className="text-[9px] font-bold uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>Lesson</span>
                        <textarea
                          defaultValue={selectedTask.lesson}
                          onBlur={(e) => handleSaveReflections('task', selectedTask.id, { lesson: e.target.value })}
                          placeholder="Log learnings..."
                          className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 h-12"
                          style={{ color: 'var(--text-secondary)' }}
                        />
                      </div>

                      {/* Task compromise */}
                      <div className="space-y-1 p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                        <span className="text-[9px] font-bold uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>Compromise</span>
                        <textarea
                          defaultValue={selectedTask.compromise}
                          onBlur={(e) => {
                            handleSaveReflections('task', selectedTask.id, { compromise: e.target.value });
                            handleCompromiseBlur(e.target.value);
                          }}
                          placeholder="Log sacrifice..."
                          className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 h-12"
                          style={{ color: 'var(--text-secondary)' }}
                        />
                        {compromiseWarning && (
                          <span className="text-[9px] text-brand-amber font-semibold block pt-1 border-t leading-normal" style={{ borderColor: 'var(--border)' }}>
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
                <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Daily Habits</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Lock streaks and build behavioral feedback loops</p>
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
                  <p className="text-xs py-6 text-center" style={{ color: 'var(--text-muted)' }}>No habits established yet. Create one above.</p>
                ) : (
                  habits.map(habit => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isCheckedToday = habit.checkIns.some(c => c.date === todayStr);

                    return (
                      <div
                        key={habit.id}
                        onClick={() => setSelectedHabit(habit)}
                        className={`p-4 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition`}
                        style={{
                          borderColor: selectedHabit?.id === habit.id ? 'var(--secondary)' : 'var(--border)',
                          background: selectedHabit?.id === habit.id ? 'color-mix(in srgb, var(--secondary) 8%, var(--surface))' : 'transparent',
                        }}
                      >
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{habit.name}</h3>
                          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
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
                              : ''
                          }`}
                          style={!isCheckedToday ? { borderColor: 'var(--border)', background: 'var(--surface-elevated)', color: 'var(--text-secondary)' } : {}}
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
              <div className="glass p-5 rounded-2xl border min-h-64 flex flex-col justify-between" style={{ borderColor: 'var(--border)' }}>
                {selectedHabit ? (
                  <div className="space-y-4 animate-slide-up flex-grow flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                        <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{selectedHabit.name}</h3>
                        <button
                          onClick={() => handleDeleteEntity('habit', selectedHabit.id)}
                          className="text-[10px] font-semibold text-red-400 hover:text-red-300 border border-red-950/70 px-2 py-1 rounded"
                        >
                          Delete Habit
                        </button>
                      </div>

                      {/* Streaks details */}
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Streaks resets to zero if daily check-in is missed. Keep logging objectives and lessons.
                      </p>

                      <div className="grid grid-cols-1 gap-3 text-xs">
                        <div className="space-y-1 p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                          <label className="text-[9px] font-bold text-brand-teal uppercase tracking-widest block">Objective</label>
                          <textarea
                            defaultValue={selectedHabit.objective}
                            onBlur={(e) => handleSaveReflections('habit', selectedHabit.id, { objective: e.target.value })}
                            placeholder="Add habit objective..."
                            className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 h-10"
                            style={{ color: 'var(--text-secondary)' }}
                          />
                        </div>

                        <div className="space-y-1 p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                          <label className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">Result</label>
                          <textarea
                            defaultValue={selectedHabit.result}
                            onBlur={(e) => handleSaveReflections('habit', selectedHabit.id, { result: e.target.value })}
                            placeholder="Add habit result..."
                            className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 h-10"
                            style={{ color: 'var(--text-secondary)' }}
                          />
                        </div>

                        <div className="space-y-1 p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                          <label className="text-[9px] font-bold text-brand-amber uppercase tracking-widest block">Lesson</label>
                          <textarea
                            defaultValue={selectedHabit.lesson}
                            onBlur={(e) => handleSaveReflections('habit', selectedHabit.id, { lesson: e.target.value })}
                            placeholder="Add habit lesson..."
                            className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 h-10"
                            style={{ color: 'var(--text-secondary)' }}
                          />
                        </div>

                        <div className="space-y-1 p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                          <label className="text-[9px] font-bold text-brand-coral uppercase tracking-widest block">Compromise</label>
                          <textarea
                            defaultValue={selectedHabit.compromise}
                            onBlur={(e) => {
                              handleSaveReflections('habit', selectedHabit.id, { compromise: e.target.value });
                              handleCompromiseBlur(e.target.value);
                            }}
                            placeholder="Add habit compromise..."
                            className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 h-10"
                            style={{ color: 'var(--text-secondary)' }}
                          />
                          {compromiseWarning && (
                            <span className="text-[9px] text-brand-amber font-semibold block pt-1 border-t leading-normal" style={{ borderColor: 'var(--border)' }}>
                              ⚠️ {compromiseWarning}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-20" style={{ color: 'var(--text-muted)' }}>
                    <CalendarIcon className="w-10 h-10 mb-2 animate-bounce" style={{ color: 'var(--border)' }} />
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
              <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Task &amp; Deadline Calendar</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Color-coded deadlines: Purple (Projects), Coral (Tasks), Teal (Scheduled)</p>
            </div>

            {/* MONTH SWITCHER GRID */}
            <div className="glass p-5 rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  {currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex items-center gap-1">
                  <button onClick={() => changeMonth(-1)} className="p-2 border rounded-lg transition" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                  >
                    <ChevronLeft className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
                  </button>
                  <button onClick={() => changeMonth(1)} className="p-2 border rounded-lg transition" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                  >
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
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
                      className="aspect-square p-2 border flex flex-col justify-between items-center rounded-xl cursor-pointer relative hover:scale-105 active:scale-98 transition duration-150"
                      style={{
                        borderColor: isSelected ? 'var(--primary)' : isToday ? 'var(--secondary)' : 'var(--border)',
                        background: isSelected
                          ? 'color-mix(in srgb, var(--primary) 8%, var(--surface))'
                          : isToday
                            ? 'color-mix(in srgb, var(--secondary) 8%, var(--surface))'
                            : 'color-mix(in srgb, var(--surface) 40%, transparent)',
                      }}
                    >
                      <span className="text-xs font-bold" style={{ color: isToday ? 'var(--secondary)' : 'var(--text-secondary)' }}>
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
            <div className="glass p-5 rounded-2xl border space-y-4" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-bold text-sm border-b pb-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                Due on {new Date(selectedCalendarDayStr).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>

              {(() => {
                const { projects: dueP, tasks: dueT, scheduled: dueS } = getDueItemsForSelectedDay();

                if (dueP.length === 0 && dueT.length === 0 && dueS.length === 0) {
                  return <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>No deadlines scheduled for this day.</p>;
                }

                return (
                  <div className="space-y-3">
                    {/* Projects (Purple) */}
                    {dueP.map(p => (
                      <div key={p.id} className="p-3 rounded-lg bg-purple-950/20 border border-brand-purple/20 flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-brand-purple-light uppercase tracking-wider block">Project Deadline</span>
                          <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
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
                          <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{t.name}</span>
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
                          <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
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
                <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>One-Off Scheduled Tasks</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Chronological checklist of non-project appointments and duties</p>
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
                  <p className="text-xs py-6 text-center" style={{ color: 'var(--text-muted)' }}>No scheduled items. Create one above.</p>
                ) : (
                  scheduledTasks.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedScheduled(item)}
                      className="p-4 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition"
                      style={{
                        borderColor: selectedScheduled?.id === item.id ? 'var(--secondary)' : 'var(--border)',
                        background: selectedScheduled?.id === item.id ? 'color-mix(in srgb, var(--secondary) 8%, var(--surface))' : 'transparent',
                      }}
                    >
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{item.name}</h3>
                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                          <span className="text-brand-teal">{item.date}</span>
                          <span>at</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{item.time}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  ))
                )}
              </div>

              {/* Reflections block for scheduled item */}
              <div className="glass p-5 rounded-2xl border min-h-64 flex flex-col justify-between" style={{ borderColor: 'var(--border)' }}>
                {selectedScheduled ? (
                  <div className="space-y-4 animate-slide-up flex-grow flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                        <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{selectedScheduled.name}</h3>
                        <button
                          onClick={() => handleDeleteEntity('scheduled', selectedScheduled.id)}
                          className="text-[10px] font-semibold text-red-400 hover:text-red-300 border border-red-950/70 px-2 py-1 rounded"
                        >
                          Delete Task
                        </button>
                      </div>

                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Date: <span style={{ color: 'var(--text-primary)' }}>{selectedScheduled.date}</span> at <span style={{ color: 'var(--text-primary)' }}>{selectedScheduled.time}</span> (Teal calendar dot)
                      </p>

                      <div className="grid grid-cols-1 gap-3 text-xs">
                        <div className="space-y-1 p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                          <label className="text-[9px] font-bold text-brand-teal uppercase tracking-widest block">Objective</label>
                          <textarea
                            defaultValue={selectedScheduled.objective}
                            onBlur={(e) => handleSaveReflections('scheduled', selectedScheduled.id, { objective: e.target.value })}
                            placeholder="Add objective reflections..."
                            className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 h-10"
                            style={{ color: 'var(--text-secondary)' }}
                          />
                        </div>

                        <div className="space-y-1 p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                          <label className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">Result</label>
                          <textarea
                            defaultValue={selectedScheduled.result}
                            onBlur={(e) => handleSaveReflections('scheduled', selectedScheduled.id, { result: e.target.value })}
                            placeholder="Add result reflections..."
                            className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 h-10"
                            style={{ color: 'var(--text-secondary)' }}
                          />
                        </div>

                        <div className="space-y-1 p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                          <label className="text-[9px] font-bold text-brand-amber uppercase tracking-widest block">Lesson</label>
                          <textarea
                            defaultValue={selectedScheduled.lesson}
                            onBlur={(e) => handleSaveReflections('scheduled', selectedScheduled.id, { lesson: e.target.value })}
                            placeholder="Add lesson reflections..."
                            className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 h-10"
                            style={{ color: 'var(--text-secondary)' }}
                          />
                        </div>

                        <div className="space-y-1 p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                          <label className="text-[9px] font-bold text-brand-coral uppercase tracking-widest block">Compromise</label>
                          <textarea
                            defaultValue={selectedScheduled.compromise}
                            onBlur={(e) => {
                              handleSaveReflections('scheduled', selectedScheduled.id, { compromise: e.target.value });
                              handleCompromiseBlur(e.target.value);
                            }}
                            placeholder="Add compromise reflections..."
                            className="w-full bg-transparent border-0 outline-none resize-none focus:ring-0 h-10"
                            style={{ color: 'var(--text-secondary)' }}
                          />
                          {compromiseWarning && (
                            <span className="text-[9px] text-brand-amber font-semibold block pt-1 border-t leading-normal" style={{ borderColor: 'var(--border)' }}>
                              ⚠️ {compromiseWarning}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-20" style={{ color: 'var(--text-muted)' }}>
                    <Clock className="w-10 h-10 mb-2 animate-pulse" style={{ color: 'var(--border)' }} />
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
      <footer
        className="fixed bottom-0 left-0 right-0 z-20 max-w-5xl mx-auto w-full border-t px-6 py-3 flex justify-around items-center"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-base)' }}
      >
        {/* Tab 1 - Projects */}
        <button
          onClick={() => setActiveTab('projects')}
          className="flex flex-col items-center gap-1.5 transition"
          style={{ color: activeTab === 'projects' ? 'var(--primary)' : 'var(--text-muted)' }}
        >
          <Folder className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wide uppercase">Projects</span>
        </button>

        {/* Tab 2 - Habits */}
        <button
          onClick={() => setActiveTab('habits')}
          className="flex flex-col items-center gap-1.5 transition"
          style={{ color: activeTab === 'habits' ? 'var(--secondary)' : 'var(--text-muted)' }}
        >
          <RotateCcw className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wide uppercase">Habits</span>
        </button>

        {/* Tab 3 - Calendar */}
        <button
          onClick={() => setActiveTab('calendar')}
          className="flex flex-col items-center gap-1.5 transition"
          style={{ color: activeTab === 'calendar' ? 'var(--primary)' : 'var(--text-muted)' }}
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wide uppercase">Calendar</span>
        </button>

        {/* Tab 4 - Scheduled */}
        <button
          onClick={() => setActiveTab('scheduled')}
          className="flex flex-col items-center gap-1.5 transition"
          style={{ color: activeTab === 'scheduled' ? 'var(--secondary)' : 'var(--text-muted)' }}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wide uppercase">Scheduled</span>
        </button>
      </footer>

      {/* ======================================================== */}
      {/* OVERLAY PANEL 1: NOTIFICATIONS FEED */}
      {/* ======================================================== */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: 'var(--overlay)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowNotifications(false)}
        >
          <div
            className="w-full max-w-md h-full border-l p-6 flex flex-col justify-between text-left animate-slide-up"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6 overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <h3 className="font-extrabold text-lg flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <Bell className="w-5 h-5 text-brand-amber" /> Notifications Center
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkNotificationsRead()}
                    className="text-[10px] font-semibold text-brand-amber hover:underline"
                  >
                    Clear All Read
                  </button>
                  <button onClick={() => setShowNotifications(false)} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-xs py-10 text-center" style={{ color: 'var(--text-muted)' }}>No active notifications. Check deadlines on calendar tab.</p>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className="p-4 rounded-xl border cursor-pointer transition"
                      style={{
                        borderColor: notif.read ? 'var(--border)' : 'var(--accent)',
                        background: notif.read ? 'color-mix(in srgb, var(--surface) 50%, transparent)' : 'color-mix(in srgb, var(--accent) 5%, var(--surface))',
                        opacity: notif.read ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)'; }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = notif.read
                          ? 'color-mix(in srgb, var(--surface) 50%, transparent)'
                          : 'color-mix(in srgb, var(--accent) 5%, var(--surface))';
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider ${
                          notif.type === 'deadline_project' ? 'text-brand-purple' :
                          notif.type === 'deadline_task' ? 'text-brand-coral' : 'text-brand-teal'
                        }`}>
                          {notif.title}
                        </span>
                        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs leading-normal mb-2" style={{ color: 'var(--text-secondary)' }}>
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
        </div>
      )}

      {/* ======================================================== */}
      {/* OVERLAY PANEL 2: PROFILE & SETTINGS */}
      {/* ======================================================== */}
      {showProfile && user && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: 'var(--overlay)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowProfile(false)}
        >
          <div
            className="w-full max-w-md h-full border-l p-6 flex flex-col justify-between text-left"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6 overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <h3 className="font-extrabold text-lg flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <Settings className="w-5 h-5 text-brand-teal" /> Profile &amp; Settings
                </h3>
                <button onClick={() => setShowProfile(false)} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User details */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                  <input
                    type="text"
                    defaultValue={user.name}
                    id="profile-name"
                    placeholder="Enter name"
                    className="w-full px-3 py-2 rounded border text-xs outline-none focus:ring-1"
                    style={{ ...S.input, ['--tw-ring-color' as any]: 'var(--focus-ring)' }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>Email Address</label>
                  <input
                    type="email"
                    defaultValue={user.email}
                    id="profile-email"
                    placeholder="Enter email"
                    className="w-full px-3 py-2 rounded border text-xs outline-none"
                    style={S.input}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>Reminder Window</label>
                  <select
                    defaultValue={user.reminderTiming}
                    id="profile-reminder"
                    className="w-full px-3 py-2 rounded border text-xs outline-none"
                    style={S.input}
                  >
                    <option value={1}>1 Day before deadline</option>
                    <option value={2}>2 Days before deadline (Default)</option>
                    <option value={3}>3 Days before deadline</option>
                    <option value={5}>5 Days before deadline</option>
                  </select>
                </div>

                {/* ── THEME SELECTOR in Profile panel ── */}
                <div className="space-y-3 p-4 rounded-xl border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Palette className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>App Theme</span>
                  </div>
                  <p className="text-[10px] mb-3" style={{ color: 'var(--text-muted)' }}>
                    Choose your preferred visual style. Changes apply instantly.
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {THEMES.map((theme: ThemeDefinition) => {
                      const isActive = theme.id === currentThemeId;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => handleThemeSelect(theme.id)}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition"
                          style={{
                            background: isActive ? 'color-mix(in srgb, var(--primary) 12%, var(--surface))' : 'var(--surface)',
                            color: 'var(--text-primary)',
                            border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
                          }}
                          aria-pressed={isActive}
                        >
                          <span className="text-base leading-none">{theme.emoji}</span>
                          <span className="flex-grow text-xs font-semibold">{theme.name}</span>
                          <ThemeSwatch swatches={theme.swatches} />
                          {isActive && (
                            <Check className="w-3.5 h-3.5 ml-1 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleUpdateProfile({
                      name: (document.getElementById('profile-name') as HTMLInputElement).value,
                      email: (document.getElementById('profile-email') as HTMLInputElement).value,
                      theme: currentThemeId,
                      reminderTiming: parseInt((document.getElementById('profile-reminder') as HTMLSelectElement).value, 10),
                    });
                  }}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white font-semibold text-xs hover:opacity-95 transition"
                >
                  Save Settings
                </button>
              </div>
            </div>

            <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-lg border border-red-950/70 hover:bg-red-950/20 text-red-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* OVERLAY PANEL 3: ABOUT (PHILOSOPHY & STATS) */}
      {/* ======================================================== */}
      {showAbout && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: 'var(--overlay)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowAbout(false)}
        >
          <div
            className="w-full max-w-md h-full border-l p-6 flex flex-col justify-between text-left"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6 overflow-y-auto flex-grow">
              <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <h3 className="font-extrabold text-lg flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <Info className="w-5 h-5 text-brand-purple" /> About Taskflow
                </h3>
                <button onClick={() => setShowAbout(false)} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Philosophy explainer */}
              <div className="space-y-4 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <div>
                  <h4 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Plan. Reflect. Improve.</h4>
                  <p>
                    Taskflow utilizes a unique reflection layer to record not just what you plan, but what happened. Reflecting on lessons and compromises turns action trackers into long-term growth tools.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border)' }}>
                  <div className="p-2 space-y-0.5">
                    <span className="font-bold text-brand-purple block uppercase text-[8px]">Objective</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Target target</span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <span className="font-bold text-emerald-400 block uppercase text-[8px]">Result</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Actual outcome</span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <span className="font-bold text-brand-amber block uppercase text-[8px]">Lesson</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Growth takeaway</span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <span className="font-bold text-brand-coral block uppercase text-[8px]">Compromise</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Sacrificed scope</span>
                  </div>
                </div>

                {/* USER PERFORMANCE STATS */}
                <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                  <h4 className="font-bold flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                    <BarChart2 className="w-4 h-4 text-brand-teal" /> Personal Stats
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-lg" style={{ background: 'var(--surface-elevated)' }}>
                      <span className="block text-lg font-bold text-brand-purple">{projects.filter(p => p.status === 'done').length}</span>
                      <span className="text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>Projects Done</span>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: 'var(--surface-elevated)' }}>
                      <span className="block text-lg font-bold text-brand-teal">{habits.reduce((acc, h) => acc + h.streak, 0)}</span>
                      <span className="text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>Total Streaks</span>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: 'var(--surface-elevated)' }}>
                      <span className="block text-lg font-bold text-brand-amber">{notifications.length}</span>
                      <span className="text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>Alerts Issued</span>
                    </div>
                  </div>
                </div>

                {/* WEEKLY DEBRIEF LIST */}
                <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
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
                      <p className="text-[10px] italic py-2" style={{ color: 'var(--text-muted)' }}>No debrief logs yet. Generate one on Sunday!</p>
                    ) : (
                      debriefs.map(deb => (
                        <div key={deb.id} className="p-3 rounded-lg border space-y-1.5 text-[11px]" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border)' }}>
                          <div className="flex justify-between items-center text-[9px] text-brand-teal uppercase font-bold">
                            <span>Week starting {deb.weekStart}</span>
                            <span style={{ color: 'var(--text-muted)' }}>Issued {new Date(deb.generatedAt).toLocaleDateString()}</span>
                          </div>
                          <p className="leading-normal" style={{ color: 'var(--text-secondary)' }}>
                            {deb.summary}
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] border-t pt-1.5" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                            <div>
                              <span className="font-semibold text-brand-purple">Top Lesson:</span> {deb.topLesson}
                            </div>
                            <div>
                              <span className="font-semibold text-emerald-400">Top Result:</span> {deb.topResult}
                            </div>
                          </div>
                          <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                            Completed {deb.tasksCompleted} tasks • Kept {deb.habitsKept} habits • Hit {deb.deadlinesHit} deadlines • Missed {deb.deadlinesMissed} deadlines
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-[10px] border-t pt-4 text-center" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
              Taskflow App Sandbox • Version 1.0.0 • Plan. Reflect. Improve.
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODALS (CREATE ENTITIES) */}
      {/* ======================================================== */}
      {modalType !== '' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'var(--overlay)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-md border rounded-2xl p-6 space-y-5 animate-slide-up text-left"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                {modalType === 'new-project' && 'Create New Project'}
                {modalType === 'new-task' && `Add Task to ${selectedProject?.name}`}
                {modalType === 'new-habit' && 'Establish Daily Habit'}
                {modalType === 'new-scheduled' && 'Schedule One-Off Task'}
              </h3>
              <button
                onClick={() => { setModalType(''); setDeadlineWarning(null); }}
                className="p-1 rounded-lg transition"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEntity} className="space-y-4">
              {errorForm && (
                <div className="p-3 bg-red-950/20 border border-red-900/60 rounded text-red-300 text-xs">
                  {errorForm}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>Name / Label</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter details..."
                  className="w-full px-3 py-2.5 text-xs rounded border outline-none"
                  style={S.input}
                />
              </div>

              {/* Objective */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>Objective (Reflective field)</label>
                <textarea
                  required
                  value={formObjective}
                  onChange={(e) => setFormObjective(e.target.value)}
                  placeholder="What do we want to achieve with this item?"
                  className="w-full px-3 py-2.5 text-xs rounded border outline-none h-16 resize-none"
                  style={S.input}
                />
              </div>

              {/* Deadline inputs */}
              {(modalType === 'new-project' || modalType === 'new-task' || modalType === 'new-scheduled') && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>
                    {modalType === 'new-scheduled' ? 'Scheduled Date' : 'Deadline (Optional)'}
                  </label>
                  <input
                    type="date"
                    required={modalType === 'new-scheduled'}
                    value={formDeadline}
                    onChange={(e) => handleDeadlineChange(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded border outline-none"
                    style={S.input}
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
                  <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>Time (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded border outline-none"
                    style={S.input}
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
        </div>
      )}

    </div>
  );
}
