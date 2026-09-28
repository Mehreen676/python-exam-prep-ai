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
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignupBody {
  name?: string;
  email?: string;
  password?: string;
}

function bad(msg: string) {
  return NextResponse.json({ ok: false, error: msg }, { status: 400 });
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

  // Check for existing user.
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
}
