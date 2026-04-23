"use client";

import { useState } from "react";
import { X, Loader2, Check, Copy } from "lucide-react";
import { api } from "@/lib/api";
import { Link as LinkType } from "@/lib/types";

export function CreateLinkModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (link: LinkType) => void;
}) {
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<LinkType | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const link = (await api.createLink({
        destination_url: url,
        custom_slug: slug || undefined,
        title: title || undefined,
      })) as LinkType;

      setCreated(link);
      onCreated(link);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create link";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!created) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(created.short_url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = created.short_url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently fail
    }
  };

  const handleClose = () => {
    setUrl("");
    setSlug("");
    setTitle("");
    setError("");
    setCreated(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative glass p-8 rounded-2xl w-full max-w-md mx-4 bg-surface-alt">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {created ? (
          /* Success state */
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Link created!</h2>
            <div className="flex items-center justify-center gap-2 mt-4 p-3 bg-surface rounded-lg">
              <code className="text-primary font-mono text-sm">
                {created.short_url}
              </code>
              <button
                onClick={handleCopy}
                className="text-text-secondary hover:text-white transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <button
              onClick={handleClose}
              className="mt-6 px-6 py-2 text-sm text-text-secondary hover:text-white transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form */
          <>
            <h2 className="text-xl font-semibold mb-6">Create Link</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Destination URL <span className="text-destructive">*</span>
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Custom slug{" "}
                  <span className="text-text-muted">(optional)</span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-cool-link"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-white font-mono text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Title <span className="text-text-muted">(optional)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My YouTube Video"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
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
                Create Link
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
