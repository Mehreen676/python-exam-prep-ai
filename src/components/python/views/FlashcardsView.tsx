'use client';

import { ArrowLeft, ArrowRight, RefreshCcw, Shuffle, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { courseContent } from '@/lib/python-course/content';
import { useNav, useProgress } from '@/lib/python-course/store';

export function FlashcardsView() {
  const navChapter = useNav((s) => s.activeChapter);
  const go = useNav((s) => s.go);
  const flashcards = courseContent.flashcards;
  const progress = useProgress();
  const setStatus = useProgress((s) => s.setFlashcardStatus);
  const resetFlashcards = useProgress((s) => s.resetFlashcards);

  const [chapterFilter, setChapterFilter] = useState<number>(navChapter ?? 0);
  const [onlyReview, setOnlyReview] = useState(false);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);

  const filtered = useMemo(() => {
    let list = flashcards;
    if (chapterFilter > 0) list = list.filter((f) => f.chapter === chapterFilter);
    if (onlyReview) list = list.filter((f) => progress.flashcards[f.id] === 'review');
    if (shuffleSeed > 0) {
      // Shuffle deterministically by seed
      const a = list.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = (shuffleSeed * (i + 7)) % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
      }
      list = a;
    }
    return list;
  }, [flashcards, chapterFilter, onlyReview, progress.flashcards, shuffleSeed]);

  const card = filtered[idx];

  const next = () => {
    setFlipped(false);
    setIdx((i) => (i + 1) % Math.max(1, filtered.length));
  };
  const prev = () => {
    setFlipped(false);
    setIdx((i) => (i - 1 + filtered.length) % Math.max(1, filtered.length));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
          {navChapter != null && (
            <Button variant="ghost" size="sm" onClick={() => go('chapter', { chapter: navChapter })}>
              ← Back to chapter
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">
          Tap a card to flip it. Mark Know it or Need revision to filter your review sessions.
        </p>
      </header>

      {/* Controls */}
      <Card>
        <CardContent className="p-4 grid sm:grid-cols-3 gap-3 items-end">
          <div className="space-y-2">
            <Label>Chapter</Label>
            <Select value={String(chapterFilter)} onValueChange={(v) => { setChapterFilter(Number(v)); setIdx(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="All chapters" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="0">All chapters</SelectItem>
                {courseContent.chapters.map((c) => (
                  <SelectItem key={c.number} value={String(c.number)}>
                    Ch {c.number}: {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant={onlyReview ? 'secondary' : 'outline'}
            onClick={() => { setOnlyReview((v) => !v); setIdx(0); }}
            className="gap-1"
          >
            <ThumbsDown className="h-4 w-4" />
            {onlyReview ? 'Showing Need revision only' : 'Show only Need revision'}
          </Button>
          <Button variant="outline" onClick={() => { setShuffleSeed((s) => s + 1); setIdx(0); }} className="gap-1">
            <Shuffle className="h-4 w-4" /> Shuffle
          </Button>
        </CardContent>
      </Card>

      {/* Card */}
      {!card ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              No cards match this filter. Try changing the chapter or turning off the Need-revision filter.
            </p>
            <Button variant="outline" size="sm" onClick={() => { setOnlyReview(false); setChapterFilter(0); setIdx(0); }} className="gap-1">
              <RefreshCcw className="h-4 w-4" /> Reset filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm">
            <Badge variant="secondary">Card {idx + 1} of {filtered.length}</Badge>
            <Badge variant="outline" className="capitalize">{card.kind}</Badge>
          </div>

          {/* Flip card */}
          <button
            onClick={() => setFlipped((f) => !f)}
            className="block w-full text-left"
            aria-label={flipped ? 'Showing answer — tap to flip back' : 'Showing question — tap to reveal answer'}
          >
            <div
              className={`relative w-full min-h-[16rem] rounded-2xl border-2 transition-all duration-200 ${
                flipped ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800' : 'bg-card border-primary/30'
              }`}
            >
              <CardContent className="p-6 sm:p-8">
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                  {flipped ? 'Answer' : 'Question'}
                </div>
                {card.code && !flipped && (
                  <pre className="mb-3 rounded-lg border bg-muted/40 p-3 text-sm font-mono overflow-x-auto whitespace-pre-wrap">{card.code}</pre>
                )}
                <p className="text-base leading-relaxed whitespace-pre-wrap">{flipped ? card.back : card.front}</p>
                <div className="mt-6 text-xs text-muted-foreground">
                  {flipped ? 'Tap to flip back' : 'Tap to reveal answer'}
                </div>
              </CardContent>
            </div>
          </button>

          {/* Status buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={progress.flashcards[card.id] === 'know' ? 'default' : 'outline'}
              onClick={() => { setStatus(card.id, 'know'); next(); }}
              className="gap-2"
            >
              <ThumbsUp className="h-4 w-4" /> Know it
            </Button>
            <Button
              variant={progress.flashcards[card.id] === 'review' ? 'destructive' : 'outline'}
              onClick={() => { setStatus(card.id, 'review'); next(); }}
              className="gap-2"
            >
              <ThumbsDown className="h-4 w-4" /> Need revision
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" onClick={prev} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Previous
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { resetFlashcards(); }} className="text-muted-foreground">
              Reset all flashcard status
            </Button>
            <Button variant="ghost" onClick={next} className="gap-1">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
