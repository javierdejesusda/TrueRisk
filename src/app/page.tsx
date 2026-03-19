'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const RotatingEarth = dynamic(
  () => import('@/components/globe/rotating-earth').then((m) => ({ default: m.RotatingEarth })),
  { ssr: false },
);

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg-primary px-4">
      {/* Globe background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] sm:h-[700px] sm:w-[700px] lg:h-[800px] lg:w-[800px]">
          <RotatingEarth className="h-full w-full" />
        </div>
      </div>

      {/* Animated background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-accent-green/[0.08] blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 h-[300px] w-[300px] rounded-full bg-accent-blue/[0.06] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0, duration: 0.5 }}
          className="mb-8 flex items-center gap-2 rounded-full border border-border bg-white/[0.08] px-4 py-1.5 backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-secondary">
            System Active
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: 'easeOut' }}
          className="font-[family-name:var(--font-display)] text-6xl font-extrabold tracking-tighter text-text-primary sm:text-7xl lg:text-8xl"
        >
          True
          <span
            className="text-accent-green"
            style={{ filter: 'drop-shadow(0 0 20px rgba(34, 245, 140, 0.4))' }}
          >
            Risk
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-4 max-w-lg font-[family-name:var(--font-sans)] text-lg font-light text-text-secondary sm:text-xl"
        >
          Climate Emergency Management Platform
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-2 max-w-md text-sm text-text-muted"
        >
          Multi-hazard risk intelligence with real-time weather monitoring
          and personalised emergency guidance for citizens.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-10 flex flex-col gap-3 sm:flex-row"
        >
          <Link
            href="/map"
            className="group inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-accent-green px-10 text-base font-semibold text-bg-primary transition-all hover:brightness-110 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(34,245,140,0.3)] active:scale-[0.97]"
          >
            Enter TrueRisk
            <span className="inline-block transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
        </motion.div>
      </motion.div>

      {/* Bottom decorative bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="absolute bottom-6 flex items-center gap-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-text-muted"
      >
        <span className="h-px w-8 bg-border" />
        <span>Multi-hazard risk intelligence</span>
        <span className="h-px w-8 bg-border" />
      </motion.div>
    </div>
  );
}
