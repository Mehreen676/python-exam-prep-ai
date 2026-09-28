'use client';

import { Sparkles } from 'lucide-react';
import { useNav } from '@/lib/python-course/store';

export function Footer() {
  const go = useNav((s) => s.go);
  return (
    <footer className="mt-auto border-t border-border/40 glass">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-sm text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground font-mono text-xs shadow-soft">
              Py
            </span>
            <span className="font-serif font-semibold text-foreground">Python Exam Prep AI</span>
            <Sparkles className="h-3 w-3 text-accent animate-pulse" />
          </div>
          <p className="leading-relaxed max-w-md">
            Built for Python learners preparing for exams. Syllabus: Chapters 1–40 of{' '}
            <span className="font-medium text-foreground">A Smarter Way to Learn Python</span>
            {' '}by Mark Myers.
          </p>
          <p className="text-xs">
            Created by <span className="font-medium text-foreground">Mehreen Zohair</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <button className="hover:text-foreground hover:underline transition-colors" onClick={() => go('syllabus')}>
            Syllabus
          </button>
          <span aria-hidden className="text-border">·</span>
          <button className="hover:text-foreground hover:underline transition-colors" onClick={() => go('dashboard')}>
            Dashboard
          </button>
          <span aria-hidden className="text-border">·</span>
          <button className="hover:text-foreground hover:underline transition-colors" onClick={() => go('settings')}>
            Settings
          </button>
          <span aria-hidden className="text-border">·</span>
          <button className="hover:text-foreground hover:underline transition-colors" onClick={() => go('profile')}>
            Profile
          </button>
        </div>
      </div>
    </footer>
  );
}
