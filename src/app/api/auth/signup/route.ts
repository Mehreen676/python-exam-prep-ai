import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// Sign-up route.
//
// POST /api/auth/signup
// Body: { name?: string, email: string, password: string }
//
// Validates input, hashes the password with bcrypt (10 rounds), and creates
// a new User row. Returns the public user shape on success.
//
// IMPORTANT: This route MUST run on the Node.js runtime (not Edge) because
// Prisma and bcryptjs depend on Node's "crypto" and "fs" modules. The Edge
// runtime does not support these and would crash with an opaque 500.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignupBody {
  name?: string;
  email?: string;
  password?: string;
}

function bad(msg: string) {
  return NextResponse.json({ ok: false, error: msg }, { status: 400 });
}

function unavailable(msg: string) {
  return NextResponse.json({ ok: false, error: msg }, { status: 503 });
}

export async function POST(req: NextRequest) {
  let body: SignupBody;
  try {
    body = await req.json();
  } catch {
    return bad('Invalid JSON.');
  }

  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';

  if (!email || !EMAIL_RE.test(email)) return bad('Please provide a valid email.');
  if (password.length < 6) return bad('Password must be at least 6 characters.');
  if (name.length > 60) return bad('Name is too long (max 60 chars).');

  // ---- Database access — wrapped in try/catch so the client gets a clean
  //      error message instead of an opaque HTTP 500.
  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: { email, name: name || null, hashedPassword, role: 'STUDENT' },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error.';
    console.error('[signup] DB error:', message);
    // Surface the underlying error to the response so it's debuggable
    // from the browser DevTools network tab.
    return unavailable(
      'Database error during sign-up. Details: ' + message
    );
  }
}
