'use client';

import { useEffect, useState } from 'react';
import { courseContent } from '@/lib/python-course/content';
import { useNav, useProgress } from '@/lib/python-course/store';
import { TopNav } from '@/components/python/TopNav';
import { LandingView } from '@/components/python/views/LandingView';
import { DashboardView } from '@/components/python/views/DashboardView';
import { SyllabusView } from '@/components/python/views/SyllabusView';
import { ChapterView } from '@/components/python/views/ChapterView';
import { SlidesView } from '@/components/python/views/SlidesView';
import { VideoView } from '@/components/python/views/VideoView';
import { PracticeView } from '@/components/python/views/PracticeView';
import { FlashcardsView } from '@/components/python/views/FlashcardsView';
import { ExamView } from '@/components/python/views/ExamView';
import { ExamResultsView } from '@/components/python/views/ExamResultsView';
import { AnalyticsView } from '@/components/python/views/AnalyticsView';
import { SettingsView } from '@/components/python/views/SettingsView';
import { AdminView } from '@/components/python/views/AdminView';
import { ProfileView } from '@/components/python/views/ProfileView';
import { Footer } from '@/components/python/Footer';
import { TutorChat } from '@/components/python/TutorChat';

export function AppShell() {
  const view = useNav((s) => s.view);
  const activeChapter = useNav((s) => s.activeChapter);
  const lastExamId = useNav((s) => s.lastExamId);
  const prefs = useProgress((s) => s.preferences);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Defer to next tick so we don't synchronously setState inside the effect body.
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Apply theme on pref change
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const apply = (mode: 'light' | 'dark' | 'system') => {
      const dark =
        mode === 'dark' ||
        (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', dark);
    };
    apply(prefs.theme);
    if (prefs.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => apply('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [prefs.theme, mounted]);

  if (!mounted) {
    // Avoid SSR hydration mismatch from localStorage-backed state.
    return null;
  }

  const chapter =
    activeChapter != null ? courseContent.chapters.find((c) => c.number === activeChapter) ?? null : null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TopNav />
      <main className="flex-1 w-full">
        {view === 'landing' && <LandingView />}
        {view === 'dashboard' && <DashboardView />}
        {view === 'syllabus' && <SyllabusView />}
        {view === 'chapter' && chapter && <ChapterView chapter={chapter} />}
        {view === 'slides' && chapter && <SlidesView chapter={chapter} />}
        {view === 'video' && chapter && <VideoView chapter={chapter} />}
        {view === 'practice' && <PracticeView />}
        {view === 'flashcards' && <FlashcardsView />}
        {view === 'exam' && <ExamView />}
        {view === 'exam-results' && <ExamResultsView examId={lastExamId} />}
        {view === 'analytics' && <AnalyticsView />}
        {view === 'settings' && <SettingsView />}
        {view === 'admin' && <AdminView />}
        {view === 'profile' && <ProfileView />}
      </main>
      <Footer />
      <TutorChat />
    </div>
  );
}
