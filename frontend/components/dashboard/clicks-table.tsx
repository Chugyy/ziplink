"use client";

import { Click } from "@/lib/types";
import { Smartphone, Monitor, Tablet, Check, X } from "lucide-react";

function DeviceIcon({ type }: { type: string | null }) {
  switch (type) {
    case "mobile":
      return <Smartphone className="w-4 h-4" />;
    case "tablet":
      return <Tablet className="w-4 h-4" />;
    default:
      return <Monitor className="w-4 h-4" />;
  }
}

function timeAgo(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function ClicksTable({ clicks }: { clicks: Click[] }) {
  if (clicks.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <p className="text-text-secondary">No clicks recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Recent Clicks
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs text-text-muted font-medium px-5 py-2.5">
                Time
              </th>
              <th className="text-left text-xs text-text-muted font-medium px-5 py-2.5">
                Device
              </th>
              <th className="text-left text-xs text-text-muted font-medium px-5 py-2.5 hidden sm:table-cell">
                OS
              </th>
              <th className="text-left text-xs text-text-muted font-medium px-5 py-2.5 hidden md:table-cell">
                Browser
              </th>
              <th className="text-center text-xs text-text-muted font-medium px-5 py-2.5">
                Deep Link
              </th>
              <th className="text-left text-xs text-text-muted font-medium px-5 py-2.5 hidden lg:table-cell">
                Referer
              </th>
            </tr>
          </thead>
          <tbody>
            {clicks.map((click) => (
              <tr
                key={click.id}
                className="border-b border-border last:border-0 hover:bg-white/[0.02]"
              >
                <td className="px-5 py-3 text-sm text-text-secondary whitespace-nowrap">
                  {timeAgo(click.clicked_at)}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <DeviceIcon type={click.device_type} />
                    <span className="capitalize text-text-secondary">
                      {click.device_type || "unknown"}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-text-secondary hidden sm:table-cell">
                  {click.os || "—"}
                </td>
                <td className="px-5 py-3 text-sm text-text-secondary hidden md:table-cell">
                  {click.browser || "—"}
                </td>
                <td className="px-5 py-3 text-center">
                  {click.is_deep_link ? (
                    <Check className="w-4 h-4 text-primary mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-text-muted mx-auto" />
                  )}
                </td>
                <td className="px-5 py-3 text-sm text-text-secondary hidden lg:table-cell">
                  {click.referer
                    ? new URL(click.referer).hostname
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
