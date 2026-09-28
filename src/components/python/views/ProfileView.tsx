'use client';

import { signOut, useSession } from 'next-auth/react';
import { Cloud, Database, LogOut, Mail, User as UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { selectAccuracy, selectChapterCompletion, useNav, useProgress } from '@/lib/python-course/store';
import { courseContent } from '@/lib/python-course/content';

export function ProfileView() {
  const { data: session, status } = useSession();
  const go = useNav((s) => s.go);
  const progress = useProgress();
  const cloudHydrated = useProgress((s) => s.cloudHydrated);

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-md px-4 sm:px-6 py-12 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-4 sm:px-6 py-12 text-center space-y-3">
        <p className="text-muted-foreground">You are not signed in.</p>
        <Button onClick={() => go('signin')}>Sign in</Button>
      </div>
    );
  }

  const u = session.user as { name?: string | null; email?: string | null; role?: string };
  const chaptersDone = selectChapterCompletion(progress);
  const accuracy = selectAccuracy(progress);
  const totalExams = progress.exams.length;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Your account</h1>
        <p className="mt-2 text-muted-foreground">
          Enrolled in <span className="font-medium text-foreground">Python Exam Prep AI — Chapters 1–40</span>.
        </p>
      </header>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              {(u.name ?? u.email ?? '?')[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">{u.name ?? 'Student'}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                <Mail className="h-3 w-3" /> {u.email}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded border p-2">
              <div className="text-xs text-muted-foreground">Role</div>
              <div className="font-medium flex items-center gap-1">
                <UserIcon className="h-3 w-3" /> {u.role ?? 'STUDENT'}
              </div>
            </div>
            <div className="rounded border p-2">
              <div className="text-xs text-muted-foreground">Cloud sync</div>
              <div className="font-medium flex items-center gap-1">
                <Cloud className="h-3 w-3" /> {cloudHydrated ? 'Active' : 'Pending'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your performance</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Cell label="Chapters done" value={`${chaptersDone} / ${courseContent.chapters.length}`} />
          <Cell label="Questions answered" value={String(accuracy.attempted)} />
          <Cell label="Accuracy" value={`${accuracy.pct}%`} />
          <Cell label="Mock exams" value={String(totalExams)} />
        </CardContent>
      </Card>

      {/* Storage info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" /> Where your data lives
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <Badge variant="default" className="mr-2">Cloud</Badge>
            Your account email, name, and password hash live in the server database.
            Your chapter progress, MCQ attempts, exam results, and flashcard status
            are also stored on the server — they follow you across devices after sign-in.
          </p>
          <p>
            <Badge variant="secondary" className="mr-2">Browser</Badge>
            A cached copy stays in this browser&apos;s localStorage so the app keeps
            working even if the server is briefly unreachable.
          </p>
        </CardContent>
      </Card>

      {/* Sign out */}
      <Card className="border-destructive/30">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-medium">Sign out</div>
            <p className="text-sm text-muted-foreground">
              Your cloud data stays safe. You can sign back in any time.
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => signOut({ callbackUrl: '/' })}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </CardContent>
      </Card>
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
