"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Zap className="w-6 h-6 text-primary" />
          <span>Ziplink</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-text-secondary hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="text-sm px-4 py-2 btn-relief text-background font-semibold rounded-lg glow"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
