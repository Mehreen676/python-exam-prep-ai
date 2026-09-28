'use client';

import { useNav } from '@/lib/python-course/store';

export function Footer() {
  const go = useNav((s) => s.go);
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 text-sm text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <p>
            Built for Python learners preparing for exams. Syllabus: Chapters 1–40 of
            {' '}
            <span className="font-medium text-foreground">A Smarter Way to Learn Python</span>
            {' '}by Mark Myers.
          </p>
          <p className="text-xs">
            Created by <span className="font-medium text-foreground">Mehreen Zohair</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="hover:underline" onClick={() => go('syllabus')}>
            Syllabus
          </button>
          <span aria-hidden>·</span>
          <button className="hover:underline" onClick={() => go('dashboard')}>
            Dashboard
          </button>
          <span aria-hidden>·</span>
          <button className="hover:underline" onClick={() => go('settings')}>
            Settings
          </button>
        </div>
      </div>
    </footer>
  );
}
