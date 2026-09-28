'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

// Wraps the app in NextAuth's SessionProvider so client components can
// call useSession() to read the current logged-in user.
export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
