"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MousePointerClick,
  Users,
  Smartphone,
  Globe,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { LinkStats } from "@/lib/types";
import { CopyButton } from "@/components/shared/copy-button";
import { DeviceBreakdown } from "@/components/dashboard/device-breakdown";
import { ClicksTable } from "@/components/dashboard/clicks-table";

export default function LinkStatsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [data, setData] = useState<LinkStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getLinkStats(slug)
      .then((d) => setData(d as LinkStats))
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false));
  }, [slug, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { link, clicks, stats } = data;

  const statCards = [
    {
      label: "Total Clicks",
      value: stats.total_clicks,
      icon: MousePointerClick,
    },
    { label: "Unique Visitors", value: stats.unique_visitors, icon: Users },
    {
      label: "Deep Link Opens",
      value: stats.deep_link_opens,
      icon: Smartphone,
    },
    {
      label: "Top Browser",
      value: Object.keys(stats.top_browsers)[0] || "—",
      icon: Globe,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to links
        </button>

        <div className="glass p-6 rounded-xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                {link.title || `/${link.slug}`}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <code className="text-primary font-mono text-sm">
                  {link.short_url}
                </code>
                <CopyButton text={link.short_url} />
                <a
                  href={link.short_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-sm text-text-muted mt-2 break-all">
                → {link.destination_url}
              </p>
            </div>
            <span className="text-xs text-text-muted">
              Created{" "}
              {new Date(link.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="glass p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4 text-primary" />
              <span className="text-xs text-text-secondary">{s.label}</span>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Device breakdown */}
      <DeviceBreakdown devices={stats.devices} platforms={stats.platforms} />

      {/* Top browsers & referers */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Browsers */}
        <div className="glass p-6 rounded-xl">
          <h3 className="text-sm font-semibold mb-4 text-text-secondary uppercase tracking-wider">
            Top Browsers
          </h3>
          {Object.keys(stats.top_browsers).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.top_browsers).map(([browser, count]) => (
                <div
                  key={browser}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-text-secondary">{browser}</span>
                  <span className="font-mono text-xs">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm">No data yet</p>
          )}
        </div>

        {/* Referers */}
        <div className="glass p-6 rounded-xl">
          <h3 className="text-sm font-semibold mb-4 text-text-secondary uppercase tracking-wider">
            Top Referers
          </h3>
          {Object.keys(stats.top_referers).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.top_referers).map(([ref, count]) => (
                <div
                  key={ref}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-text-secondary truncate mr-4">
                    {ref}
                  </span>
                  <span className="font-mono text-xs shrink-0">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm">No data yet</p>
          )}
        </div>
      </div>

      {/* Clicks table */}
      <ClicksTable clicks={clicks} />
    </div>
  );
}
