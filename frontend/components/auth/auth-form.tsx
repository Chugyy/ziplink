"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Loader2, ShieldX } from "lucide-react";
import { login, signup } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBlocked(false);
    setLoading(true);

    try {
      if (mode === "signup") {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof ApiError && err.message === "signup_blocked") {
        setBlocked(true);
      } else {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Zap className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold">Ziplink</span>
        </div>

        {/* Blocked state */}
        {blocked ? (
          <div className="glass p-8 rounded-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <ShieldX className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-3">
              Nice try! 😏
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed mb-2">
              Ziplink is invite-only for now. This is my personal
              link shortener and it&apos;s not open to the public yet.
            </p>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              But hey, if you need a smart tool for your business,
              check this out:
            </p>
            <a
              href="https://i-opened.multimodal-house.fr?utm_source=ziplink&utm_medium=signup_blocked&utm_campaign=redirect"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 btn-relief text-background font-semibold rounded-lg glow text-sm"
            >
              Discover iOpened
            </a>
            <button
              onClick={() => setBlocked(false)}
              className="block mx-auto mt-4 text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              Back to signup
            </button>
          </div>
        ) : (
          /* Card */
          <div className="glass p-8 rounded-2xl">
            <h1 className="text-xl font-semibold mb-6 text-center">
              {mode === "login" ? "Welcome back" : "Create an account"}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 btn-relief text-background font-semibold rounded-lg glow disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === "login" ? "Login" : "Sign Up"}
              </button>
            </form>

            <p className="text-center text-sm text-text-secondary mt-6">
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="text-primary hover:underline">
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    Login
                  </Link>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
