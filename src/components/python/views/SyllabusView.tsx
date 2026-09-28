'use client';

import { CheckCircle2, Circle, Filter } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { courseContent } from '@/lib/python-course/content';
import { useNav, useProgress } from '@/lib/python-course/store';

export function SyllabusView() {
  const go = useNav((s) => s.go);
  const progress = useProgress();
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);

  const chapters = courseContent.chapters.filter((c) => {
    if (moduleFilter !== 'all' && c.module !== moduleFilter) return false;
    if (onlyIncomplete && progress.chapters[c.number]?.completed) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Course syllabus</h1>
        <p className="mt-2 text-muted-foreground">
          {courseContent.chapters.length} chapters across {courseContent.modules.length} modules.
          Tap a chapter to read the lesson, view slides, take a chapter test, or mark it complete.
        </p>
      </header>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" /> Filters:
          </div>
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant={moduleFilter === 'all' ? 'secondary' : 'ghost'}
              onClick={() => setModuleFilter('all')}
            >
              All modules
            </Button>
            {courseContent.modules.map((m) => (
              <Button
                key={m.id}
                size="sm"
                variant={moduleFilter === m.id ? 'secondary' : 'ghost'}
                onClick={() => setModuleFilter(m.id)}
              >
                Module {m.id}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant={onlyIncomplete ? 'secondary' : 'outline'}
            onClick={() => setOnlyIncomplete((v) => !v)}
            className="ml-auto"
          >
            {onlyIncomplete ? 'Showing incomplete only' : 'Show incomplete only'}
          </Button>
        </CardContent>
      </Card>

      {/* Module-grouped list */}
      <div className="space-y-8">
        {courseContent.modules
          .filter((m) => moduleFilter === 'all' || m.id === moduleFilter)
          .map((mod) => {
            const moduleChapters = chapters.filter((c) => c.module === mod.id);
            if (moduleChapters.length === 0) return null;
            const done = moduleChapters.filter((c) => progress.chapters[c.number]?.completed).length;
            return (
              <section key={mod.id}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-xl font-bold">
                      Module {mod.id}: {mod.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">{mod.description}</p>
                  </div>
                  <Badge variant="secondary">
                    {done} / {moduleChapters.length} done
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {moduleChapters.map((c) => {
                    const isDone = !!progress.chapters[c.number]?.completed;
                    const attempts = useProgress.getState().attempts.filter((a) => a.chapter === c.number).length;
                    return (
                      <Card
                        key={c.number}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => go('chapter', { chapter: c.number })}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-muted-foreground">
                              Chapter {c.number}
                            </span>
                            {isDone ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground/40" />
                            )}
                          </div>
                          <CardTitle className="text-base mt-1">{c.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-1">
                            {c.topics.slice(0, 3).map((t) => (
                              <Badge key={t} variant="outline" className="text-xs">
                                {t}
                              </Badge>
                            ))}
                          </div>
                          <div className="mt-3 text-xs text-muted-foreground">
                            {attempts > 0 ? `${attempts} questions attempted` : 'No questions attempted yet'}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
      </div>
    </div>
  );
}
