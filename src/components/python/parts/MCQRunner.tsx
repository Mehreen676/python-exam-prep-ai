'use client';

import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CodeBlock } from '@/components/python/CodeBlock';
import { useProgress } from '@/lib/python-course/store';
import type { Difficulty, MCQ } from '@/lib/python-course/types';

interface PracticeQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  code?: string;
  output?: string;
  topic: string;
  difficulty: Difficulty;
  chapter?: number;
}

interface MCQRunnerProps {
  questions: PracticeQuestion[];
  mode: 'practice' | 'exam';
  chapterNumber?: number;
  onRestart?: () => void;
  onComplete?: (answers: Record<string, number>) => void;
}

/**
 * MCQRunner handles one-question-at-a-time navigation with immediate feedback
 * (practice mode) or end-of-test review (exam mode).
 */
export function MCQRunner({
  questions,
  mode,
  chapterNumber,
  onRestart,
  onComplete,
}: MCQRunnerProps) {
  const recordAttempt = useProgress((s) => s.recordAttempt);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [reviewQueue, setReviewQueue] = useState<string[]>([]); // for retry on practice

  const q = questions[currentIdx];
  const total = questions.length;

  // Build the queue: if review mode, only show items in reviewQueue
  const queue = useMemo(() => {
    if (reviewQueue.length > 0) {
      return questions.filter((x) => reviewQueue.includes(x.id));
    }
    return questions;
  }, [questions, reviewQueue]);
  const currentQueueIdx = Math.min(currentIdx, queue.length - 1);
  const currentQ = queue[currentQueueIdx] ?? q;

  if (!currentQ) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">No questions to show.</p>
          {onRestart && (
            <Button variant="outline" className="mt-3 gap-2" onClick={onRestart}>
              <RotateCcw className="h-4 w-4" /> Back
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const selected = answers[currentQ.id];
  const isSubmitted = submitted[currentQ.id];
  const isCorrect = isSubmitted && selected === currentQ.correctIndex;

  const choose = (idx: number) => {
    if (isSubmitted && mode === 'practice') return; // lock after submit in practice
    setAnswers((a) => ({ ...a, [currentQ.id]: idx }));
  };

  const submit = () => {
    if (selected == null) return;
    setSubmitted((s) => ({ ...s, [currentQ.id]: true }));
    const correct = selected === currentQ.correctIndex;
    recordAttempt({
      mcqId: currentQ.id,
      chapter: chapterNumber ?? currentQ.chapter ?? 0,
      topic: currentQ.topic,
      difficulty: currentQ.difficulty,
      selected,
      correct,
      timestamp: Date.now(),
      mode,
    });
  };

  const next = () => {
    if (currentQueueIdx < queue.length - 1) {
      setCurrentIdx(currentQueueIdx + 1);
    } else if (mode === 'practice') {
      // Loop into review of incorrect ones if any
      const wrong = questions.filter((x) => submitted[x.id] && answers[x.id] !== x.correctIndex);
      if (wrong.length > 0 && reviewQueue.length === 0) {
        setReviewQueue(wrong.map((x) => x.id));
        setCurrentIdx(0);
      } else {
        // Finished
        if (onComplete) onComplete(answers);
      }
    } else if (onComplete) {
      onComplete(answers);
    }
  };

  const prev = () => {
    if (currentQueueIdx > 0) setCurrentIdx(currentQueueIdx - 1);
  };

  const progressPct = Math.round(((currentQueueIdx + 1) / queue.length) * 100);

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 text-sm">
          <Badge variant="secondary">
            {mode === 'practice' ? 'Practice' : 'Exam'} · {currentQ.difficulty}
          </Badge>
          <span className="text-muted-foreground">
            Question {currentQueueIdx + 1} of {queue.length}
            {reviewQueue.length > 0 && ' (retrying wrong ones)'}
          </span>
        </div>
        <Progress value={progressPct} className="h-1.5" />

        {/* Question */}
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">Topic: {currentQ.topic}</div>
          <div className="text-base font-medium leading-relaxed">{currentQ.question}</div>
          {currentQ.code && (
            <CodeBlock
              code={currentQ.code}
              output={mode === 'practice' && isSubmitted ? currentQ.output : undefined}
              showOutputToggle={mode === 'practice' && !isSubmitted}
            />
          )}
        </div>

        {/* Options */}
        <div className="grid gap-2">
          {currentQ.options.map((opt, i) => {
            const isSel = selected === i;
            const showCorrect = isSubmitted && i === currentQ.correctIndex;
            const showWrong = isSubmitted && isSel && i !== currentQ.correctIndex;
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={isSubmitted && mode === 'practice'}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                  showCorrect
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                    : showWrong
                    ? 'border-destructive bg-destructive/5'
                    : isSel
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/40'
                } ${isSubmitted && mode === 'practice' ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className="font-mono text-xs mt-0.5">{String.fromCharCode(65 + i)}</span>
                <span className="flex-1 whitespace-pre-wrap font-mono">{opt}</span>
                {showCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                {showWrong && <XCircle className="h-4 w-4 text-destructive" />}
              </button>
            );
          })}
        </div>

        {/* Explanation — shown only in practice mode after submit */}
        {isSubmitted && mode === 'practice' && (
          <div className={`rounded-lg p-3 border ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900' : 'bg-destructive/5 border-destructive/30'}`}>
            <div className="flex items-center gap-2 text-sm font-semibold mb-1">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Correct
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" /> Incorrect
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{currentQ.explanation}</p>
            {currentQ.output && !currentQ.code && (
              <pre className="mt-2 text-xs font-mono bg-muted/50 rounded p-2">{currentQ.output}</pre>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={prev} disabled={currentQueueIdx === 0} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <div className="flex items-center gap-2">
            {!isSubmitted ? (
              <Button size="sm" onClick={submit} disabled={selected == null}>
                Submit answer
              </Button>
            ) : (
              <Button size="sm" onClick={next} className="gap-1">
                {currentQueueIdx < queue.length - 1 || (mode === 'practice' && questions.some((x) => submitted[x.id] && answers[x.id] !== x.correctIndex) && reviewQueue.length === 0)
                  ? <>Next <ChevronRight className="h-4 w-4" /></>
                  : 'Finish'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
