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
  | 'signin'
  | 'signup'
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
  // --- auth-aware cloud sync (no-op when signed out) ---
  // True after we have hydrated the store from the server on sign-in.
  // False when signed out or before hydration has finished.
  cloudHydrated: boolean;
  setCloudHydrated: (v: boolean) => void;
  // Merge a server payload into the local state (used by GET /api/progress).
  hydrateFromServer: (data: Partial<ProgressState>) => void;
  // Push the local state to the server (used after sign-in and on writes).
  // Returns true if the push succeeded.
  syncToServer: () => Promise<boolean>;
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

      toggleChapterCompleted: (n) => {
        set((s) => {
          const cur = s.chapters[n] ?? { completed: false, markedAt: null, slidesViewed: 0, videosWatched: 0 };
          const completed = !cur.completed;
          return {
            chapters: {
              ...s.chapters,
              [n]: { ...cur, completed, markedAt: completed ? Date.now() : null },
            },
          };
        });
        void get().syncToServer();
      },

      markChapterCompleted: (n) => {
        set((s) => {
          const cur = s.chapters[n] ?? { completed: false, markedAt: null, slidesViewed: 0, videosWatched: 0 };
          return {
            chapters: {
              ...s.chapters,
              [n]: { ...cur, completed: true, markedAt: Date.now() },
            },
          };
        });
        void get().syncToServer();
      },

      incSlidesViewed: (n, by = 1) => {
        set((s) => {
          const cur = s.chapters[n] ?? { completed: false, markedAt: null, slidesViewed: 0, videosWatched: 0 };
          return {
            chapters: {
              ...s.chapters,
              [n]: { ...cur, slidesViewed: cur.slidesViewed + by },
            },
          };
        });
        // Slide views are frequent — don't sync on every one. Caller can sync
        // later in batches if needed.
      },

      incVideosWatched: (n) => {
        set((s) => {
          const cur = s.chapters[n] ?? { completed: false, markedAt: null, slidesViewed: 0, videosWatched: 0 };
          return {
            chapters: {
              ...s.chapters,
              [n]: { ...cur, videosWatched: cur.videosWatched + 1 },
            },
          };
        });
        void get().syncToServer();
      },

      setFlashcardStatus: (id, status) => {
        set((s) => ({
          flashcards: { ...s.flashcards, [id]: status } as FlashcardProgress,
        }));
        void get().syncToServer();
      },

      resetFlashcards: () => {
        set({ flashcards: {} });
        void get().syncToServer();
      },

      recordAttempt: (rec) => {
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
        });
        void get().syncToServer();
      },

      recordExam: (exam) => {
        set((s) => ({ exams: [exam, ...s.exams].slice(0, 100) }));
        void get().syncToServer();
      },

      setPreferences: (p) =>
        set((s) => ({ preferences: { ...s.preferences, ...p } })),

      resetAllProgress: () =>
        set(() => ({
          ...EMPTY_PROGRESS,
          preferences: get().preferences,
          cloudHydrated: false,
        })),

      // --- cloud sync (no-op until cloudHydrated is true) ---
      cloudHydrated: false,
      setCloudHydrated: (v) => set(() => ({ cloudHydrated: v })),

      hydrateFromServer: (data) =>
        set((s) => {
          // Merge — prefer the server's record (cloud is the source of truth
          // for an authenticated user). Keep local streak activeDays only if
          // the server's copy is older.
          const serverChapters = data.chapters ?? {};
          const mergedChapters: typeof s.chapters = { ...s.chapters };
          for (const [k, v] of Object.entries(serverChapters)) {
            const kn = Number(k);
            const cur = mergedChapters[kn];
            const srv = v as { completed: boolean; markedAt: number | null; slidesViewed: number; videosWatched: number };
            // Use whichever record has a higher slidesViewed count (a rough
            // "more progress" heuristic). Falls back to server when local
            // has no record.
            if (!cur || srv.slidesViewed >= cur.slidesViewed) {
              mergedChapters[kn] = srv;
            } else {
              mergedChapters[kn] = cur;
            }
          }
          const serverAttempts = data.attempts ?? [];
          // Concatenate server attempts with any local ones we don't already
          // have. Deduplicate by (mcqId + timestamp + selected).
          const seen = new Set(
            serverAttempts.map((a) => `${a.mcqId}|${a.timestamp}|${a.selected}`)
          );
          const localOnly = s.attempts.filter(
            (a) => !seen.has(`${a.mcqId}|${a.timestamp}|${a.selected}`)
          );
          const mergedAttempts = [...serverAttempts, ...localOnly].slice(-5000);

          const serverExams = data.exams ?? [];
          const examSeen = new Set(serverExams.map((e) => e.id));
          const localExams = s.exams.filter((e) => !examSeen.has(e.id));
          const mergedExams = [...serverExams, ...localExams]
            .sort((a, b) => b.finishedAt - a.finishedAt)
            .slice(0, 100);

          const serverFlashcards = data.flashcards ?? {};
          const mergedFlashcards = { ...s.flashcards, ...serverFlashcards };

          const serverStreak = data.streak ?? s.streak;
          const mergedStreak =
            serverStreak.longest >= s.streak.longest ? serverStreak : s.streak;

          const serverActiveDays = data.activeDays ?? [];
          const mergedActiveDays = Array.from(
            new Set([...s.activeDays, ...serverActiveDays])
          );

          return {
            chapters: mergedChapters,
            attempts: mergedAttempts,
            exams: mergedExams,
            flashcards: mergedFlashcards,
            streak: mergedStreak,
            activeDays: mergedActiveDays,
            cloudHydrated: true,
          };
        }),

      syncToServer: async () => {
        // No-op if not hydrated (we don't push stale localStorage over the
        // server's record). Component code calls this only after sign-in.
        if (!get().cloudHydrated) return false;
        try {
          const s = get();
          const res = await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chapters: s.chapters,
              attempts: s.attempts.slice(-200), // last 200 only to keep payload reasonable
              exams: s.exams.slice(0, 20),
              flashcards: s.flashcards,
            }),
          });
          return res.ok;
        } catch {
          return false;
        }
      },
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
          // Never persist cloudHydrated from localStorage — always start as
          // false on reload; the AppShell effect sets it after a successful
          // /api/progress GET.
          cloudHydrated: false,
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
