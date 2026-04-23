"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* Liquid glass orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(0,255,136,0.12),transparent_70%)] blur-[80px] rounded-full animate-float pointer-events-none" />

      <div className="text-center max-w-3xl relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border text-sm text-text-secondary mb-8">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Smart Link Tracking
        </div>

        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
          Smart Links That
          <br />
          <span className="text-primary">Open Apps</span>
        </h1>

        <p className="text-lg md:text-xl text-text-secondary max-w-xl mx-auto mb-10 leading-relaxed">
          Create short links that track every click and open YouTube, Instagram,
          TikTok directly in the native app — even from Telegram and Instagram
          browsers.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 btn-relief text-background font-semibold rounded-xl text-lg glow"
          >
            Get Started — It&apos;s Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Mini demo hint */}
        <p className="text-text-muted text-sm mt-6">
          No credit card required
        </p>
      </div>
    </section>
  );
}
