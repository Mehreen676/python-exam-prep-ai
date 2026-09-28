'use client';

import { AlertTriangle, Clock, Flag, PenLine, RefreshCcw, Target } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { CodeBlock } from '@/components/python/CodeBlock';
import { courseContent } from '@/lib/python-course/content';
import { useNav, useProgress } from '@/lib/python-course/store';
import type { Difficulty, ExamResult, MCQ } from '@/lib/python-course/types';

// (ExamQuestion type removed — we reuse MCQ directly with shuffled options.)

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleOptions(q: MCQ): MCQ {
  const indices = shuffle([0, 1, 2, 3]);
  const newOptions = indices.map((i) => q.options[i]) as [string, string, string, string];
  const newCorrect = indices.indexOf(q.correctIndex);
  return { ...q, options: newOptions, correctIndex: newCorrect };
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ExamView() {
  const go = useNav((s) => s.go);
  const prefs = useProgress((s) => s.preferences);
  const recordExam = useProgress((s) => s.recordExam);

  const [stage, setStage] = useState<'config' | 'exam' | 'submitting'>('config');
  const [numQuestions, setNumQuestions] = useState(prefs.examDefaultQuestions);
  const [durationMinutes, setDurationMinutes] = useState(prefs.examDefaultMinutes);
  const [includeChapters, setIncludeChapters] = useState<number[]>(() =>
    courseContent.chapters.map((c) => c.number)
  );
  const [difficulty, setDifficulty] = useState<'Mixed' | Difficulty>('Mixed');
  const [examQuestions, setExamQuestions] = useState<MCQ[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [remaining, setRemaining] = useState(durationMinutes * 60);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const submittedRef = useRef(false);

  // Chapter selection is initialized to all 40 chapters via useState above.

  const startExam = () => {
    let pool = courseContent.mcqs.filter((q) => includeChapters.includes(q.chapter));
    if (difficulty !== 'Mixed') pool = pool.filter((q) => q.difficulty === difficulty);
    const shuffled = shuffle(pool).slice(0, numQuestions).map(shuffleOptions);
    if (shuffled.length === 0) return;
    setExamQuestions(shuffled);
    setAnswers({});
    setReviewFlags({});
    setCurrentIdx(0);
    setRemaining(durationMinutes * 60);
    setStartedAt(Date.now());
    setStage('exam');
    submittedRef.current = false;
  };

  // Compute and persist the exam result. Must be declared above the
  // countdown effect so it can be referenced inside the interval callback.
  const submitExam = (auto = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setStage('submitting');
    void auto; // user-initiated vs auto submit distinction (no extra action needed)

    const total = examQuestions.length;
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const chapterPerf: Record<number, { correct: number; total: number }> = {};
    const detailed: ExamResult['detailed'] = [];
    for (const q of examQuestions) {
      const sel = answers[q.id];
      const isCorrect = sel === q.correctIndex;
      if (sel == null) unanswered += 1;
      else if (isCorrect) correct += 1;
      else incorrect += 1;
      if (!chapterPerf[q.chapter]) chapterPerf[q.chapter] = { correct: 0, total: 0 };
      chapterPerf[q.chapter].total += 1;
      if (isCorrect) chapterPerf[q.chapter].correct += 1;
      detailed.push({
        mcqId: q.id,
        chapter: q.chapter,
        topic: q.topic,
        selected: sel == null ? null : sel,
        correctIndex: q.correctIndex,
        correct: isCorrect,
        markedForReview: !!reviewFlags[q.id],
      });
    }
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const weakTopics: string[] = [];
    for (const [chStr, perf] of Object.entries(chapterPerf)) {
      if (perf.correct / perf.total < 0.7) {
        const ch = Number(chStr);
        const chapterObj = courseContent.chapters.find((c) => c.number === ch);
        if (chapterObj) {
          for (const t of chapterObj.topics) weakTopics.push(`Ch${ch}: ${t}`);
        }
      }
    }
    const result: ExamResult = {
      id: `exam-${Date.now()}`,
      startedAt: startedAt ?? Date.now(),
      finishedAt: Date.now(),
      durationMinutes,
      totalQuestions: total,
      correct,
      incorrect,
      unanswered,
      percentage,
      chapterPerformance: chapterPerf,
      weakTopics: weakTopics.slice(0, 5),
      detailed,
    };
    recordExam(result);
    setTimeout(() => go('exam-results', { examId: result.id }), 400);
  };

  // Countdown
  useEffect(() => {
    if (stage !== 'exam') return;
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer);
          submitExam(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage]);

  // ----- Render -----
  if (stage === 'config') {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Mock exam</h1>
          <p className="mt-2 text-muted-foreground">
            A timed, full-syllabus mock exam. Questions are drawn from Chapters 1–40 only.
            You can navigate, mark questions for review, and submit early. Auto-submit fires when the timer hits zero.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Configure exam
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Number of questions: <span className="font-bold">{numQuestions}</span></Label>
              <Slider min={5} max={40} step={5} value={[numQuestions]} onValueChange={(v) => setNumQuestions(v[0] ?? 20)} />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes): <span className="font-bold">{durationMinutes}</span></Label>
              <Slider min={5} max={120} step={5} value={[durationMinutes]} onValueChange={(v) => setDurationMinutes(v[0] ?? 30)} />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as 'Mixed' | Difficulty)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                  <SelectItem value="Easy">Easy only</SelectItem>
                  <SelectItem value="Medium">Medium only</SelectItem>
                  <SelectItem value="Hard">Hard only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chapters included ({includeChapters.length} of {courseContent.chapters.length})</Label>
              <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto p-2 rounded border bg-muted/20">
                {courseContent.chapters.map((c) => {
                  const active = includeChapters.includes(c.number);
                  return (
                    <button
                      key={c.number}
                      type="button"
                      onClick={() =>
                        setIncludeChapters((cur) =>
                          active ? cur.filter((n) => n !== c.number) : [...cur, c.number]
                        )
                      }
                      className={`rounded px-2 py-1 text-xs border ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
                    >
                      {c.number}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setIncludeChapters(courseContent.chapters.map((c) => c.number))}>
                  Select all
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIncludeChapters([])}>
                  Clear
                </Button>
              </div>
            </div>
            <Button onClick={startExam} className="w-full gap-2" disabled={includeChapters.length === 0}>
              <PenLine className="h-4 w-4" /> Start mock exam
            </Button>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardContent className="p-4 text-sm text-muted-foreground space-y-2">
            <div className="font-medium text-foreground">Scoring</div>
            <p>Final score = (correct answers / total questions) × 100%. Unanswered questions count as incorrect. There is no penalty for wrong answers — always guess if you are not sure.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === 'submitting') {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-center">
        <RefreshCcw className="h-10 w-10 animate-spin mx-auto text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Submitting your exam…</p>
      </div>
    );
  }

  // ----- Exam in progress -----
  const q = examQuestions[currentIdx];
  const isFlagged = reviewFlags[q.id];
  const selected = answers[q.id];
  const answeredCount = Object.values(answers).filter((v) => v != null).length;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-4">
      {/* Header with timer */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Mock exam in progress</h1>
          <p className="text-sm text-muted-foreground">
            {answeredCount} / {examQuestions.length} answered · {Object.values(reviewFlags).filter(Boolean).length} marked for review
          </p>
        </div>
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 border font-mono text-lg ${remaining < 60 ? 'border-destructive bg-destructive/5 text-destructive' : 'border-border bg-muted/30'}`}>
          <Clock className="h-4 w-4" />
          {formatTime(remaining)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_16rem] gap-4">
        {/* Question panel */}
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="secondary">Question {currentIdx + 1} of {examQuestions.length}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReviewFlags((r) => ({ ...r, [q.id]: !r[q.id] }))}
                className="gap-1"
              >
                <Flag className={`h-4 w-4 ${isFlagged ? 'text-amber-500' : 'text-muted-foreground'}`} />
                {isFlagged ? 'Marked for review' : 'Mark for review'}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">Topic: {q.topic} · {q.difficulty}</div>
            <div className="text-base font-medium leading-relaxed">{q.question}</div>
            {q.code && <CodeBlock code={q.code} />}
            <div className="grid gap-2">
              {q.options.map((opt, i) => {
                const isSel = selected === i;
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                      isSel ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                    }`}
                  >
                    <span className="font-mono text-xs mt-0.5">{String.fromCharCode(65 + i)}</span>
                    <span className="flex-1 whitespace-pre-wrap font-mono">{opt}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))} disabled={currentIdx === 0}>
                ← Previous
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentIdx((i) => Math.min(examQuestions.length - 1, i + 1))} disabled={currentIdx === examQuestions.length - 1}>
                Next →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigator panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Navigator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-5 gap-1">
              {examQuestions.map((qq, i) => {
                const ans = answers[qq.id] != null;
                const flagged = reviewFlags[qq.id];
                const isCur = i === currentIdx;
                return (
                  <button
                    key={qq.id}
                    onClick={() => setCurrentIdx(i)}
                    className={`aspect-square rounded text-xs font-mono border ${
                      isCur ? 'border-primary ring-1 ring-primary' : 'border-border'
                    } ${ans ? 'bg-primary/20' : 'bg-background'} ${flagged ? 'ring-1 ring-amber-400' : ''}`}
                    title={`Q${i + 1}${ans ? ' (answered)' : ''}${flagged ? ' (flagged)' : ''}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded bg-primary/20" /> Answered</div>
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded ring-1 ring-amber-400" /> Flagged for review</div>
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded border border-primary ring-1 ring-primary" /> Current</div>
            </div>
            <Button onClick={() => {
              if (confirm('Submit the exam now? You will not be able to change your answers.')) submitExam(false);
            }} className="w-full gap-2" variant="default">
              <PenLine className="h-4 w-4" /> Submit exam
            </Button>
            <p className="text-xs text-muted-foreground">
              {answeredCount < examQuestions.length && (
                <span className="flex items-start gap-1 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  {examQuestions.length - answeredCount} question(s) unanswered.
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
