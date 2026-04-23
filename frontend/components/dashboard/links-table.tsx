"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ExternalLink,
  BarChart2,
  Trash2,
  Plus,
  Link2,
} from "lucide-react";
import { api } from "@/lib/api";
import { Link as LinkType, LinkListResponse } from "@/lib/types";
import { CopyButton } from "@/components/shared/copy-button";
import { CreateLinkModal } from "./create-link-modal";
import { useAuth } from "@/hooks/use-auth";

export function LinksTable() {
  const { username } = useAuth();
  const [links, setLinks] = useState<LinkType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchLinks = async () => {
    try {
      const data = (await api.listLinks()) as LinkListResponse;
      setLinks(data.links);
      setTotal(data.total);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this link? All click data will be lost.")) return;
    try {
      await api.deleteLink(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      setTotal((t) => t - 1);
    } catch {
      // silently fail
    }
  };

  const handleCreated = () => {
    fetchLinks();
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const truncateUrl = (url: string, max = 40) => {
    if (url.length <= max) return url;
    return url.substring(0, max) + "...";
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Links</h1>
          <p className="text-sm text-text-secondary mt-1">
            {total} link{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 btn-relief text-background font-semibold rounded-lg glow text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Link
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-text-secondary">
          Loading...
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-20">
          <Link2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No links yet</h3>
          <p className="text-text-secondary text-sm mb-6">
            Create your first smart link to start tracking.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 btn-relief text-background font-semibold rounded-lg glow text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Link
          </button>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-text-muted font-medium px-5 py-3">
                  Link
                </th>
                <th className="text-left text-xs text-text-muted font-medium px-5 py-3 hidden md:table-cell">
                  Destination
                </th>
                <th className="text-center text-xs text-text-muted font-medium px-5 py-3">
                  Clicks
                </th>
                <th className="text-left text-xs text-text-muted font-medium px-5 py-3 hidden sm:table-cell">
                  Created
                </th>
                <th className="text-right text-xs text-text-muted font-medium px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr
                  key={link.id}
                  className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-primary font-mono text-sm">
                        /{username}/{link.slug}
                      </code>
                      <CopyButton text={link.short_url} />
                    </div>
                    {link.title && (
                      <p className="text-xs text-text-muted mt-1">
                        {link.title}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-text-secondary">
                      {truncateUrl(link.destination_url)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-sm font-medium">
                      {link.total_clicks}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-sm text-text-secondary">
                      {formatDate(link.created_at)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/links/${link.slug}`}
                        className="p-2 text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
                        title="View stats"
                      >
                        <BarChart2 className="w-4 h-4" />
                      </Link>
                      <a
                        href={link.short_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
                        title="Open link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="p-2 text-text-secondary hover:text-destructive transition-colors rounded-lg hover:bg-white/5"
                        title="Delete link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateLinkModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
