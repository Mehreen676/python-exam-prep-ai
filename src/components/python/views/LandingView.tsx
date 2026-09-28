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
  Sparkles,
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
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 py-12 sm:py-20 items-center">
        <div className="space-y-7 animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 glass px-4 py-1.5 text-xs text-muted-foreground shadow-soft">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
            For Python beginners preparing for exams
            <Sparkles className="h-3 w-3 text-accent animate-pulse" />
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] font-serif">
            Master Python
            <span className="block text-gradient mt-3 animate-gradient-shift">
              Chapters 1 to 40
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
            A clean, modern study companion built around the syllabus of{' '}
            <em className="text-foreground not-italic font-medium">A Smarter Way to Learn Python</em> by Mark Myers.
            Read short lessons, practice with hand-written MCQs, drill flashcards, and take timed mock exams —
            all in your browser, with no signup required.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              size="lg"
              onClick={() => go('dashboard')}
              className="gap-2 shadow-lift hover:scale-[1.03] active:scale-95 transition-transform"
            >
              <Rocket className="h-4 w-4" />
              Start Learning
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => go('practice')}
              className="gap-2 glass hover:scale-[1.03] active:scale-95 transition-transform"
            >
              <PenLine className="h-4 w-4" />
              Take a Practice Test
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => go('syllabus')}
              className="gap-2 hover:scale-[1.03] active:scale-95 transition-transform"
            >
              <BookOpen className="h-4 w-4" />
              Browse Syllabus
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-6 max-w-md">
            <Stat label="Chapters" value={chapterCount} />
            <Stat label="MCQs" value={mcqCount} />
            <Stat label="Flashcards" value={flashcardCount} />
          </div>
        </div>

        <Card className="glass-strong border-gradient shadow-lift animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-xl">
              <Trophy className="h-5 w-5 text-accent" />
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
              'Mehru Tutor AI — syllabus-restricted chatbot',
            ].map((line, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <span className="mt-1.5 inline-flex h-2 w-2 rounded-full bg-gradient-to-r from-primary to-accent transition-transform group-hover:scale-150" />
                <span className="text-sm leading-relaxed">{line}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Sponsored banner */}
      <section className="py-2">
        <AdBanner slot="landing-top" format="horizontal" className="max-w-4xl mx-auto" />
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-serif">
            Everything you need to{' '}
            <span className="text-gradient-warm">revise before the exam</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            The whole platform is built around the Chapters 1–40 syllabus. No out-of-syllabus
            surprises in your practice or mock exams.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <Card
              key={f.title}
              className="glass border-gradient hover:shadow-lift hover:-translate-y-1 transition-all duration-300 group animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <CardHeader>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-soft transition-transform group-hover:scale-110 group-hover:rotate-3">
                  <f.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg mt-4 font-serif">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Module overview */}
      <section className="py-12 sm:py-16">
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-serif">Course modules</h2>
          <p className="mt-2 text-muted-foreground">
            Six modules break the 40 chapters into themed groups so you always know what to study next.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courseContent.modules.map((m, i) => (
            <Card
              key={m.id}
              className="glass border-gradient hover:shadow-lift hover:-translate-y-1 transition-all duration-300 cursor-pointer group animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
              onClick={() => go('syllabus')}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground px-3 py-1 text-xs font-semibold shadow-soft">
                    Module {m.id}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Ch {m.chapterRange[0]}–{m.chapterRange[1]}
                  </span>
                </div>
                <CardTitle className="text-base mt-3 font-serif">{m.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-20">
        <Card className="bg-gradient-to-br from-primary to-accent text-primary-foreground border-gradient shadow-lift overflow-hidden relative">
          <CardContent className="py-12 px-6 sm:px-12 text-center relative z-10">
            <div className="absolute inset-0 bg-grid opacity-10" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-serif relative">
              Ready to start?
            </h2>
            <p className="mt-3 text-primary-foreground/90 max-w-2xl mx-auto relative">
              Your progress is saved automatically in this browser. Jump in with the dashboard
              or take a quick practice test to see where you stand.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center relative">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => go('dashboard')}
                className="hover:scale-[1.03] active:scale-95 transition-transform shadow-soft"
              >
                Open Dashboard
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10 hover:text-primary-foreground hover:scale-[1.03] active:scale-95 transition-all"
                onClick={() => go('exam')}
              >
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
    <div className="rounded-2xl glass border-border/40 px-4 py-3 text-center shadow-soft">
      <div className="text-3xl font-bold font-serif text-gradient">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
