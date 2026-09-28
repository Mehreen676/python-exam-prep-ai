'use client';

import { useEffect, useState } from 'react';

// ===========================================================================
// AnimatedBackground — premium gradient mesh + floating orbs behind content.
// Renders fixed to the viewport so it never scrolls with the page.
// ===========================================================================

export function AnimatedBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* Mesh gradient layer — slowly shifts colors */}
      <div className="absolute inset-0 bg-mesh opacity-80 dark:opacity-50" />

      {/* Floating orbs — plum, amber, rose */}
      <div className="absolute top-[-10%] left-[-5%] h-[28rem] w-[28rem] rounded-full opacity-30 dark:opacity-20 blur-3xl animate-float"
           style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }} />
      <div className="absolute top-[20%] right-[-10%] h-[32rem] w-[32rem] rounded-full opacity-25 dark:opacity-15 blur-3xl animate-float-slow"
           style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] left-[20%] h-[36rem] w-[36rem] rounded-full opacity-20 dark:opacity-12 blur-3xl animate-float"
           style={{ background: 'radial-gradient(circle, var(--chart-5) 0%, transparent 70%)', animationDelay: '2s' }} />
      <div className="absolute bottom-[15%] right-[10%] h-[24rem] w-[24rem] rounded-full opacity-20 dark:opacity-12 blur-3xl animate-float-slow"
           style={{ background: 'radial-gradient(circle, var(--chart-2) 0%, transparent 70%)', animationDelay: '4s' }} />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-grid opacity-30 dark:opacity-15 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
           }} />
    </div>
  );
}
