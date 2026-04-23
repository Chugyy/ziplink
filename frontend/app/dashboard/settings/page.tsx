"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { api, ApiError } from "@/lib/api";

export default function SettingsPage() {
  const { user, username, updateUser } = useAuth();
  const [newUsername, setNewUsername] = useState(username);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || newUsername === username) return;

    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const res = (await api.updateUsername(newUsername.trim())) as {
        username: string;
      };
      updateUser({ username: res.username });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to update username");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-sm text-text-secondary mb-8">
        Manage your account settings
      </p>

      <div className="glass p-6 rounded-xl max-w-lg">
        <h2 className="text-lg font-semibold mb-1">Username</h2>
        <p className="text-sm text-text-secondary mb-4">
          Your links will be available at{" "}
          <code className="text-primary font-mono text-xs">
            ziplink.fr/{newUsername || username}/your-slug
          </code>
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              Username
            </label>
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-sm">@</span>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => {
                  setNewUsername(e.target.value.toLowerCase());
                  setError("");
                  setSuccess(false);
                }}
                minLength={2}
                maxLength={30}
                pattern="[a-z0-9][a-z0-9._-]*"
                className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-lg text-white font-mono text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="your-username"
              />
            </div>
            <p className="text-xs text-text-muted mt-1.5">
              2-30 characters. Letters, numbers, dots, hyphens, underscores.
            </p>
          </div>

          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}

          {success && (
            <p className="text-primary text-sm flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Username updated!
            </p>
          )}

          <button
            type="submit"
            disabled={saving || !newUsername.trim() || newUsername === username}
            className="px-6 py-2.5 btn-relief text-background font-semibold rounded-lg glow disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="glass p-6 rounded-xl max-w-lg mt-6">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Email</span>
            <span className="text-sm font-mono">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">User ID</span>
            <span className="text-xs text-text-muted font-mono">
              {user?.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
