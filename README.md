# Python Exam Prep AI

> **Created by Mehreen Zohair** · Owner: Mehreen Zohair

An interactive Python study companion built around **Chapters 1–40** of
*A Smarter Way to Learn Python* by Mark Myers. Read lessons, practice with
hand-written MCQs, drill flashcards, and take timed mock exams — all in the
browser, no signup required.

> **Syllabus scope.** The course covers Chapters 1–40 only. Functions,
> classes, file I/O, NumPy/Pandas, and other advanced topics are intentionally
> out of scope. Every MCQ in the bank is from a chapter in this range.

## What's included

- **40 chapters** across 6 modules: print, variables, math, conditions,
  lists, tuples, loops, input/strings, and dictionaries.
- **400 hand-written MCQs** (~10 per chapter) with explanations, all
  verified against Python 3 behavior. Question types include concept,
  syntax, predict-the-output, and find-the-error.
- **271 flashcards** generated from each chapter's content.
- **Slide lessons** with reveal-the-output code cards and an end-of-lesson quiz.
- **Mehru Tutor AI chatbot** — a floating chat widget on every page that calls a
  server-side Next.js API route (`/api/tutor`). Created by Mehreen Zohair, this
  AI tutor is restricted to the Chapters 1–40 syllabus by a pinned system
  prompt, refuses out-of-syllabus questions, includes code examples with output,
  adds Roman Urdu one-liners, and always ends with a clear "(AI-generated
  answer — verify against your textbook.)" disclaimer. The rest of the app
  keeps working if the tutor is unavailable.
- **Video lessons** — optional YouTube IDs can be added per chapter from
  the Admin page; empty state shows when no URL is configured.
- **4 practice modes**: topic, chapter, mixed, and weak-topics.
- **Timed mock exams** with countdown timer, question navigator,
  mark-for-review, auto-submit on timeout, and a detailed results page.
- **Dashboard and analytics** with real calculated numbers (chapter
  completion, accuracy, streak, weak topics, recent exams).
- **Local content management** tool to add YouTube IDs, export/import
  content as JSON.
- **localStorage persistence** with graceful fallback — progress is
  browser-specific, not synced across devices.
- **Light / dark / system theme**, mobile-first responsive design.

## Tech stack

- **Next.js 16** (App Router) with TypeScript
- **Tailwind CSS 4** + **shadcn/ui** components (New York style)
- **Zustand** for client state and persisted progress
- **Lucide** icons
- No backend, no database, no paid services — first version runs fully client-side.

## Project layout

```
src/
├── app/
│   ├── layout.tsx                Root layout + metadata
│   └── page.tsx                  Single visible route — renders <AppShell />
├── components/
│   └── python/
│       ├── AppShell.tsx          Top-level view switcher
│       ├── TopNav.tsx            Sticky responsive header
│       ├── Footer.tsx            Sticky footer
│       ├── CodeBlock.tsx         Lightweight Python syntax highlighter
│       ├── parts/
│       │   └── MCQRunner.tsx      Reusable MCQ engine (practice + exam)
│       └── views/
│           ├── LandingView.tsx
│           ├── DashboardView.tsx
│           ├── SyllabusView.tsx
│           ├── ChapterView.tsx
│           ├── SlidesView.tsx
│           ├── VideoView.tsx
│           ├── PracticeView.tsx
│           ├── FlashcardsView.tsx
│           ├── ExamView.tsx
│           ├── ExamResultsView.tsx
│           ├── AnalyticsView.tsx
│           ├── SettingsView.tsx
│           └── AdminView.tsx
└── lib/
    └── python-course/
        ├── types.ts             All domain types
        ├── content.ts           AUTO-GENERATED course content (40 chapters, 400 MCQs, 271 flashcards)
        ├── store.ts             Zustand store + selectors
        └── progress-types.ts   Re-exports of types
scripts/
└── generate_python_course.py    Generator that produces content.ts from a Python data table
```

