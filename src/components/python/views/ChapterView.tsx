'use client';

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Circle,
  Lightbulb,
  ListChecks,
  PlayCircle,
  Presentation,
  RotateCcw,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CodeBlock } from '@/components/python/CodeBlock';
import { MCQRunner } from '@/components/python/parts/MCQRunner';
import { courseContent } from '@/lib/python-course/content';
import type { Chapter } from '@/lib/python-course/types';
import { useNav, useProgress } from '@/lib/python-course/store';

interface ChapterViewProps {
  chapter: Chapter;
}

export function ChapterView({ chapter }: ChapterViewProps) {
  const go = useNav((s) => s.go);
  const prefs = useProgress((s) => s.preferences);
  const progress = useProgress();
  const markCompleted = useProgress((s) => s.markChapterCompleted);
  const toggleCompleted = useProgress((s) => s.toggleChapterCompleted);

  const chapterMcqs = courseContent.mcqs.filter((q) => q.chapter === chapter.number);
  const chapterFlashcards = courseContent.flashcards.filter((f) => f.chapter === chapter.number);

  const isCompleted = !!progress.chapters[chapter.number]?.completed;
  const [practiceStarted, setPracticeStarted] = useState(false);
  const practiceQuestions = chapterMcqs.slice(0, 5).map((q) => ({
    id: q.id, question: q.question, options: q.options, correctIndex: q.correctIndex,
    explanation: q.explanation, code: q.code, topic: q.topic, difficulty: q.difficulty,
  }));

  const mod = courseContent.modules.find((m) => m.id === chapter.module);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" onClick={() => go('syllabus')} className="gap-1">
            ← Syllabus
          </Button>
          <span className="text-muted-foreground">/</span>
          <Badge variant="secondary">Module {chapter.module}: {mod?.title}</Badge>
        </div>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-mono text-muted-foreground">Chapter {chapter.number}</div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{chapter.title}</h1>
          </div>
          <Button
            variant={isCompleted ? 'default' : 'outline'}
            onClick={() => toggleCompleted(chapter.number)}
            className="gap-2"
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Completed
              </>
            ) : (
              <>
                <Circle className="h-4 w-4" /> Mark as completed
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Quick action row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <QuickAction icon={Presentation} label="Slide lesson" onClick={() => go('slides', { chapter: chapter.number })} />
        <QuickAction icon={Video} label="Video lesson" onClick={() => go('video', { chapter: chapter.number })} />
        <QuickAction icon={ListChecks} label={`Chapter MCQs (${chapterMcqs.length})`} onClick={() => go('practice', { mode: 'chapter', chapter: chapter.number })} />
        <QuickAction icon={BookOpen} label={`Flashcards (${chapterFlashcards.length})`} onClick={() => go('flashcards', { chapter: chapter.number })} />
      </div>

      {/* Learning objectives */}
      <Section title="Learning objectives" icon={Lightbulb}>
        <ul className="space-y-2">
          {chapter.learningObjectives.map((o, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Simple explanation */}
      <Section title="Simple explanation" icon={BookOpen}>
        <div className="space-y-3">
          {chapter.simpleExplanation.map((p, i) => (
            <p key={i} className="leading-relaxed">{p}</p>
          ))}
          {prefs.showRomanUrdu && chapter.romanUrduNotes && chapter.romanUrduNotes.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3">
              <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                Roman Urdu notes
              </div>
              <ul className="space-y-1 text-sm">
                {chapter.romanUrduNotes.map((n, i) => (
                  <li key={i} className="leading-relaxed">{n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>

      {/* Syntax */}
      <Section title="Syntax" icon={Lightbulb}>
        <div className="space-y-3">
          {chapter.syntax.map((s, i) => (
            <CodeBlock
              key={i}
              code={s.code}
              language={s.language as 'python' | 'text' | undefined}
              output={s.output}
            />
          ))}
        </div>
      </Section>

      {/* Code examples */}
      <Section title="Code examples" icon={PlayCircle}>
        <div className="space-y-4">
          {chapter.examples.map((ex, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{ex.description}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CodeBlock code={ex.code.code} language={ex.code.language as 'python' | 'text' | undefined} output={ex.code.output} />
                <p className="text-sm text-muted-foreground leading-relaxed">{ex.explanation}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Common mistakes */}
      <Section title="Common mistakes" icon={AlertCircle}>
        <div className="space-y-3">
          {chapter.commonMistakes.map((m, i) => (
            <Card key={i} className="border-destructive/20">
              <CardContent className="p-4 grid sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase text-destructive">Wrong</div>
                  <pre className="mt-1 font-mono text-sm whitespace-pre-wrap">{m.wrong}</pre>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">Correct</div>
                  <pre className="mt-1 font-mono text-sm whitespace-pre-wrap">{m.correct}</pre>
                </div>
                <div className="sm:col-span-2 text-sm text-muted-foreground">
                  <span className="font-medium">Why: </span>{m.explanation}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Quick revision */}
      <Section title="Quick revision" icon={Lightbulb}>
        <ul className="space-y-2">
          {chapter.quickRevision.map((r, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Chapter practice test */}
      <Section title="Chapter practice test" icon={ListChecks}>
        {!practiceStarted ? (
          <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Test yourself with {practiceQuestions.length} short practice questions from this chapter.
              You will see correct answers and explanations immediately.
            </p>
            <Button onClick={() => setPracticeStarted(true)} className="gap-2">
              <ListChecks className="h-4 w-4" /> Start practice test
            </Button>
          </div>
        ) : (
          <MCQRunner
            questions={practiceQuestions}
            mode="practice"
            chapterNumber={chapter.number}
            onRestart={() => setPracticeStarted(false)}
          />
        )}
      </Section>

      {/* Mark complete CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-5 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-semibold">Done reading?</div>
            <p className="text-sm text-muted-foreground">
              Mark this chapter complete to track progress on your dashboard.
            </p>
          </div>
          <Button onClick={() => markCompleted(chapter.number)} disabled={isCompleted} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {isCompleted ? 'Already completed' : 'Mark as completed'}
          </Button>
        </CardContent>
      </Card>

      {/* Navigation between chapters */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => {
            const prev = chapter.number - 1;
            if (prev >= 1) go('chapter', { chapter: prev });
          }}
          disabled={chapter.number <= 1}
          className="gap-1"
        >
          ← Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const next = chapter.number + 1;
            if (next <= 40) go('chapter', { chapter: next });
          }}
          disabled={chapter.number >= 40}
          className="gap-1"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h2>
      <div className="prose prose-sm max-w-none">{children}</div>
    </section>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="h-auto flex-col items-start gap-1 py-3 text-left"
    >
      <Icon className="h-4 w-4 text-primary" />
      <span className="text-xs">{label}</span>
    </Button>
  );
}
