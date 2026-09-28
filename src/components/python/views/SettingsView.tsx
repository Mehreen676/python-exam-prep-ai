'use client';

import { Moon, RefreshCcw, Sun, SunMoon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useProgress } from '@/lib/python-course/store';

export function SettingsView() {
  const prefs = useProgress((s) => s.preferences);
  const setPreferences = useProgress((s) => s.setPreferences);
  const resetAll = useProgress((s) => s.resetAllProgress);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Preferences are saved in this browser's localStorage. They are not synced
          across devices automatically — sign in on a future version for cloud sync.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Label>Theme</Label>
              <p className="text-xs text-muted-foreground">Choose light, dark, or follow the system.</p>
            </div>
            <Select value={prefs.theme} onValueChange={(v) => setPreferences({ theme: v as 'light' | 'dark' | 'system' })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light"><span className="flex items-center gap-2"><Sun className="h-4 w-4" /> Light</span></SelectItem>
                <SelectItem value="dark"><span className="flex items-center gap-2"><Moon className="h-4 w-4" /> Dark</span></SelectItem>
                <SelectItem value="system"><span className="flex items-center gap-2"><SunMoon className="h-4 w-4" /> System</span></SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Label>Show Roman Urdu notes</Label>
              <p className="text-xs text-muted-foreground">Display the beginner-friendly Roman Urdu hints inside lessons.</p>
            </div>
            <Switch checked={prefs.showRomanUrdu} onCheckedChange={(v) => setPreferences({ showRomanUrdu: v })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Defaults for new mock exams</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default number of questions: <span className="font-bold">{prefs.examDefaultQuestions}</span></Label>
            <Slider min={5} max={40} step={5} value={[prefs.examDefaultQuestions]} onValueChange={(v) => setPreferences({ examDefaultQuestions: v[0] ?? 20 })} />
          </div>
          <div className="space-y-2">
            <Label>Default duration (minutes): <span className="font-bold">{prefs.examDefaultMinutes}</span></Label>
            <Slider min={5} max={120} step={5} value={[prefs.examDefaultMinutes]} onValueChange={(v) => setPreferences({ examDefaultMinutes: v[0] ?? 30 })} />
          </div>
          <div className="space-y-2">
            <Label>Default difficulty filter</Label>
            <Select value={prefs.defaultDifficulty} onValueChange={(v) => setPreferences({ defaultDifficulty: v as 'Mixed' | 'Easy' | 'Medium' | 'Hard' })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mixed">Mixed</SelectItem>
                <SelectItem value="Easy">Easy only</SelectItem>
                <SelectItem value="Medium">Medium only</SelectItem>
                <SelectItem value="Hard">Hard only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Reset all progress in this browser. This clears chapter completion, flashcard
            status, attempts, exam results, and streak. Cannot be undone.
          </p>
          <Button variant="destructive" className="gap-2" onClick={() => {
            if (confirm('Reset ALL progress in this browser? This cannot be undone.')) {
              resetAll();
            }
          }}>
            <RefreshCcw className="h-4 w-4" /> Reset all progress
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