### Where is the course content?

All chapter lessons, MCQs, flashcards, and slide content live in a single
auto-generated TypeScript file:

```
src/lib/python-course/content.ts
```

It is produced by `scripts/generate_python_course.py` from a hand-written
data table inside that script. To add or edit content, edit the table in
the Python script and re-run it, or use the in-app Admin page for
lightweight overrides stored in localStorage.

## Local development

Requirements: Node.js 18+, [Bun](https://bun.sh) (or npm/pnpm/yarn).

```bash
# 1. Install dependencies
bun install        # or: npm install

# 2. Start the dev server
bun run dev        # or: npm run dev
# App runs on http://localhost:3000

# 3. Lint
bun run lint       # or: npm run lint

# 4. Production build
bun run build      # or: npm run build

# 5. Start the production server
bun run start      # or: npm run start
```

## Adding or editing content

### Option A — Edit the source data (recommended for permanent changes)

1. Open `scripts/generate_python_course.py`.
2. Edit the relevant tables: `CHAPTERS` for titles/topics/briefs,
   `MCQ_TABLE` for questions, `build_flashcards()` returns cards derived
   from chapter content, `build_slides()` returns slides derived from
   chapter content.
3. Re-run the generator:

   ```bash
   python3 scripts/generate_python_course.py
   ```

4. Lint and test in the browser.

### Option B — Use the in-app Admin page (per-browser overrides)

1. Click **Admin** in the top navigation.
2. Search for the chapter you want to edit.
3. Paste a YouTube video ID in the input field — it is saved to
   localStorage and overrides the default immediately.
4. Use **Export JSON** to download a snapshot of all overrides, and
   **Import JSON** to apply them on another machine.

> The Admin page is intentionally labeled as a **local development tool**.
> It is not authenticated. Do not deploy it to a public URL without
> adding authentication first.

## Deployment to Vercel

The app is a standard Next.js 16 project — no environment variables are
required for the first version.

1. Push the project to a Git repository (GitHub, GitLab, or Bitbucket).
2. Go to <https://vercel.com> and import the repository.
3. Vercel auto-detects Next.js. Accept the defaults:
   - **Framework preset**: Next.js
   - **Build command**: `next build` (or `bun run build`)
   - **Output directory**: `.next`
   - **Install command**: `npm install` (or `bun install`)
4. Click **Deploy**. Vercel builds and hosts the app on a `*.vercel.app`
   URL.

### Optional: enabling the AI Tutor

The codebase reserves a clean extension point for an AI tutor on a future
server-side route. To wire it up:

1. Set `OPENAI_API_KEY` (or any other LLM provider key) in Vercel
   environment variables.
2. Create `src/app/api/tutor/route.ts` that proxies requests to the LLM,
   validates input, and restricts the conversation to the Chapters 1–40
   syllabus.
3. Keep all API-key handling on the server; never expose keys in client
   code.

## Authentication and cloud-stored progress

The first version of the app kept all progress in browser `localStorage`.
This version adds **NextAuth + Prisma + SQLite** so students can create
real accounts and have their progress follow them across devices.

- **Sign up** at the Sign Up button in the top nav. Email + name + password
  (min 6 chars). Password is hashed with bcrypt before storage — never
  plaintext.
- **Sign in** at the Sign In button. Uses NextAuth's Credentials provider
  with JWT session strategy.
- **Auto cloud sync**: every chapter completion, MCQ attempt, exam result,
  and flashcard status is written to the local Zustand store AND pushed to
  the server via `POST /api/progress` in the background. On the next
  sign-in (from any device), the store is hydrated from the server via
  `GET /api/progress` and merged with any local-only writes.
- **Profile page**: open it from the avatar button in the top nav. Shows
  email, role, cloud-sync status, and a live performance summary pulled
  from the database.

### Database schema

Defined in `prisma/schema.prisma`. Run `bun run db:push` after any change.

```
User                — id, email (unique), name, hashedPassword, role, timestamps
ChapterCompletion   — userId, chapterNumber, completed, markedAt, slidesViewed, videosWatched
Attempt             — userId, mcqId, chapter, topic, difficulty, selected, correct, mode, timestamp
ExamResult          — userId, startedAt, finishedAt, total/correct/incorrect/unanswered, percentage, JSON blobs for detailed + chapterPerf + weakTopics
FlashcardStatus     — userId, cardId, status (know | review)
```

### Auth + DB API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth sign-in, sign-out, session, CSRF, providers |
| `/api/auth/signup` | POST | Create a new user (bcrypt-hashed password) |
| `/api/progress` | GET | Pull the signed-in user's chapters/attempts/exams/flashcards |
| `/api/progress` | POST | Upsert the signed-in user's progress (idempotent) |
| `/api/tutor` | POST | Mehru Tutor AI chatbot (LLM-backed) |

### Local setup

The `.env` file ships with sensible local defaults:

```
DATABASE_URL=file:/home/z/my-project/db/custom.db
NEXTAUTH_SECRET=dev-only-secret-please-change-in-production
NEXTAUTH_URL=http://localhost:3000
```

After cloning, run:

```bash
bun install
bun run db:push     # create the SQLite DB file
bun run dev         # http://localhost:3000
```

### Deploying auth + DB to Vercel

SQLite is a file-based database and works in local dev but **does not
work on Vercel** because Vercel serverless functions are stateless and
read-only on the filesystem. For production you have two options:

**Option 1 — Vercel Postgres (recommended, free tier available)**

1. Create a Postgres database at <https://vercel.com/docs/storage/vercel-postgres>
   or use a free Neon/Supabase Postgres instance.
2. In Vercel project settings → Environment Variables, set:
   - `DATABASE_URL` = your Postgres connection string
   - `NEXTAUTH_SECRET` = a long random string (run `openssl rand -base64 32`)
   - `NEXTAUTH_URL` = your Vercel app URL (e.g. `https://python-exam-prep-ai.vercel.app`)
3. Change the `provider` in `prisma/schema.prisma` from `"sqlite"` to
   `"postgresql"` and run `bun run db:push` locally against the Postgres
   URL so the schema is created.
4. Redeploy — auth and cloud sync work automatically.

**Option 2 — Keep SQLite for local-only use**

If you only want to demo the app locally, the SQLite setup above is fine.
Just don't deploy to a serverless host; data will be lost on each cold
start.



- **Progress is browser-local for signed-out users.** Once a student signs
  in, their progress is synced to the database (SQLite locally; Postgres on
  Vercel) and follows them across devices. Signed-out users still get the
  full localStorage-only experience.
- **Authentication is implemented but the Admin page is still unprotected.**
  All signed-in users have role `STUDENT` by default. The Admin page is
  not yet gated by the `ADMIN` role — anyone with a signed-in account can
  currently view it. Add a role check before deploying to production.
- **Video URLs are not pre-configured.** Every chapter shows an empty
  state for video lessons until an admin adds a YouTube ID. The written
  lesson and slide deck are complete on their own.
- **PDF source not parsed.** The uploaded PDF
  (`/home/z/my-project/upload/A Smarter Way to Learn Python …pdf`) was
  not present on the server at build time, so chapter titles for the
  dictionaries module (Chapters 25–40) use descriptive labels based on
  the user-supplied syllabus rather than literal book chapter headings.
  Re-running the generator with the PDF's chapter list will tighten
  this if needed.
- **AI tutor not implemented** in the first version. The architecture is
  ready for it; nothing in the UI claims to use AI.

## License

This project is a study aid. Chapter titles and the syllabus ordering
reference *A Smarter Way to Learn Python* by Mark Myers; all lesson text,
examples, MCQs, and flashcards are original content written for this app.
