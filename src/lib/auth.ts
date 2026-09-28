import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// NextAuth configuration.
//
// Strategy: JWT (not database sessions). This keeps the auth flow simple and
// works on serverless platforms (Vercel) without extra session storage.
//
// The Credentials provider validates email + password against the User
// table in Prisma. Passwords are stored as bcrypt hashes — never plaintext.
// ---------------------------------------------------------------------------

export const authOptions: NextAuthOptions = {
  // We use JWTs so we don't need a Session table.
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? '';
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.hashedPassword) return null;

        const ok = await bcrypt.compare(password, user.hashedPassword);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    // Attach user id + role to the JWT.
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id as string;
        token.role = (user as any).role as string;
      }
      return token;
    },
    // Expose id + role on the session object.
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    // We use our own SPA views for sign-in / sign-up, but NextAuth needs a
    // sign-in URL for redirects. We map it to the home page with a query
    // parameter that our SPA reads.
    signIn: '/?view=signin',
  },
  secret: process.env.NEXTAUTH_SECRET ?? 'dev-only-secret-change-me-in-production',
};
