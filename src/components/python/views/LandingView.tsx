'use client';

import {
  BookOpen,
  Brain,
  Clock,
  GraduationCap,
  ListChecks,
  PenLine,
  PlayCircle,
  Rocket,
  Target,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNav } from '@/lib/python-course/store';
import { courseContent } from '@/lib/python-course/content';
import { AdBanner } from '@/components/python/AdBanner';

const FEATURES = [
  {
    icon: BookOpen,
    title: '40 chapters of lessons',
    body: 'Simple English explanations, original examples, syntax blocks, and Roman Urdu notes — one short chapter at a time.',
  },
  {
    icon: PlayCircle,
    title: 'Slide lessons + videos',
    body: 'Each chapter includes an interactive slide deck with reveal-the-output cards and a quiz at the end. Video URLs can be added later by an admin.',
  },
  {
    icon: ListChecks,
    title: '400 practice MCQs',
    body: 'A hand-written question bank covering every chapter. Concept, syntax, predict-the-output, and find-the-error styles — all verified against Python 3.',
  },
  {
    icon: Brain,
    title: 'Flashcards that adapt',
    body: 'Flip cards, mark them as Know it or Need revision, and review only the difficult ones across the whole syllabus.',
  },
  {
    icon: Clock,
    title: 'Timed mock exams',
    body: 'Configurable length and duration. Countdown timer, mark-for-review, automatic submission, and a detailed results page with per-chapter performance.',
  },
  {
    icon: Target,
    title: 'Weak-topic tracking',
    body: 'Your accuracy is tracked per topic. One tap to launch a focused practice session on exactly what you keep getting wrong.',
  },
];

export function LandingView() {
  const go = useNav((s) => s.go);
  const chapterCount = courseContent.chapters.length;
  const mcqCount = courseContent.mcqs.length;
  const flashcardCount = courseContent.flashcards.length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-12 sm:py-16 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5" />
            For Python beginners preparing for exams
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Master Python
            <span className="block text-primary mt-2">Chapters 1 to 40</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A clean, modern study companion built around the syllabus of{' '}
            <em>A Smarter Way to Learn Python</em> by Mark Myers. Read short lessons,
            practice with hand-written MCQs, drill flashcards, and take timed mock exams —
            all in your browser, with no signup required.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => go('dashboard')} className="gap-2">
              <Rocket className="h-4 w-4" />
              Start Learning
            </Button>
            <Button size="lg" variant="outline" onClick={() => go('practice')} className="gap-2">
              <PenLine className="h-4 w-4" />
              Take a Practice Test
            </Button>
            <Button size="lg" variant="ghost" onClick={() => go('syllabus')} className="gap-2">
              <BookOpen className="h-4 w-4" />
              Browse Syllabus
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 max-w-md">
            <Stat label="Chapters" value={chapterCount} />
            <Stat label="MCQs" value={mcqCount} />
            <Stat label="Flashcards" value={flashcardCount} />
          </div>
        </div>

        <Card className="bg-gradient-to-br from-primary/5 via-card to-muted/30 border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              What you get
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              'Beginner-friendly explanations with Roman Urdu notes',
              'Interactive slide lessons with reveal-the-output cards',
              'Timed mock exams with automatic submission',
              'Per-chapter and per-topic progress tracking',
              'Flashcards you can mark Know it / Need revision',
              'Works offline — progress stored in your browser',
            ].map((line, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-sm">{line}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Sponsored banner — supports AdSense or Adsterra via env vars */}
      <section className="py-2">
        <AdBanner slot="landing-top" format="horizontal" className="max-w-4xl mx-auto" />
      </section>

      {/* Features */}
      <section className="py-8 sm:py-12">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">
          Everything you need to revise before the exam
        </h2>
        <p className="mt-2 text-muted-foreground text-center max-w-2xl mx-auto">
          The whole platform is built around the Chapters 1–40 syllabus. No out-of-syllabus
          surprises in your practice or mock exams.
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg mt-3">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Module overview */}
      <section className="py-8 sm:py-12">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Course modules</h2>
        <p className="mt-2 text-muted-foreground">
          Six modules break the 40 chapters into themed groups so you always know what to study next.
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courseContent.modules.map((m) => (
            <Card key={m.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => go('syllabus')}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    Module {m.id}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Ch {m.chapterRange[0]}–{m.chapterRange[1]}
                  </span>
                </div>
                <CardTitle className="text-base mt-2">{m.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-10 px-6 sm:px-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Ready to start?
            </h2>
            <p className="mt-2 text-primary-foreground/80 max-w-2xl mx-auto">
              Your progress is saved automatically in this browser. Jump in with the dashboard
              or take a quick practice test to see where you stand.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Button size="lg" variant="secondary" onClick={() => go('dashboard')}>
                Open Dashboard
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => go('exam')}>
                Take a Mock Exam
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
