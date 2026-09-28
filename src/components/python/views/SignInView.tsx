'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNav, useProgress } from '@/lib/python-course/store';

export function SignInView() {
  const go = useNav((s) => s.go);
  const hydrateFromServer = useProgress((s) => s.hydrateFromServer);
  const syncToServer = useProgress((s) => s.syncToServer);
  const setCloudHydrated = useProgress((s) => s.setCloudHydrated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (!res || res.error) {
      // Common case on Vercel: API returns an error if the database isn't
      // set up (SQLite placeholder doesn't work in serverless). Show a
      // friendly message guiding the user to set up Postgres.
      if (res?.status === 503 || res?.error === 'Configuration') {
        setError(
          'Sign-in is temporarily unavailable. The database is being set up. ' +
          'Until then, you can use all lessons, MCQs, flashcards, and mock exams without signing in — your progress will be saved in this browser.'
        );
      } else {
        setError('Invalid email or password. Please try again.');
      }
      setLoading(false);
      return;
    }

    // Successfully signed in — pull the user's saved progress from the DB.
    try {
      const r = await fetch('/api/progress');
      if (r.ok) {
        const data = await r.json();
        if (data?.ok) {
          // Merge server state into the local store, then push any newer
          // local-only writes back to the server.
          hydrateFromServer(data.progress);
          await syncToServer();
        } else {
          setCloudHydrated(true);
        }
      } else {
        setCloudHydrated(true);
      }
    } catch {
      setCloudHydrated(true);
    }
    setLoading(false);
    go('dashboard');
  };

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-primary" /> Sign in
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" /> Sign in
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => go('signup')}
                className="text-primary font-medium hover:underline"
              >
                Create one
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
