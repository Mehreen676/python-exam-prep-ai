'use client';

import { CheckCircle2, Clock, Eye, PlayCircle, Youtube } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNav, useProgress } from '@/lib/python-course/store';
import type { Chapter } from '@/lib/python-course/types';

interface VideoViewProps {
  chapter: Chapter;
}

// Local-only override file. An admin can add real YouTube IDs via
// the Admin / Content Management page; they are persisted in localStorage.
const STORAGE_KEY = 'python-exam-prep/video-overrides';

function loadOverrides(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverrides(map: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function VideoView({ chapter }: VideoViewProps) {
  const go = useNav((s) => s.go);
  const incVideosWatched = useProgress((s) => s.incVideosWatched);
  const progress = useProgress();
  const [overrides] = useState(() => loadOverrides());

  const video = chapter.video;
  if (!video) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 text-center">
        <p className="text-muted-foreground">No video lesson configured for this chapter.</p>
        <Button className="mt-4" onClick={() => go('chapter', { chapter: chapter.number })}>
          Back to chapter
        </Button>
      </div>
    );
  }

  const overrideId = overrides[video.id];
  const hasVideo = !!overrideId;
  const watched = (progress.chapters[chapter.number]?.videosWatched ?? 0) > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-mono text-muted-foreground">
            Chapter {chapter.number} · Video lesson
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{chapter.title}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => go('chapter', { chapter: chapter.number })}>
          ← Back to chapter
        </Button>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg">{video.title}</CardTitle>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3.5 w-3.5" /> {video.durationMinutes} min
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasVideo ? (
            <div className="aspect-video w-full overflow-hidden rounded-lg border">
              <iframe
                src={`https://www.youtube.com/embed/${overrideId}`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="aspect-video w-full rounded-lg border border-dashed bg-muted/30 flex flex-col items-center justify-center gap-3 text-center p-6">
              <Youtube className="h-12 w-12 text-muted-foreground/50" />
              <div>
                <p className="font-medium">No verified video URL configured yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  An administrator can add a YouTube video ID for this chapter from the
                  Admin / Content Management page. Until then, you can study using the
                  written lesson and the slide deck — both are complete on their own.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => go('chapter', { chapter: chapter.number })}>
                  Read the lesson
                </Button>
                <Button size="sm" variant="outline" onClick={() => go('slides', { chapter: chapter.number })}>
                  Open slides
                </Button>
                <Button size="sm" variant="ghost" onClick={() => go('admin')}>
                  Admin: add video
                </Button>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm leading-relaxed">{video.description}</p>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
              Key takeaways
            </div>
            <ul className="space-y-1.5">
              {video.takeaways.map((t, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <PlayCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              {watched ? 'Marked as watched' : 'Not marked as watched yet'}
            </div>
            <Button
              variant={watched ? 'default' : 'outline'}
              onClick={() => incVideosWatched(chapter.number)}
              className="gap-2"
              disabled={watched}
            >
              <CheckCircle2 className="h-4 w-4" />
              {watched ? 'Watched' : 'Mark as watched'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
