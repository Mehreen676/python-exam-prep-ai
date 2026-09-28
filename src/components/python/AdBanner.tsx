'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Reusable ad banner component.
//
// Supports THREE networks selected via the NEXT_PUBLIC_AD_NETWORK env var:
//   - "adsense"  → Google AdSense (best RPM, needs approval + custom domain)
//   - "adsterra" → Adsterra (instant approval, works on *.vercel.app)
//   - "monetag"  → Monetag (instant approval, similar to Adsterra, supports
//                  popunder + push + native banner; great RPM on mobile)
//   - "none" / undefined → renders a friendly placeholder box (dev mode)
//
// Each slot picks its own ad unit ID from env vars so you can rotate creatives
// per page without code changes.
//
// IMPORTANT: We never inject raw HTML from the network. The component either
// renders an AdSense `<ins>` tag (which AdSense's own script populates) or an
// Adsterra/Monetag `<script>` from the configured zone/key. No user-supplied
// HTML is ever injected directly.
// ---------------------------------------------------------------------------

interface AdBannerProps {
  // Logical slot name; the actual ad unit id is looked up from env vars.
  slot: 'landing-top' | 'landing-sidebar' | 'chapter-bottom' | 'dashboard-sidebar' | 'exam-results-bottom' | 'practice-sidebar' | 'flashcards-bottom';
  // Optional className for sizing/positioning.
  className?: string;
  // Compact = horizontal banner (728x90, 320x50). Default = responsive block.
  format?: 'auto' | 'horizontal';
  // Label shown above the ad (for transparency).
  label?: string;
}

const AD_NETWORK = (process.env.NEXT_PUBLIC_AD_NETWORK ?? 'none') as
  | 'adsense'
  | 'adsterra'
  | 'monetag'
  | 'none';

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? ''; // ca-pub-XXXXXXXXXXXXXXXX
const ADSENSE_SLOTS: Record<AdBannerProps['slot'], string> = {
  'landing-top': process.env.NEXT_PUBLIC_ADSENSE_SLOT_LANDING_TOP ?? '',
  'landing-sidebar': process.env.NEXT_PUBLIC_ADSENSE_SLOT_LANDING_SIDEBAR ?? '',
  'chapter-bottom': process.env.NEXT_PUBLIC_ADSENSE_SLOT_CHAPTER_BOTTOM ?? '',
  'dashboard-sidebar': process.env.NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD_SIDEBAR ?? '',
  'exam-results-bottom': process.env.NEXT_PUBLIC_ADSENSE_SLOT_EXAM_BOTTOM ?? '',
  'practice-sidebar': process.env.NEXT_PUBLIC_ADSENSE_SLOT_PRACTICE_SIDEBAR ?? '',
  'flashcards-bottom': process.env.NEXT_PUBLIC_ADSENSE_SLOT_FLASHCARDS_BOTTOM ?? '',
};

const ADSTERRA_KEYS: Record<AdBannerProps['slot'], string> = {
  'landing-top': process.env.NEXT_PUBLIC_ADSTERRA_KEY_LANDING_TOP ?? '',
  'landing-sidebar': process.env.NEXT_PUBLIC_ADSTERRA_KEY_LANDING_SIDEBAR ?? '',
  'chapter-bottom': process.env.NEXT_PUBLIC_ADSTERRA_KEY_CHAPTER_BOTTOM ?? '',
  'dashboard-sidebar': process.env.NEXT_PUBLIC_ADSTERRA_KEY_DASHBOARD_SIDEBAR ?? '',
  'exam-results-bottom': process.env.NEXT_PUBLIC_ADSTERRA_KEY_EXAM_BOTTOM ?? '',
  'practice-sidebar': process.env.NEXT_PUBLIC_ADSTERRA_KEY_PRACTICE_SIDEBAR ?? '',
  'flashcards-bottom': process.env.NEXT_PUBLIC_ADSTERRA_KEY_FLASHCARDS_BOTTOM ?? '',
};

// Monetag per-slot configuration. Each env var should be set to
// "scriptURL,zoneID" — for example:
//   NEXT_PUBLIC_MONETAG_LANDING_TOP=https://nap5k.com/tag.min.js,11916702
// Monetag assigns a different CDN URL per ad zone (nap5k.com, al5sm.com,
// n6wxm.com, etc.), so each slot needs its own script URL + zone ID pair.
const MONETAG_ADS: Record<AdBannerProps['slot'], string> = {
  'landing-top': process.env.NEXT_PUBLIC_MONETAG_LANDING_TOP ?? '',
  'landing-sidebar': process.env.NEXT_PUBLIC_MONETAG_LANDING_SIDEBAR ?? '',
  'chapter-bottom': process.env.NEXT_PUBLIC_MONETAG_CHAPTER_BOTTOM ?? '',
  'dashboard-sidebar': process.env.NEXT_PUBLIC_MONETAG_DASHBOARD_SIDEBAR ?? '',
  'exam-results-bottom': process.env.NEXT_PUBLIC_MONETAG_EXAM_BOTTOM ?? '',
  'practice-sidebar': process.env.NEXT_PUBLIC_MONETAG_PRACTICE_SIDEBAR ?? '',
  'flashcards-bottom': process.env.NEXT_PUBLIC_MONETAG_FLASHCARDS_BOTTOM ?? '',
};

