import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// NextAuth route handler — exposes /api/auth/* endpoints
// (signin, signout, session, csrf, providers).
//
// IMPORTANT: This route MUST run on the Node.js runtime (not Edge) because
// the Credentials provider uses Prisma and bcryptjs, both of which depend
// on Node's "crypto" and "fs" modules. The Edge runtime does not support
// these and the route would crash with an opaque 500.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
