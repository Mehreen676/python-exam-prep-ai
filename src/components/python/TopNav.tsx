'use client';

import { useState } from 'react';
import { Menu, User as UserIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNav, useProgress } from '@/lib/python-course/store';
import type { ViewId } from '@/lib/python-course/store';
import { cn } from '@/lib/utils';

const NAV_ITEMS: { id: ViewId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'syllabus', label: 'Syllabus' },
  { id: 'practice', label: 'Practice' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'exam', label: 'Mock Exam' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
];

export function TopNav() {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);
  const [open, setOpen] = useState(false);
  const username = useProgress((s) => s.username);

  const displayName = username?.trim() ? username.trim() : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
        <button
          onClick={() => go('landing')}
          className="flex items-center gap-2 font-bold text-lg tracking-tight"
          aria-label="Go to landing page"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-mono">
            Py
          </span>
          <span className="hidden sm:inline">Python Exam Prep AI</span>
          <span className="sm:hidden">Python Prep</span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.id}
              variant={view === item.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => go(item.id)}
              className={cn(view === item.id && 'font-semibold')}
            >
              {item.label}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => go('admin')}>
            Admin
          </Button>

          {/* Username / Set Name button — no auth */}
          <Button
            variant={view === 'profile' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => go('profile')}
            className="ml-1 gap-2"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {displayName ? displayName[0]?.toUpperCase() : <UserIcon className="h-3.5 w-3.5" />}
            </span>
            <span className="hidden lg:inline max-w-24 truncate">
              {displayName ?? 'Set name'}
            </span>
          </Button>
        </nav>

        <button
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-accent"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t bg-background">
          <div className="mx-auto max-w-7xl px-4 py-2 grid grid-cols-2 gap-1">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.id}
                variant={view === item.id ? 'secondary' : 'ghost'}
                size="sm"
                className="justify-start"
                onClick={() => {
                  go(item.id);
                  setOpen(false);
                }}
              >
                {item.label}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => {
                go('admin');
                setOpen(false);
              }}
            >
              Admin
            </Button>
            <Button
              variant={view === 'profile' ? 'secondary' : 'ghost'}
              size="sm"
              className="justify-start gap-1"
              onClick={() => {
                go('profile');
                setOpen(false);
              }}
            >
              <UserIcon className="h-4 w-4" /> {displayName ?? 'Set name'}
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
