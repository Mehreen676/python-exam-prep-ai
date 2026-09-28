'use client';

import { useState } from 'react';
import { Check, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { selectAccuracy, selectChapterCompletion, useNav, useProgress } from '@/lib/python-course/store';
import { courseContent } from '@/lib/python-course/content';

export function ProfileView() {
  const go = useNav((s) => s.go);
  const username = useProgress((s) => s.username);
  const setUsername = useProgress((s) => s.setUsername);
  const progress = useProgress();
  const [draftName, setDraftName] = useState(username ?? '');
  const [saved, setSaved] = useState(false);

  const chaptersDone = selectChapterCompletion(progress);
  const accuracy = selectAccuracy(progress);

  const save = () => {
    const trimmed = draftName.trim();
    setUsername(trimmed ? trimmed.slice(0, 40) : null);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Your profile</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your name so the app can greet you. No email, no password — your
          name and progress are saved locally in this browser.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-primary" /> Your name
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              {(username?.trim() ?? '?')[0]?.toUpperCase()}
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="name" className="sr-only">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name (e.g., Mehreen Zohair)"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                maxLength={40}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') save();
                }}
              />
            </div>
            <Button onClick={save} className="gap-2" disabled={draftName.trim() === (username ?? '')}>
              {saved ? (
                <>
                  <Check className="h-4 w-4" /> Saved
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {username
              ? `Currently saved as: ${username}`
              : 'No name set yet. Tap Save to set one.'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your performance</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Cell label="Chapters done" value={`${chaptersDone} / ${courseContent.chapters.length}`} />
          <Cell label="Questions answered" value={String(accuracy.attempted)} />
          <Cell label="Accuracy" value={`${accuracy.pct}%`} />
          <Cell label="Mock exams" value={String(progress.exams.length)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Where your data lives</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Your name, chapter progress, MCQ attempts, exam results, and flashcard
            status are stored in this browser&apos;s localStorage. They stay on
            your device — nothing is sent to a server.
          </p>
          <p>
            If you clear your browser data or switch devices, you will start fresh.
            This is fine for exam prep where you mostly study from one device.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button variant="outline" onClick={() => go('dashboard')}>
          ← Back to dashboard
        </Button>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
