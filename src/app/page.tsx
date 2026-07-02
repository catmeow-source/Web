import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { ArrowRight, Brain, Target, Award, ListTodo, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getSessionUser();

  // If already authenticated, redirect straight to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-100 overflow-x-hidden relative">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-900/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-purple to-brand-teal flex items-center justify-center font-bold text-white shadow-md shadow-purple-500/20">
              T
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-50 to-neutral-200">
              Taskflow
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-neutral-400 hover:text-white transition">
              Sign In
            </Link>
            <Link 
              href="/login?signup=true" 
              className="text-sm font-medium px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 transition font-semibold"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-900/50 text-neutral-300 text-xs font-medium mb-8 hover:bg-neutral-900 transition cursor-default">
          <Sparkles className="w-3.5 h-3.5 text-brand-amber animate-pulse" />
          The future of task management is reflective
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 leading-tight">
          Plan. Reflect.{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-purple via-brand-coral to-brand-teal">
            Improve.
          </span>
        </h1>
        
        <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Taskflow is more than a list. It combines task planning with self-reflection and automatic AI coaching, helping you grow with every project, habit, and milestone.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <Link 
            href="/login?signup=true" 
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-brand-purple to-brand-teal text-white font-semibold flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-purple-500/20 hover:scale-[1.02] transition"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="/login" 
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-neutral-800 bg-neutral-900/30 text-neutral-300 font-semibold flex items-center justify-center hover:bg-neutral-900/80 transition"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Highlights (3 Cards) */}
        <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 text-left">
          <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/20 hover:border-neutral-800 transition">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-brand-purple mb-6">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Reflective Planning</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Every task and project carries four reflective fields: Objective, Result, Lesson, and Compromise. Turn failures into lessons and trace your personal growth.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/20 hover:border-neutral-800 transition">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-brand-teal mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Habits & Streaks</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Track daily habits and build streaks. Reflect on why habits break and analyze streak resilience under heavy project workload.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/20 hover:border-neutral-800 transition">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-brand-coral mb-6">
              <ListTodo className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Visual Calendar</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              An elegant unified month grid. Color-coded dots outline deadlines: Purple for projects, Coral for tasks, and Teal for one-off scheduled items.
            </p>
          </div>
        </section>

        {/* AI Features Teaser */}
        <section className="w-full p-8 md:p-12 rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900/50 to-neutral-950 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[30%] h-[100%] bg-brand-amber/5 blur-[80px] pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-brand-amber text-xs font-semibold mb-4">
                <Brain className="w-3.5 h-3.5" /> AI Coach
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">On-Demand & Automatic Optimization</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Prioritize project tasks with one-click, spot recurring lessons weekly, diagnose compromises, and get realistic deadline recommendations based on your current calendar load.
              </p>
            </div>
            <Link 
              href="/login?signup=true"
              className="px-6 py-3 rounded-lg bg-neutral-100 text-black hover:bg-neutral-200 transition font-semibold text-sm flex items-center gap-2 self-start md:self-center"
            >
              Try AI Coach <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-8 bg-neutral-950 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Taskflow. Plan. Reflect. Improve.</p>
          <div className="flex gap-4">
            <span className="cursor-default">v1.0.0</span>
            <span>•</span>
            <span className="cursor-default">Aesthetics Redefined</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
