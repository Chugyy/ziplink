"use client";

import { StatsBar } from "@/components/dashboard/stats-bar";
import { LinksTable } from "@/components/dashboard/links-table";

export default function DashboardPage() {
  return (
    <>
      <StatsBar />
      <LinksTable />
    </>
  );
}
