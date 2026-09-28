import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// NextAuth route handler — exposes /api/auth/* endpoints
// (signin, signout, session, csrf, providers).
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
