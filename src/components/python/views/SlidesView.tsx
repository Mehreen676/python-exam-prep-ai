'use client';

import { ArrowLeft, ArrowRight, CheckCircle2, RefreshCcw, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CodeBlock } from '@/components/python/CodeBlock';
import { useNav, useProgress } from '@/lib/python-course/store';
import type { Chapter, Slide } from '@/lib/python-course/types';

interface SlidesViewProps {
  chapter: Chapter;
}

export function SlidesView({ chapter }: SlidesViewProps) {
  const go = useNav((s) => s.go);
  const incSlidesViewed = useProgress((s) => s.incSlidesViewed);
  const markCompleted = useProgress((s) => s.markChapterCompleted);
  const slides = chapter.slides;
  const [idx, setIdx] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});

  const slide = slides[idx];
  const total = slides.length;
  const progressPct = Math.round(((idx + 1) / total) * 100);

  useEffect(() => {
    // Count a view per slide change (best-effort, throttled to the chapter).
    incSlidesViewed(chapter.number, 1);
  }, [idx, chapter.number]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(i + 1, total - 1));
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total]);

  const next = () => {
    if (idx < total - 1) setIdx(idx + 1);
    else markCompleted(chapter.number);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-mono text-muted-foreground">
            Chapter {chapter.number} · Slide lesson
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{chapter.title}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => go('chapter', { chapter: chapter.number })}>
          ← Back to chapter
        </Button>
      </header>

      <div className="flex items-center gap-3 text-sm">
        <Progress value={progressPct} className="h-1.5 flex-1" />
        <span className="text-muted-foreground">{idx + 1} / {total}</span>
      </div>

      <Card className="min-h-[20rem]">
        <CardContent className="p-6 sm:p-8">
          <SlideRenderer slide={slide} idx={idx} quizAnswered={quizAnswered} quizSubmitted={quizSubmitted} onQuizChoose={(i) => setQuizAnswered((q) => ({ ...q, [idx]: i }))} onQuizSubmit={() => setQuizSubmitted((q) => ({ ...q, [idx]: true }))} />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => setIdx(0)} className="gap-1" disabled={idx === 0}>
          <RefreshCcw className="h-4 w-4" /> Restart
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setIdx((i) => Math.max(i - 1, 0))} disabled={idx === 0} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Previous
          </Button>
          <Button onClick={next} className="gap-1">
            {idx === total - 1 ? 'Finish' : 'Next'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {idx === total - 1 && (
        <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900">
          <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm">
                You have reached the end of the slide lesson. Chapter {chapter.number} marked as completed.
              </p>
            </div>
            <Button size="sm" onClick={() => go('chapter', { chapter: chapter.number })}>
              Back to chapter
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SlideRenderer({
  slide,
  idx,
  quizAnswered,
  quizSubmitted,
  onQuizChoose,
  onQuizSubmit,
}: {
  slide: Slide;
  idx: number;
  quizAnswered: Record<number, number>;
  quizSubmitted: Record<number, boolean>;
  onQuizChoose: (i: number) => void;
  onQuizSubmit: () => void;
}) {
  const selected = quizAnswered[idx];
  const submitted = quizSubmitted[idx];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="capitalize">{slide.kind}</Badge>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{slide.title}</h2>
      </div>
      <div className="prose prose-sm max-w-none">
        <p className="leading-relaxed whitespace-pre-wrap text-foreground/90">{slide.body}</p>
      </div>

      {slide.code && (
        <CodeBlock
          code={slide.code.code}
          language={slide.code.language as 'python' | 'text' | undefined}
          output={slide.code.output}
          showOutputToggle={slide.kind === 'example' || slide.kind === 'syntax'}
        />
      )}

      {slide.diagram && (
        <div className="rounded-lg border bg-muted/40 p-4 grid gap-2">
          {slide.diagram.rows.map((r, i) => (
            <div key={i} className="rounded-md bg-background border p-2 text-center font-mono text-sm">
              {r}
            </div>
          ))}
        </div>
      )}

      {slide.quiz && (
        <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
          <div className="text-sm font-semibold">Mini quiz</div>
          <p className="text-base">{slide.quiz.question}</p>
          <div className="grid gap-2">
            {slide.quiz.options.map((opt, i) => {
              const isSel = selected === i;
              const showCorrect = submitted && i === slide.quiz!.correctIndex;
              const showWrong = submitted && isSel && i !== slide.quiz!.correctIndex;
              return (
                <button
                  key={i}
                  onClick={() => !submitted && onQuizChoose(i)}
                  disabled={submitted}
                  className={`flex items-center gap-3 rounded border p-2 text-left text-sm ${
                    showCorrect
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : showWrong
                      ? 'border-destructive bg-destructive/5'
                      : isSel
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/40'
                  } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className="font-mono">{String.fromCharCode(65 + i)}</span>
                  <span className="flex-1 font-mono">{opt}</span>
                  {showCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {showWrong && <XCircle className="h-4 w-4 text-destructive" />}
                </button>
              );
            })}
          </div>
          {!submitted ? (
            <Button size="sm" onClick={onQuizSubmit} disabled={selected == null}>
              Submit quiz
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground bg-background rounded p-2">
              {slide.quiz.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
