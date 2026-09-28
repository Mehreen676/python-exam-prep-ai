'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNav, useProgress } from '@/lib/python-course/store';

export function SignUpView() {
  const go = useNav((s) => s.go);
  const hydrateFromServer = useProgress((s) => s.hydrateFromServer);
  const syncToServer = useProgress((s) => s.syncToServer);
  const setCloudHydrated = useProgress((s) => s.setCloudHydrated);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const r = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        setError(data?.error ?? 'Sign up failed. Please try again.');
        setLoading(false);
        return;
      }

      // Auto sign-in after signup.
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (!res || res.error) {
        setError('Account created — please sign in.');
        setLoading(false);
        go('signin');
        return;
      }

      // New user — push any localStorage progress to their new account.
      try {
        await syncToServer();
      } catch {
        /* ignore */
      }
      setCloudHydrated(true);
      go('dashboard');
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Create account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Mehreen Zohair"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                maxLength={60}
              />
            </div>
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
              <Label htmlFor="password">Password <span className="text-xs text-muted-foreground">(min 6 chars)</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pr-10"
                  minLength={6}
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" /> Create account
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => go('signin')}
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
