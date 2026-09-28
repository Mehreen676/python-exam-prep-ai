import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// Progress sync routes — /api/progress
//
// GET  : returns the user's saved progress (chapters, attempts, exams,
//        flashcards) from the database so the SPA can hydrate its Zustand
//        store on sign-in.
// POST : accepts a partial progress payload from the client and upserts it
//        into the database. Only the authenticated user's own rows are
//        touched.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return await db.user.findUnique({ where: { email: session.user.email } });
}

// --- GET ----------------------------------------------------------------

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not authenticated.' }, { status: 401 });
  }

  const [chapterCompletions, attempts, exams, flashcards] = await Promise.all([
    db.chapterCompletion.findMany({ where: { userId: user.id } }),
    db.attempt.findMany({ where: { userId: user.id }, orderBy: { timestamp: 'asc' } }),
    db.examResult.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
    db.flashcardStatus.findMany({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({
    ok: true,
    progress: {
      chapters: Object.fromEntries(
        chapterCompletions.map((c) => [
          c.chapterNumber,
          {
            completed: c.completed,
            markedAt: c.markedAt ? c.markedAt.getTime() : null,
            slidesViewed: c.slidesViewed,
            videosWatched: c.videosWatched,
          },
        ])
      ),
      attempts: attempts.map((a) => ({
        mcqId: a.mcqId,
        chapter: a.chapter,
        topic: a.topic,
        difficulty: a.difficulty as 'Easy' | 'Medium' | 'Hard',
        selected: a.selected,
        correct: a.correct,
        timestamp: a.timestamp.getTime(),
        mode: a.mode as 'topic' | 'chapter' | 'mixed' | 'weak' | 'practice' | 'exam',
      })),
      exams: exams.map((e) => ({
        id: e.id,
        startedAt: e.startedAt.getTime(),
        finishedAt: e.finishedAt.getTime(),
        durationMinutes: e.durationMinutes,
        totalQuestions: e.totalQuestions,
        correct: e.correct,
        incorrect: e.incorrect,
        unanswered: e.unanswered,
        percentage: e.percentage,
        detailed: JSON.parse(e.detailedJson),
        chapterPerformance: JSON.parse(e.chapterPerfJson),
        weakTopics: JSON.parse(e.weakTopicsJson),
      })),
      flashcards: Object.fromEntries(
        flashcards.map((f) => [f.cardId, f.status])
      ),
    },
  });
}

// --- POST ---------------------------------------------------------------

interface ProgressPayload {
  chapters?: Record<number, {
    completed: boolean;
    markedAt: number | null;
    slidesViewed: number;
    videosWatched: number;
  }>;
  attempts?: Array<{
    mcqId: string;
    chapter: number;
    topic: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    selected: number;
    correct: boolean;
    timestamp: number;
    mode: 'topic' | 'chapter' | 'mixed' | 'weak' | 'practice' | 'exam';
  }>;
  exams?: Array<{
    id: string;
    startedAt: number;
    finishedAt: number;
    durationMinutes: number;
    totalQuestions: number;
    correct: number;
    incorrect: number;
    unanswered: number;
    percentage: number;
    detailed: any;
    chapterPerformance: Record<number, { correct: number; total: number }>;
    weakTopics: string[];
  }>;
  flashcards?: Record<string, 'know' | 'review'>;
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not authenticated.' }, { status: 401 });
  }

  let body: ProgressPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 });
  }

  // ----- Chapter completions -----
  if (body.chapters) {
    for (const [chStr, c] of Object.entries(body.chapters)) {
      const chapterNumber = Number(chStr);
      await db.chapterCompletion.upsert({
        where: { userId_chapterNumber: { userId: user.id, chapterNumber } },
        create: {
          userId: user.id,
          chapterNumber,
          completed: c.completed,
          markedAt: c.markedAt ? new Date(c.markedAt) : null,
          slidesViewed: c.slidesViewed,
          videosWatched: c.videosWatched,
        },
        update: {
          completed: c.completed,
          markedAt: c.markedAt ? new Date(c.markedAt) : null,
          slidesViewed: c.slidesViewed,
          videosWatched: c.videosWatched,
        },
      });
    }
  }

  // ----- Attempts (incremental) -----
  if (body.attempts && Array.isArray(body.attempts)) {
    for (const a of body.attempts) {
      // Avoid duplicates: same mcqId + same selected + within 5s window = skip
      const existing = await db.attempt.findFirst({
        where: {
          userId: user.id,
          mcqId: a.mcqId,
          selected: a.selected,
          timestamp: { gte: new Date(a.timestamp - 5000), lte: new Date(a.timestamp + 5000) },
        },
        select: { id: true },
      });
      if (existing) continue;
      await db.attempt.create({
        data: {
          userId: user.id,
          mcqId: a.mcqId,
          chapter: a.chapter,
          topic: a.topic,
          difficulty: a.difficulty,
          selected: a.selected,
          correct: a.correct,
          mode: a.mode,
          timestamp: new Date(a.timestamp),
        },
      });
    }
  }

  // ----- Exam results (full record, idempotent by examId) -----
  if (body.exams && Array.isArray(body.exams)) {
    for (const e of body.exams) {
      const exists = await db.examResult.findUnique({ where: { id: e.id } }).catch(() => null);
      if (exists) continue;
      await db.examResult.create({
        data: {
          id: e.id,
          userId: user.id,
          startedAt: new Date(e.startedAt),
          finishedAt: new Date(e.finishedAt),
          durationMinutes: e.durationMinutes,
          totalQuestions: e.totalQuestions,
          correct: e.correct,
          incorrect: e.incorrect,
          unanswered: e.unanswered,
          percentage: e.percentage,
          detailedJson: JSON.stringify(e.detailed ?? []),
          chapterPerfJson: JSON.stringify(e.chapterPerformance ?? {}),
          weakTopicsJson: JSON.stringify(e.weakTopics ?? []),
        },
      });
    }
  }

  // ----- Flashcards (upsert) -----
  if (body.flashcards) {
    for (const [cardId, status] of Object.entries(body.flashcards)) {
      await db.flashcardStatus.upsert({
        where: { userId_cardId: { userId: user.id, cardId } },
        create: { userId: user.id, cardId, status },
        update: { status },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