// Parse "scriptURL,zoneID" → { scriptUrl, zoneId }
function parseMonetagAd(value: string): { scriptUrl: string; zoneId: string } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const idx = trimmed.lastIndexOf(',');
  if (idx === -1) return null;
  const scriptUrl = trimmed.slice(0, idx).trim();
  const zoneId = trimmed.slice(idx + 1).trim();
  if (!scriptUrl || !zoneId) return null;
  return { scriptUrl, zoneId };
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdBanner({ slot, className, format = 'auto', label = 'Sponsored' }: AdBannerProps) {
  const [adSensePushed, setAdSensePushed] = useState(false);

  // Trigger AdSense to render the ad unit after mount. Adsterra does not
  // need this — its `<script>` self-initialises.
  useEffect(() => {
    if (AD_NETWORK !== 'adsense') return;
    if (!ADSENSE_CLIENT) return;
    if (adSensePushed) return;
    // Defer to next animation frame so we don't synchronously setState.
    const id = requestAnimationFrame(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdSensePushed(true);
      } catch {
        /* AdSense script may not be loaded yet; will retry on next render */
      }
    });
    return () => cancelAnimationFrame(id);
  }, [adSensePushed]);

  // No network configured — show a placeholder box so devs see the slot.
  if (AD_NETWORK === 'none' || (AD_NETWORK === 'adsense' && !ADSENSE_CLIENT)) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 text-center text-xs text-muted-foreground/60',
          format === 'horizontal' ? 'h-20 w-full' : 'h-64 w-full',
          className
        )}
        role="complementary"
        aria-label="Advertisement placeholder"
      >
        <div className="text-[10px] uppercase tracking-wider">{label}</div>
        <div className="mt-1">Ad slot — set NEXT_PUBLIC_AD_NETWORK to enable</div>
        <div className="mt-0.5 font-mono text-[10px]">slot: {slot}</div>
      </div>
    );
  }

  // ---- AdSense ----
  if (AD_NETWORK === 'adsense') {
    const slotId = ADSENSE_SLOTS[slot];
    if (!slotId) {
      // Slot not configured — fall back to placeholder.
      return (
        <div
          className={cn('flex items-center justify-center rounded border border-dashed text-xs text-muted-foreground/60', className)}
          role="complementary"
          aria-label="Advertisement placeholder"
        >
          AdSense slot not configured for: {slot}
        </div>
      );
    }
    return (
      <div className={cn('flex flex-col gap-1', className)} role="complementary" aria-label="Advertisement">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{label}</div>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // ---- Adsterra ----
  if (AD_NETWORK === 'adsterra') {
    const key = ADSTERRA_KEYS[slot];
    if (!key) {
      return (
        <div
          className={cn('flex items-center justify-center rounded border border-dashed text-xs text-muted-foreground/60', className)}
          role="complementary"
          aria-label="Advertisement placeholder"
        >
          Adsterra key not configured for: {slot}
        </div>
      );
    }
    // Adsterra social bar / native banner script.
    return (
      <div className={cn('flex flex-col gap-1', className)} role="complementary" aria-label="Advertisement">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{label}</div>
        <div className="adsterra-slot" data-key={key}>
          <script
            // Adsterra delivers via a key-based URL. The actual placement
            // script is loaded from their CDN.
            async
            type="text/javascript"
            src={`//pl${key.substring(0, 7)}${key.substring(7)}.profithostingcontent.com/${key}/invoke.js`}
          />
        </div>
      </div>
    );
  }

  // ---- Monetag ----
  // Renders Monetag's actual ad-serving script tag. Each slot has its own
  // script URL + zone ID pair (Monetag assigns different CDN URLs per zone).
  if (AD_NETWORK === 'monetag') {
    const parsed = parseMonetagAd(MONETAG_ADS[slot]);
    if (!parsed) {
      return (
        <div
          className={cn('flex items-center justify-center rounded border border-dashed text-xs text-muted-foreground/60', className)}
          role="complementary"
          aria-label="Advertisement placeholder"
        >
          Monetag ad not configured for: {slot}
        </div>
      );
    }
    return (
      <div className={cn('flex flex-col gap-1', className)} role="complementary" aria-label="Advertisement">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{label}</div>
        <div className="monetag-slot min-h-[90px]">
          <script
            src={parsed.scriptUrl}
            data-zone={parsed.zoneId}
            data-cfasync="false"
            async
          />
        </div>
      </div>
    );
  }

  return null;
}
