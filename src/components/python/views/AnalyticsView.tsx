'use client';

import { BarChart3, Clock, ListChecks, Target, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { courseContent } from '@/lib/python-course/content';
import { selectAccuracy, selectWeakTopics, useNav, useProgress } from '@/lib/python-course/store';

export function AnalyticsView() {
  const go = useNav((s) => s.go);
  const progress = useProgress();
  const accuracy = selectAccuracy(progress);
  const weakTopics = selectWeakTopics(progress, 0.7);

  // Per-chapter accuracy
  const perChapter = useMemo(() => {
    const map: Record<number, { correct: number; total: number }> = {};
    for (const a of progress.attempts) {
      if (!map[a.chapter]) map[a.chapter] = { correct: 0, total: 0 };
      map[a.chapter].total += 1;
      if (a.correct) map[a.chapter].correct += 1;
    }
    return Object.entries(map)
      .map(([ch, v]) => ({ chapter: Number(ch), ...v }))
      .sort((a, b) => a.chapter - b.chapter);
  }, [progress.attempts]);

  // Difficulty breakdown
  const byDifficulty = useMemo(() => {
    const map: Record<string, { correct: number; total: number }> = {
      Easy: { correct: 0, total: 0 },
      Medium: { correct: 0, total: 0 },
      Hard: { correct: 0, total: 0 },
    };
    for (const a of progress.attempts) {
      if (!map[a.difficulty]) continue;
      map[a.difficulty].total += 1;
      if (a.correct) map[a.difficulty].correct += 1;
    }
    return map;
  }, [progress.attempts]);

  if (progress.attempts.length === 0 && progress.exams.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto" />
        <p className="mt-3 text-muted-foreground">
          Answer a few questions or take a mock exam to see your analytics here.
        </p>
        <Button className="mt-4" onClick={() => go('practice')}>Start practising</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          Real numbers calculated from your answers — no placeholders.
        </p>
      </header>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={ListChecks} label="Questions attempted" value={String(accuracy.attempted)} />
        <StatCard icon={TrendingUp} label="Overall accuracy" value={`${accuracy.pct}%`} progress={accuracy.pct} />
        <StatCard icon={Clock} label="Mock exams taken" value={String(progress.exams.length)} />
        <StatCard icon={Target} label="Weak topics" value={String(weakTopics.length)} />
      </div>

      {/* Per-chapter accuracy */}
      <Card>
        <CardHeader>
          <CardTitle>Per-chapter accuracy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {perChapter.length === 0 ? (
            <p className="text-sm text-muted-foreground">No chapter attempts yet.</p>
          ) : (
            perChapter.map(({ chapter, correct, total }) => {
              const pct = Math.round((correct / total) * 100);
              const chObj = courseContent.chapters.find((c) => c.number === chapter);
              return (
                <div key={chapter} className="flex items-center gap-3">
                  <div className="w-44 shrink-0 text-sm">Ch {chapter}: {chObj?.title ?? ''}</div>
                  <Progress value={pct} className="flex-1 h-2" />
                  <div className="w-20 text-right text-sm font-mono">{correct}/{total} · {pct}%</div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Difficulty breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>By difficulty</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          {(['Easy', 'Medium', 'Hard'] as const).map((d) => {
            const v = byDifficulty[d];
            const pct = v.total === 0 ? 0 : Math.round((v.correct / v.total) * 100);
            return (
              <div key={d} className="rounded-lg border p-3 space-y-2">
                <div className="text-xs text-muted-foreground">{d}</div>
                <div className="text-xl font-bold">{pct}%</div>
                <Progress value={pct} className="h-1.5" />
                <div className="text-xs text-muted-foreground">{v.correct}/{v.total}</div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Weak topics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" /> Weak topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weakTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No weak topics detected yet. A topic becomes "weak" when your accuracy
              on it falls below 70% after at least 3 attempts.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {weakTopics.map((t) => (
                <Badge key={t} variant="destructive">{t}</Badge>
              ))}
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => go('practice', { mode: 'weak' })}>
                Practise weak topics
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent exams */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent mock exams</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => go('exam')}>New exam</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {progress.exams.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exams yet.</p>
          ) : (
            progress.exams.slice(0, 10).map((e) => (
              <button
                key={e.id}
                onClick={() => go('exam-results', { examId: e.id })}
                className="flex w-full items-center justify-between gap-3 rounded border p-3 hover:bg-muted/40 text-left"
              >
                <div>
                  <div className="text-sm font-medium">{new Date(e.startedAt).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.correct}/{e.totalQuestions} · {e.durationMinutes}m
                  </div>
                </div>
                <Badge variant={e.percentage >= 70 ? 'default' : e.percentage >= 40 ? 'secondary' : 'destructive'}>
                  {e.percentage}%
                </Badge>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  progress,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  progress?: number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
        {progress != null && <Progress value={progress} className="mt-2 h-1.5" />}
      </CardContent>
    </Card>
  );
}
