import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// ---------------------------------------------------------------------------
// Mehru Tutor AI — server-side route.
//
// Created by Mehreen Zohair. This is the AI tutor inside "Python Exam Prep AI".
//
// IMPORTANT:
//   - z-ai-web-dev-sdk MUST stay server-side. This file is never shipped to
//     the browser, so no API key is ever exposed.
//   - The tutor is restricted to the Chapters 1–40 syllabus by the system
//     prompt. It always disclaims that its answers are AI-generated and
//     not verified textbook content.
//   - If the SDK is unavailable for any reason, the route returns a friendly
//     fallback so the rest of the app keeps working.
// ---------------------------------------------------------------------------

// Conservative system prompt — pinned to the course syllabus.
const SYSTEM_PROMPT = `You are "Mehru Tutor AI" — the friendly AI tutor inside the "Python Exam Prep AI" app, created by Mehreen Zohair (nickname: Mehru). You help beginners preparing for Python exams. The course is strictly limited to Chapters 1–40 of "A Smarter Way to Learn Python" by Mark Myers.

STRICT SYLLABUS (Chapters 1–40 only):
- Module A (Ch 1–8): print(), string variables, number variables, math operators, naming rules, modulo/floor/power, precedence, string concatenation
- Module B (Ch 9–14): if, comparison operators, else/elif, and/or/not, nested if, comments
- Module C (Ch 15–19): lists, append/insert/change, slicing, del/remove, pop
- Module D (Ch 20–22): tuples, for loops, nested for loops
- Module E (Ch 23–24): input() and conversion, changing case
- Module F (Ch 25–40): dictionaries — creation, modification, removal, iteration, key membership, nesting, key rules, update, comprehension, counting, list of records, looping records, lookup tables, summarization, methods review, putting-it-together

OUT OF SCOPE (politely refuse and redirect to the syllabus):
- functions (def, lambda), classes/OOP, file I/O, modules/imports, exceptions/try, list/dict comprehensions beyond simple dict comprehension, generators, decorators, map/filter, NumPy, Pandas, advanced topics.

YOUR RULES:
1. Always answer in beginner-friendly English. Use short paragraphs and small code snippets.
2. Optionally add a Roman Urdu one-liner at the end when it helps a beginner understand the key idea.
3. Show correct Python 3 syntax only. Never show code that would raise an error without warning the student.
4. If a student asks "what does X do", give a 2–3 sentence explanation + a tiny code example + the expected output.
5. If a student asks you to "create practice questions", generate AT MOST 3 MCQs with 4 options each, mark the correct option, and end each with a one-line explanation. Clearly label them as AI-generated practice questions — NOT verified course content.
6. If a student asks a question that is out of syllabus (functions, classes, files, etc.), politely say "This is outside the Chapters 1–40 syllabus. Please focus on the current topics." and offer to explain something inside the syllabus instead.
7. Never claim that an answer is verified textbook content. Always end your first answer in a conversation with: "(AI-generated answer — verify against your textbook.)"
8. Keep each response under 250 words. Be concise.
9. If a student asks about anything other than Python or studying (politics, news, personal advice), politely redirect: "I can only help with Python topics in the Chapters 1–40 syllabus."
10. If a student asks your name, identify yourself as "Mehru Tutor AI, created by Mehreen Zohair" — short and friendly.`;

// --- Input validation ---------------------------------------------------

const MAX_INPUT_LENGTH = 800; // chars
const MAX_HISTORY_LENGTH = 12; // messages kept per request

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: IncomingMessage[];
}

function validateBody(body: any): { ok: true; messages: IncomingMessage[] } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request body.' };
  }
  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: 'No messages provided.' };
  }
  if (messages.length > MAX_HISTORY_LENGTH) {
    return { ok: false, error: `Too many messages. Keep history under ${MAX_HISTORY_LENGTH + 1} messages.` };
  }
  for (const m of messages) {
    if (typeof m.role !== 'string' || !['user', 'assistant'].includes(m.role)) {
      return { ok: false, error: 'Invalid message role.' };
    }
    if (typeof m.content !== 'string' || m.content.trim().length === 0) {
      return { ok: false, error: 'Empty message content.' };
    }
    if (m.role === 'user' && m.content.length > MAX_INPUT_LENGTH) {
      return { ok: false, error: `Message too long. Maximum ${MAX_INPUT_LENGTH} characters.` };
    }
  }
  return { ok: true, messages };
}

// --- In-memory rate limiting (per IP) ----------------------------------
// Basic protection against abuse. Not a substitute for real auth in production.

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 15; // 15 requests per minute per IP

const requestLog = new Map<string, number[]>();

function rateLimitOk(ip: string): boolean {
  const now = Date.now();
  const arr = requestLog.get(ip) ?? [];
  const recent = arr.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  requestLog.set(ip, recent);
  return true;
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() ?? 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}

// --- Route handler ------------------------------------------------------

export const runtime = 'nodejs';
// The route can take a few seconds while the LLM responds. Disable static
// optimization so the request is always handled dynamically.
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. Rate limit
  const ip = getClientIp(req);
  if (!rateLimitOk(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429 }
    );
  }

  // 2. Parse + validate body
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 });
  }
  const v = validateBody(body);
  if (!v.ok) {
    return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
  }

  // 3. Build the message array with the system prompt at the front.
  const messagesForLlm: { role: 'assistant' | 'user'; content: string }[] = [
    { role: 'assistant', content: SYSTEM_PROMPT },
    ...v.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  // 4. Call the LLM. Any failure returns a friendly fallback so the UI
  //    never breaks. We never leak internal errors to the client.
  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: messagesForLlm,
      thinking: { type: 'disabled' },
    });
    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json(
        {
          ok: false,
          error: 'The tutor did not return a response. Please try rephrasing your question.',
        },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error.';
    console.error('[tutor] LLM call failed:', message);
    return NextResponse.json(
      {
        ok: false,
        error:
          'The AI tutor is unavailable right now. The rest of the app keeps working — please try the lessons and MCQs in the meantime.',
      },
      { status: 503 }
    );
  }
}

// Simple GET for health checks.
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'Mehru Tutor AI (python-exam-prep-ai / tutor)',
    creator: 'Mehreen Zohair',
    syllabus: 'Chapters 1–40',
  });
}
