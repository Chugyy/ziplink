"use client";

import { useEffect, useState } from "react";
import { Link2, MousePointerClick, Smartphone } from "lucide-react";
import { api } from "@/lib/api";
import { OverviewStats } from "@/lib/types";

export function StatsBar() {
  const [stats, setStats] = useState<OverviewStats | null>(null);

  useEffect(() => {
    api.overviewStats().then((s) => setStats(s as OverviewStats));
  }, []);

  const items = [
    {
      label: "Total Links",
      value: stats?.total_links ?? "—",
      icon: Link2,
    },
    {
      label: "Total Clicks",
      value: stats?.total_clicks ?? "—",
      icon: MousePointerClick,
    },
    {
      label: "Deep Link Opens",
      value: stats?.deep_link_opens ?? "—",
      icon: Smartphone,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {items.map((item) => (
        <div
          key={item.label}
          className="glass p-5 rounded-xl flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <item.icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-xs text-text-secondary">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
