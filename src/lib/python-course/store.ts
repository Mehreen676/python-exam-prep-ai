'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AttemptedQuestionRecord,
  ExamResult,
  FlashcardProgress,
  Preferences,
  ProgressState,
} from './progress-types';
import type { CourseContent } from './types';

// ---------------------------------------------------------------------------
// Navigation state (NOT persisted — resets on reload).
// ---------------------------------------------------------------------------

export type ViewId =
  | 'landing'
  | 'dashboard'
  | 'syllabus'
  | 'chapter' // requires activeChapter
  | 'slides' // requires activeChapter
  | 'video' // requires activeChapter
  | 'practice'
  | 'flashcards'
  | 'exam'
  | 'exam-results'
  | 'analytics'
  | 'settings'
  | 'admin'
  | 'profile';

interface NavState {
  view: ViewId;
  activeChapter: number | null;
  activeTopic: string | null;
  activeMode: 'topic' | 'chapter' | 'mixed' | 'weak' | null;
  lastExamId: string | null;
  go: (view: ViewId, opts?: { chapter?: number; topic?: string; mode?: 'topic' | 'chapter' | 'mixed' | 'weak'; examId?: string }) => void;
}

export const useNav = create<NavState>((set) => ({
  view: 'landing',
  activeChapter: null,
  activeTopic: null,
  activeMode: null,
  lastExamId: null,
  go: (view, opts = {}) =>
    set(() => ({
      view,
      activeChapter: opts.chapter ?? null,
      activeTopic: opts.topic ?? null,
      activeMode: opts.mode ?? null,
      lastExamId: opts.examId ?? null,
    })),
}));

// ---------------------------------------------------------------------------
// Progress persistence — uses localStorage with graceful fallback.
// ---------------------------------------------------------------------------

const DEFAULT_PREFS: Preferences = {
  theme: 'system',
  defaultDifficulty: 'Mixed',
  examDefaultQuestions: 20,
  examDefaultMinutes: 30,
  showRomanUrdu: true,
};

const EMPTY_PROGRESS: Omit<ProgressState, 'preferences' | 'cloudHydrated'> = {
  chapters: {},
  flashcards: {},
  attempts: [],
  exams: [],
  streak: { lastActiveDay: null, current: 0, longest: 0 },
  activeDays: [],
};

interface ProgressStore extends ProgressState {
  // chapter actions
  toggleChapterCompleted: (n: number) => void;
  markChapterCompleted: (n: number) => void;
  incSlidesViewed: (n: number, by?: number) => void;
  incVideosWatched: (n: number) => void;
  // flashcard actions
  setFlashcardStatus: (id: string, status: 'know' | 'review') => void;
  resetFlashcards: () => void;
  // attempt actions
  recordAttempt: (rec: AttemptedQuestionRecord) => void;
  // exam actions
  recordExam: (exam: ExamResult) => void;
  // prefs
  setPreferences: (p: Partial<Preferences>) => void;
  // reset everything
  resetAllProgress: () => void;
  // username (stored locally — no signup required)
  username: string | null;
  setUsername: (name: string | null) => void;
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z');
  const db = new Date(b + 'T00:00:00Z');
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export const useProgress = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_PROGRESS,
      preferences: DEFAULT_PREFS,

      toggleChapterCompleted: (n) =>
        set((s) => {
          const cur = s.chapters[n] ?? { completed: false, markedAt: null, slidesViewed: 0, videosWatched: 0 };
          const completed = !cur.completed;
          return {
            chapters: {
              ...s.chapters,
              [n]: { ...cur, completed, markedAt: completed ? Date.now() : null },
            },
          };
        }),

      markChapterCompleted: (n) =>
        set((s) => {
          const cur = s.chapters[n] ?? { completed: false, markedAt: null, slidesViewed: 0, videosWatched: 0 };
          return {
            chapters: {
              ...s.chapters,
              [n]: { ...cur, completed: true, markedAt: Date.now() },
            },
          };
        }),

