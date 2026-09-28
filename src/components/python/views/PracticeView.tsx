'use client';

import { ArrowLeft, PenLine, Target, ThumbsDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { MCQRunner } from '@/components/python/parts/MCQRunner';
import { courseContent } from '@/lib/python-course/content';
import {
  selectWeakTopics,
  useNav,
  useProgress,
} from '@/lib/python-course/store';
import type { Difficulty, MCQ } from '@/lib/python-course/types';

type Mode = 'topic' | 'chapter' | 'mixed' | 'weak';

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

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PracticeView() {
  const go = useNav((s) => s.go);
  const navMode = useNav((s) => s.activeMode);
  const navChapter = useNav((s) => s.activeChapter);
  const progress = useProgress();

  const initialMode: Mode = navMode ?? 'topic';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [chapter, setChapter] = useState<number>(navChapter ?? 1);
  const [topic, setTopic] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<'Mixed' | Difficulty>('Mixed');
  const [includeChapters, setIncludeChapters] = useState<number[]>([1, 2, 3, 4, 5]);
  const [count, setCount] = useState<number>(10);
  const [started, setStarted] = useState(false);

  const chapterTopics = useMemo(() => {
    const c = courseContent.chapters.find((c) => c.number === chapter);
    return c?.topics ?? [];
  }, [chapter]);

  // Build the question set when user starts
  const questions = useMemo<PracticeQuestion[]>(() => {
    let pool = courseContent.mcqs;
    if (mode === 'chapter') {
      pool = pool.filter((q) => q.chapter === chapter);
    } else if (mode === 'topic') {
      pool = pool.filter((q) => q.chapter === chapter && (topic === 'all' || q.topic === topic));
    } else if (mode === 'mixed') {
      pool = pool.filter((q) => includeChapters.includes(q.chapter));
    } else if (mode === 'weak') {
      const weak = selectWeakTopics(progress, 0.7);
      if (weak.length === 0) return [];
      pool = pool.filter((q) => {
        const key = `Ch${q.chapter}: ${q.topic}`;
        return weak.includes(key);
      });
    }
    if (difficulty !== 'Mixed') pool = pool.filter((q) => q.difficulty === difficulty);

    const shuffled = shuffle(pool);
    const sliced = shuffled.slice(0, count);
    return sliced.map((q: MCQ): PracticeQuestion => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      code: q.code,
      output: q.output,
      topic: q.topic,
      difficulty: q.difficulty,
      chapter: q.chapter,
    }));
  }, [mode, chapter, topic, difficulty, includeChapters, count, progress]);

  const weakTopicCount = selectWeakTopics(progress, 0.7).length;

  if (started && questions.length > 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">
              {mode === 'topic' && 'Topic practice'}
              {mode === 'chapter' && `Chapter ${chapter} test`}
              {mode === 'mixed' && 'Mixed practice'}
              {mode === 'weak' && 'Weak topics practice'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {questions.length} questions · immediate feedback after each submit
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setStarted(false)} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </header>
        <MCQRunner
          questions={questions}
          mode="practice"
          chapterNumber={chapter}
          onRestart={() => setStarted(false)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Practice</h1>
        <p className="mt-2 text-muted-foreground">
          Pick a mode and start answering. Each question shows its explanation as soon as you submit,
          so practice mode is perfect for learning from mistakes.
        </p>
      </header>

      {/* Mode picker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <ModeButton
          icon={PenLine}
          label="Topic"
          active={mode === 'topic'}
          onClick={() => setMode('topic')}
          desc="One topic, one chapter"
        />
        <ModeButton
          icon={Target}
          label="Chapter"
          active={mode === 'chapter'}
          onClick={() => setMode('chapter')}
          desc="All topics in a chapter"
        />
        <ModeButton
          icon={PenLine}
          label="Mixed"
          active={mode === 'mixed'}
          onClick={() => setMode('mixed')}
          desc="Combine chapters"
        />
        <ModeButton
          icon={ThumbsDown}
          label="Weak"
          active={mode === 'weak'}
          onClick={() => setMode('weak')}
          desc={`Topics you miss (${weakTopicCount})`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {(mode === 'topic' || mode === 'chapter') && (
            <div className="space-y-2">
              <Label>Chapter</Label>
              <Select value={String(chapter)} onValueChange={(v) => { setChapter(Number(v)); setTopic('all'); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a chapter" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {courseContent.chapters.map((c) => (
                    <SelectItem key={c.number} value={String(c.number)}>
                      Ch {c.number}: {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {mode === 'topic' && (
            <div className="space-y-2">
              <Label>Topic</Label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="All topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All topics</SelectItem>
                  {chapterTopics.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {mode === 'mixed' && (
            <div className="space-y-2">
              <Label>Include chapters (tap to toggle)</Label>
              <div className="flex flex-wrap gap-1 max-h-44 overflow-y-auto p-1 rounded border bg-muted/20">
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
                      className={`rounded px-2 py-1 text-xs border ${
                        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'
                      }`}
                    >
                      {c.number}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {includeChapters.length} chapter(s) selected
              </p>
            </div>
          )}

          {mode === 'weak' && (
            <div className="space-y-2">
              <Label>Weak topics</Label>
              <div className="rounded border bg-muted/20 p-3 max-h-44 overflow-y-auto space-y-1">
                {weakTopicCount === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No weak topics detected yet. Answer at least 3 questions on a topic
                    with accuracy below 70% for it to appear here.
                  </p>
                ) : (
                  selectWeakTopics(progress, 0.7).map((t) => (
                    <Badge key={t} variant="outline">{t}</Badge>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as 'Mixed' | Difficulty)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mixed">Mixed</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Number of questions: <span className="font-bold">{count}</span></Label>
            <Slider
              min={5}
              max={30}
              step={5}
              value={[count]}
              onValueChange={(v) => setCount(v[0] ?? 10)}
            />
          </div>

          <Button
            onClick={() => setStarted(true)}
            disabled={mode === 'weak' && weakTopicCount === 0}
            className="w-full gap-2"
          >
            <PenLine className="h-4 w-4" /> Start practice
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ModeButton({
  icon: Icon,
  label,
  active,
  onClick,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition-colors ${
        active ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className="font-medium">{label}</span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}
