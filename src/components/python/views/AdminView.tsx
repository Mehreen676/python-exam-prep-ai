'use client';

import { Download, RefreshCcw, Search, Upload, Video as VideoIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { courseContent } from '@/lib/python-course/content';

const VIDEO_OVERRIDES_KEY = 'python-exam-prep/video-overrides';
const CONTENT_OVERRIDES_KEY = 'python-exam-prep/content-overrides';

function loadVideoOverrides(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(VIDEO_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveVideoOverrides(map: Record<string, string>) {
  try {
    localStorage.setItem(VIDEO_OVERRIDES_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function loadContentOverrides(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CONTENT_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveContentOverrides(map: Record<string, any>) {
  try {
    localStorage.setItem(CONTENT_OVERRIDES_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function AdminView() {
  const [videoOverrides, setVideoOverrides] = useState<Record<string, string>>(() => loadVideoOverrides());
  const [contentOverrides] = useState<Record<string, any>>(() => loadContentOverrides());
  const [search, setSearch] = useState('');

  const chapters = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return courseContent.chapters;
    return courseContent.chapters.filter((c) =>
      c.title.toLowerCase().includes(s) || String(c.number).includes(s) || c.topics.some((t) => t.toLowerCase().includes(s))
    );
  }, [search]);

  const updateVideoId = (videoId: string, youTubeId: string) => {
    const next = { ...videoOverrides };
    if (youTubeId.trim()) {
      next[videoId] = youTubeId.trim();
    } else {
      delete next[videoId];
    }
    saveVideoOverrides(next);
    setVideoOverrides(next);
  };

  const exportContent = () => {
    const blob = new Blob(
      [JSON.stringify({ course: courseContent, videoOverrides, contentOverrides }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'python-exam-prep-content.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importContent = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (data.videoOverrides && typeof data.videoOverrides === 'object') {
          saveVideoOverrides(data.videoOverrides);
          setVideoOverrides(data.videoOverrides);
        }
        if (data.contentOverrides && typeof data.contentOverrides === 'object') {
          saveContentOverrides(data.contentOverrides);
        }
        alert('Imported successfully. Reloading…');
        location.reload();
      } catch {
        alert('Failed to parse JSON. Please check the file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="gap-1">
            Local dev tool
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Content management</h1>
        </div>
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
          <CardContent className="p-4 text-sm space-y-2">
            <p>
              <strong>This page is NOT secure.</strong> There is no authentication in the
              first version. Anyone with access to this browser can edit the content below.
              Do not deploy this admin page to a public URL without adding authentication.
            </p>
            <p>
              Edits made here are stored in your browser's localStorage and override the
              default content. They are NOT written back to the source files.
            </p>
          </CardContent>
        </Card>
      </header>

      {/* Export / import */}
      <Card>
        <CardHeader>
          <CardTitle>Export / import content</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2" onClick={exportContent}>
            <Download className="h-4 w-4" /> Export JSON
          </Button>
          <label className="inline-flex items-center gap-2 rounded-md border px-3 h-9 cursor-pointer hover:bg-accent text-sm">
            <Upload className="h-4 w-4" /> Import JSON
            <input type="file" accept="application/json" className="hidden" onChange={importContent} />
          </label>
          <Button variant="ghost" className="gap-2 ml-auto text-destructive" onClick={() => {
            if (confirm('Clear ALL content overrides?')) {
              saveVideoOverrides({});
              saveContentOverrides({});
              setVideoOverrides({});
              alert('Cleared. Reloading…');
              location.reload();
            }
          }}>
            <RefreshCcw className="h-4 w-4" /> Clear overrides
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Chapters" value={courseContent.chapters.length} />
        <Stat label="MCQs" value={courseContent.mcqs.length} />
        <Stat label="Flashcards" value={courseContent.flashcards.length} />
      </div>

      {/* Chapter list with editable fields */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Chapters</CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chapters"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {chapters.map((c) => {
            const videoId = c.video?.id;
            const youTubeId = videoId ? videoOverrides[videoId] ?? '' : '';
            const mcqs = courseContent.mcqs.filter((q) => q.chapter === c.number);
            const flashcards = courseContent.flashcards.filter((f) => f.chapter === c.number);
            return (
              <div key={c.number} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground">Chapter {c.number} · Module {c.module}</div>
                    <div className="text-base font-semibold">{c.title}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{mcqs.length} MCQs</Badge>
                    <Badge variant="outline">{flashcards.length} cards</Badge>
                    <Badge variant="outline">{c.slides.length} slides</Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Topics: {c.topics.join(', ')}
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs">
                    <VideoIcon className="h-3.5 w-3.5" /> YouTube video ID (optional)
                  </Label>
                  <Input
                    placeholder="e.g. dQw4w9WgXcQ — leave blank to show empty state"
                    value={youTubeId}
                    onChange={(e) => videoId && updateVideoId(videoId, e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste just the video ID from <code className="font-mono">youtu.be/&lt;ID&gt;</code> or <code className="font-mono">youtube.com/watch?v=&lt;ID&gt;</code>.
                  </p>
                </div>
                <div>
                  <Label className="text-xs">Chapter description (read-only preview)</Label>
                  <Textarea
                    value={c.simpleExplanation.join('\n\n')}
                    readOnly
                    className="mt-1 font-mono text-xs"
                    rows={3}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
