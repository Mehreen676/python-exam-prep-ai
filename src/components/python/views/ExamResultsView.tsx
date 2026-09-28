'use client';

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  PenLine,
  RefreshCcw,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CodeBlock } from '@/components/python/CodeBlock';
import { courseContent } from '@/lib/python-course/content';
import { useNav, useProgress } from '@/lib/python-course/store';

interface ExamResultsViewProps {
  examId: string | null;
}

export function ExamResultsView({ examId }: ExamResultsViewProps) {
  const go = useNav((s) => s.go);
  const exams = useProgress((s) => s.exams);

  const exam = useMemo(() => exams.find((e) => e.id === examId) ?? exams[0] ?? null, [exams, examId]);

  if (!exam) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 text-center">
        <p className="text-muted-foreground">No exam result found. Take a mock exam first.</p>
        <Button className="mt-4" onClick={() => go('exam')}>Start mock exam</Button>
      </div>
    );
  }

  const correctSet = new Set(exam.detailed.filter((d) => d.correct).map((d) => d.mcqId));
  const incorrectDetailed = exam.detailed.filter((d) => !d.correct);

  // Pull full MCQ data for each detailed entry
  const mcqsById = new Map(courseContent.mcqs.map((q) => [q.id, q]));
  const reviewRows = exam.detailed.map((d) => {
    const q = mcqsById.get(d.mcqId);
    return { d, q };
  });

  const timeTakenSeconds = Math.round((exam.finishedAt - exam.startedAt) / 1000);
  const minutes = Math.floor(timeTakenSeconds / 60);
  const seconds = timeTakenSeconds % 60;

  const retryIncorrect = () => {
    // For simplicity: build a practice session of the incorrect questions
    // We can't easily share MCQ objects via the nav store, but we can route to
    // practice mode and rely on weak-topic detection for similar effect.
    go('practice', { mode: 'weak' });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Exam results</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={retryIncorrect} className="gap-1">
              <RefreshCcw className="h-4 w-4" /> Retry incorrect
            </Button>
            <Button size="sm" onClick={() => go('exam')} className="gap-1">
              <PenLine className="h-4 w-4" /> New exam
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Taken {new Date(exam.startedAt).toLocaleString()}
        </p>
      </header>

      {/* Score banner */}
      <Card className={`${exam.percentage >= 70 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900' : exam.percentage >= 40 ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900' : 'bg-destructive/5 border-destructive/30'}`}>
        <CardContent className="p-6 grid sm:grid-cols-[auto_1fr] gap-6 items-center">
          <div className="text-center">
            <div className="text-5xl font-bold">{exam.percentage}%</div>
            <div className="text-xs text-muted-foreground mt-1">final score</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-primary" />
              {exam.percentage >= 70 ? 'Solid work — exam ready.' : exam.percentage >= 40 ? 'Close — focus on weak topics.' : 'Keep practising — you can do this.'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <Cell label="Total" value={exam.totalQuestions} />
              <Cell label="Correct" value={exam.correct} tone="good" />
              <Cell label="Incorrect" value={exam.incorrect} tone="bad" />
              <Cell label="Unanswered" value={exam.unanswered} tone="warn" />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Time: {minutes}m {seconds}s of {exam.durationMinutes}m allowed
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapter-wise performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Chapter-wise performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-80 overflow-y-auto">
          {Object.entries(exam.chapterPerformance)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([chStr, perf]) => {
              const ch = Number(chStr);
              const chObj = courseContent.chapters.find((c) => c.number === ch);
              const pct = Math.round((perf.correct / perf.total) * 100);
              return (
                <div key={chStr} className="flex items-center gap-3">
                  <div className="w-40 shrink-0 text-sm">
                    Ch {ch}: {chObj?.title ?? ''}
                  </div>
                  <Progress value={pct} className="flex-1 h-2" />
                  <div className="w-16 text-right text-sm font-mono">{perf.correct}/{perf.total}</div>
                </div>
              );
            })}
        </CardContent>
      </Card>

      {/* Weak topics */}
      {exam.weakTopics.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-destructive" /> Weak topics
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {exam.weakTopics.map((t) => (
              <Badge key={t} variant="destructive" className="text-xs">{t}</Badge>
            ))}
            <Button size="sm" variant="outline" className="ml-auto" onClick={retryIncorrect}>
              Practise weak topics
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Detailed review */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review each question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviewRows.map(({ d, q }, i) => {
            if (!q) return null;
            const userSel = d.selected;
            return (
              <div key={d.mcqId} className={`rounded-lg border p-4 ${d.correct ? 'border-emerald-200 dark:border-emerald-900' : 'border-destructive/30'}`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-xs text-muted-foreground">Q{i + 1} · Ch {q.chapter} · {q.topic}</div>
                  {d.correct ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                      <CheckCircle2 className="h-4 w-4" /> Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-destructive text-sm font-semibold">
                      <XCircle className="h-4 w-4" /> {userSel == null ? 'Unanswered' : 'Incorrect'}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium leading-relaxed mb-2">{q.question}</p>
                {q.code && <CodeBlock code={q.code} className="mb-2" />}
                <div className="grid gap-1.5 mb-3">
                  {q.options.map((opt, idx) => {
                    const isCorrect = idx === d.correctIndex;
                    const isUser = idx === userSel;
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 rounded border p-2 text-sm ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                            : isUser
                            ? 'border-destructive bg-destructive/5'
                            : 'border-border'
                        }`}
                      >
                        <span className="font-mono text-xs">{String.fromCharCode(65 + idx)}</span>
                        <span className="flex-1 font-mono whitespace-pre-wrap">{opt}</span>
                        {isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        {isUser && !isCorrect && <XCircle className="h-4 w-4 text-destructive" />}
                      </div>
                    );
                  })}
                </div>
                <div className="rounded bg-muted/40 p-2 text-sm">
                  <span className="font-semibold">Explanation: </span>
                  {q.explanation}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 justify-center">
        <Button variant="outline" onClick={() => go('dashboard')} className="gap-1">
          Back to dashboard
        </Button>
        <Button onClick={() => go('exam')} className="gap-1">
          <PenLine className="h-4 w-4" /> Take another exam
        </Button>
      </div>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: number; tone?: 'good' | 'bad' | 'warn' }) {
  const color =
    tone === 'good' ? 'text-emerald-600 dark:text-emerald-400' :
    tone === 'bad' ? 'text-destructive' :
    tone === 'warn' ? 'text-amber-600 dark:text-amber-400' : '';
  return (
    <div className="rounded border bg-card p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