      incSlidesViewed: (n, by = 1) =>
        set((s) => {
          const cur = s.chapters[n] ?? { completed: false, markedAt: null, slidesViewed: 0, videosWatched: 0 };
          return {
            chapters: {
              ...s.chapters,
              [n]: { ...cur, slidesViewed: cur.slidesViewed + by },
            },
          };
        }),

      incVideosWatched: (n) =>
        set((s) => {
          const cur = s.chapters[n] ?? { completed: false, markedAt: null, slidesViewed: 0, videosWatched: 0 };
          return {
            chapters: {
              ...s.chapters,
              [n]: { ...cur, videosWatched: cur.videosWatched + 1 },
            },
          };
        }),

      setFlashcardStatus: (id, status) =>
        set((s) => ({
          flashcards: { ...s.flashcards, [id]: status } as FlashcardProgress,
        })),

      resetFlashcards: () => set({ flashcards: {} }),

      recordAttempt: (rec) =>
        set((s) => {
          const today = todayStr();
          const last = s.streak.lastActiveDay;
          let nextStreak = { ...s.streak };
          if (last !== today) {
            if (last && dayDiff(last, today) === 1) {
              nextStreak.current = s.streak.current + 1;
            } else {
              nextStreak.current = 1;
            }
            nextStreak.lastActiveDay = today;
            nextStreak.longest = Math.max(nextStreak.longest, nextStreak.current);
          } else if (nextStreak.current === 0) {
            nextStreak.current = 1;
            nextStreak.longest = Math.max(nextStreak.longest, 1);
          }
          const activeDays = s.activeDays.includes(today) ? s.activeDays : [...s.activeDays, today];
          return {
            attempts: [...s.attempts, rec].slice(-5000),
            streak: nextStreak,
            activeDays,
          };
        }),

      recordExam: (exam) =>
        set((s) => ({ exams: [exam, ...s.exams].slice(0, 100) })),

      setPreferences: (p) =>
        set((s) => ({ preferences: { ...s.preferences, ...p } })),

      resetAllProgress: () =>
        set(() => ({
          ...EMPTY_PROGRESS,
          preferences: get().preferences,
          username: get().username,
        })),

      // --- simple username (no auth) ---
      username: null,
      setUsername: (name) => set({ username: name }),
    }),
    {
      name: 'python-exam-prep/progress',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          // SSR fallback — return a no-op storage
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        try {
          return window.localStorage;
        } catch {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
      }),
      version: 1,
      // If migration breaks, start clean rather than crash the UI.
      migrate: () => null,
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== 'object') return current;
        const p = persisted as Partial<ProgressState>;
        return {
          ...current,
          ...p,
          preferences: { ...current.preferences, ...(p.preferences ?? {}) },
          chapters: p.chapters ?? {},
          flashcards: p.flashcards ?? {},
          attempts: Array.isArray(p.attempts) ? p.attempts : [],
          exams: Array.isArray(p.exams) ? p.exams : [],
          streak: p.streak ?? current.streak,
          activeDays: Array.isArray(p.activeDays) ? p.activeDays : [],
          username: typeof p.username === 'string' ? p.username : null,
        };
      },
    }
  )
);

// Convenience selectors
export function selectChapterCompletion(s: ProgressState) {
  const completed = Object.values(s.chapters).filter((c) => c.completed).length;
  return completed;
}

export function selectAccuracy(s: ProgressState): { attempted: number; correct: number; pct: number } {
  const attempted = s.attempts.length;
  const correct = s.attempts.filter((a) => a.correct).length;
  const pct = attempted === 0 ? 0 : Math.round((correct / attempted) * 100);
  return { attempted, correct, pct };
}

export function selectWeakTopics(s: ProgressState, threshold = 0.6): string[] {
  const byTopic: Record<string, { correct: number; total: number }> = {};
  for (const a of s.attempts) {
    const key = `Ch${a.chapter}: ${a.topic}`;
    if (!byTopic[key]) byTopic[key] = { correct: 0, total: 0 };
    byTopic[key].total += 1;
    if (a.correct) byTopic[key].correct += 1;
  }
  return Object.entries(byTopic)
    .filter(([, v]) => v.total >= 3 && v.correct / v.total < threshold)
    .map(([k]) => k);
}
