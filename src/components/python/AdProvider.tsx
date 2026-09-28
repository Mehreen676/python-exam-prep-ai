'use client';

import Script from 'next/script';
import { useSession } from 'next-auth/react';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Ad network bootstrapper.
//
// Loads the AdSense library once (when configured) using Next.js's Script
// component with `strategy="afterInteractive"` so it doesn't block the page.
// Adsterra does NOT need a global script — its ads are loaded per-slot by
// the AdBanner component itself.
//
// Signed-out users see ads. Signed-in users also see ads in this version —
// you can later hide ads for premium users by checking session.user.role or
// a `tier` field.
// ---------------------------------------------------------------------------

const AD_NETWORK = (process.env.NEXT_PUBLIC_AD_NETWORK ?? 'none') as
  | 'adsense'
  | 'adsterra'
  | 'none';

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';

export function AdProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      {AD_NETWORK === 'adsense' && ADSENSE_CLIENT && (
        <Script
          id="adsbygoogle-lib"
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          async
        />
      )}
    </>
  );
}
