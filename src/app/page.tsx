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
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-accent-green/8 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 h-[300px] w-[300px] rounded-full bg-accent-blue/6 blur-[100px]" />
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
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 flex items-center gap-2 rounded-full border border-border bg-bg-card/60 px-4 py-1.5 backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
          </span>
          <span className="text-xs font-medium text-text-secondary">
            System Active
          </span>
        </motion.div>

        {/* Title */}
        <h1 className="text-5xl font-bold tracking-tight text-text-primary sm:text-6xl lg:text-7xl">
          True
          <span className="text-accent-green">Risk</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 max-w-lg text-lg text-text-secondary sm:text-xl">
          Climate Emergency Management Platform
        </p>

        <p className="mt-2 max-w-md text-sm text-text-muted">
          Multi-hazard risk intelligence with real-time weather monitoring
          and personalised emergency guidance for citizens.
        </p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-10 flex flex-col gap-3 sm:flex-row"
        >
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-accent-green px-8 text-sm font-semibold text-bg-primary transition-all hover:brightness-110 hover:scale-[1.03] active:scale-[0.97]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
              />
            </svg>
            Login
          </Link>
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-8 text-sm font-semibold text-text-primary transition-all hover:border-border-hover hover:bg-bg-card hover:scale-[1.03] active:scale-[0.97]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
              />
            </svg>
            Register
          </Link>
        </motion.div>
      </motion.div>

      {/* Bottom decorative bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute bottom-6 flex items-center gap-2 text-xs text-text-muted"
      >
        <span className="h-px w-8 bg-border" />
        <span>Multi-hazard risk intelligence</span>
        <span className="h-px w-8 bg-border" />
      </motion.div>
    </div>
  );
}
