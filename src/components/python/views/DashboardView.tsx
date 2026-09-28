'use client';

import {
  BookOpen,
  Brain,
  Flame,
  ListChecks,
  PenLine,
  PlayCircle,
  RefreshCcw,
  Rocket,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  courseContent,
} from '@/lib/python-course/content';
import {
  selectAccuracy,
  selectChapterCompletion,
  selectWeakTopics,
  useNav,
  useProgress,
} from '@/lib/python-course/store';
import { AdBanner } from '@/components/python/AdBanner';

export function DashboardView() {
  const go = useNav((s) => s.go);
  const progress = useProgress();
  const resetAll = useProgress((s) => s.resetAllProgress);

  const chaptersDone = selectChapterCompletion(progress);
  const accuracy = selectAccuracy(progress);
  const weakTopics = selectWeakTopics(progress);
  const totalChapters = courseContent.chapters.length;
  const completionPct = Math.round((chaptersDone / totalChapters) * 100);
  const recentExams = progress.exams.slice(0, 5);

  const lastExam = progress.exams[0] ?? null;
  const hasActivity = accuracy.attempted > 0 || recentExams.length > 0 || chaptersDone > 0;

  // Pick the next chapter to study — first one not yet completed.
  const nextChapter = courseContent.chapters.find((c) => !progress.chapters[c.number]?.completed) ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      {/* Welcome */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back, learner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {hasActivity
                ? `You have completed ${chaptersDone} of ${totalChapters} chapters and answered ${accuracy.attempted} practice questions so far. Keep going — small daily progress compounds before exams.`
                : 'You are new here. Start with Chapter 1, or jump straight into a practice test to see where you stand.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {nextChapter ? (
                <Button onClick={() => go('chapter', { chapter: nextChapter.number })} className="gap-2">
                  <Rocket className="h-4 w-4" />
                  Continue with Chapter {nextChapter.number}: {nextChapter.title}
                </Button>
              ) : (
                <Button onClick={() => go('syllabus')} className="gap-2">
                  <BookOpen className="h-4 w-4" /> Browse the Syllabus
                </Button>
              )}
              <Button variant="outline" onClick={() => go('practice')} className="gap-2">
                <PenLine className="h-4 w-4" /> Practice MCQs
              </Button>
              <Button variant="outline" onClick={() => go('exam')} className="gap-2">
                <Target className="h-4 w-4" /> Take Mock Exam
              </Button>
              <Button variant="ghost" onClick={() => go('flashcards')} className="gap-2">
                <Brain className="h-4 w-4" /> Flashcards
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-4 w-4 text-orange-500" /> Daily streak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{progress.streak.current}</span>
              <span className="text-muted-foreground">days in a row</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Longest streak: <strong>{progress.streak.longest}</strong> days. Answer at
              least one question a day to keep it alive.
            </p>
            <p className="text-xs text-muted-foreground">
              Active days total: {progress.activeDays.length}.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={BookOpen}
          label="Chapters completed"
          value={`${chaptersDone} / ${totalChapters}`}
          hint={`${completionPct}% of the syllabus`}
          progress={completionPct}
        />
        <StatCard
          icon={ListChecks}
          label="Questions attempted"
          value={accuracy.attempted.toString()}
          hint={`${accuracy.correct} correct so far`}
        />
        <StatCard
          icon={TrendingUp}
          label="Overall accuracy"
          value={`${accuracy.pct}%`}
          hint={accuracy.pct >= 70 ? 'Solid — push to 85%.' : 'Keep practising weak topics.'}
          progress={accuracy.pct}
        />
        <StatCard
          icon={Target}
          label="Mock exams taken"
          value={progress.exams.length.toString()}
          hint={lastExam ? `Last score: ${lastExam.percentage}%` : 'Take one to see your level.'}
        />
      </section>

      {/* Continue learning grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent activity</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => go('analytics')}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {recentExams.length === 0 ? (
              <EmptyState
                title="No mock exams yet"
                body="Take your first mock exam to see chapter-wise performance, weak topics, and a per-question review here."
                actionLabel="Start mock exam"
                onAction={() => go('exam')}
              />
            ) : (
              <div className="space-y-2">
                {recentExams.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/40 cursor-pointer"
                    onClick={() => go('exam-results', { examId: e.id })}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        Exam · {e.totalQuestions} questions
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(e.startedAt).toLocaleString()} · {e.durationMinutes}m
                      </div>
                    </div>
                    <Badge
                      variant={e.percentage >= 70 ? 'default' : e.percentage >= 40 ? 'secondary' : 'destructive'}
                    >
                      {e.percentage}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weak topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" /> Weakest topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weakTopics.length === 0 ? (
              <EmptyState
                title="No weak spots detected yet"
                body="Answer at least 3 questions on a topic for it to show up here."
                actionLabel="Start practising"
                onAction={() => go('practice')}
              />
            ) : (
              <div className="space-y-2">
                {weakTopics.slice(0, 6).map((t) => (
                  <div key={t} className="flex items-center justify-between gap-2">
                    <span className="text-sm">{t}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => go('practice', { mode: 'weak' })}
                    >
                      Practise
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sponsored sidebar ad */}
        <AdBanner slot="dashboard-sidebar" />
      </section>

      {/* Quick access cards */}
      <section>
        <h2 className="text-xl font-bold mb-3">Quick access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <QuickCard icon={BookOpen} title="Syllabus" body="40 chapters across 6 modules" onClick={() => go('syllabus')} />
          <QuickCard icon={PenLine} title="Practice" body="Topic, chapter, mixed and weak-topic modes" onClick={() => go('practice')} />
          <QuickCard icon={Brain} title="Flashcards" body="Flip and mark Know / Need revision" onClick={() => go('flashcards')} />
          <QuickCard icon={PlayCircle} title="Mock exam" body="Timed, auto-submit, full results" onClick={() => go('exam')} />
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <RefreshCcw className="h-4 w-4" /> Reset progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This clears your chapter completion, flashcard status, attempts, exam results,
              and streak in this browser. The action cannot be undone.
            </p>
            <Button variant="destructive" onClick={() => {
              if (confirm('Reset ALL progress in this browser? This cannot be undone.')) {
                resetAll();
              }
            }}>
              Reset all progress
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  progress,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
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
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
        {progress != null && (
          <Progress value={progress} className="mt-2 h-1.5" />
        )}
      </CardContent>
    </Card>
  );
}

function QuickCard({
  icon: Icon,
  title,
  body,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="pb-2">
        <Icon className="h-5 w-5 text-primary" />
        <CardTitle className="text-base mt-2">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center space-y-3">
      <div className="text-sm font-medium">{title}</div>
      <p className="text-sm text-muted-foreground">{body}</p>
      {actionLabel && onAction && (
        <Button size="sm" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
