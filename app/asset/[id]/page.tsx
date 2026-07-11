"use client";

import { useEffect, useState, use } from "react";
import { getAsset, getIssuesByAsset, getAssetHistory } from "@/lib/helpers";
import type { Asset, Issue, HistoryEntry } from "@/lib/types";
import Link from "next/link";
import { Wrench, MapPin, Calendar, AlertTriangle } from "lucide-react";

export default function PublicAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const a = await getAsset(id);
        if (!a) {
          setNotFound(true);
          return;
        }
        setAsset(a);
        const [i, h] = await Promise.all([
          getIssuesByAsset(id),
          getAssetHistory(id),
        ]);
        setIssues(i);
        setHistory(h);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (notFound || !asset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <AlertTriangle size={48} className="mx-auto text-[var(--warning)] mb-4" />
          <h1 className="text-2xl font-bold mb-2">Asset Not Found</h1>
          <p className="text-[var(--secondary)]">
            This asset does not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  if (asset.status === "Retired") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <Wrench size={40} className="mx-auto text-[var(--secondary)] mb-4" />
            <h1 className="text-2xl font-bold mb-2">{asset.name}</h1>
            <p className="font-mono text-sm text-[var(--secondary)] mb-2">
              {asset.code}
            </p>
            <span className="inline-block text-sm px-4 py-1.5 rounded-full bg-gray-200 text-gray-600 font-medium">
              Retired
            </span>
            <p className="text-[var(--secondary)] text-sm mt-4">
              This asset has been permanently retired from service.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const recentHistory = history.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[var(--primary)] text-white p-4">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <Wrench size={20} />
          <span className="font-semibold">MaintainIQ</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">{asset.name}</h1>
              <p className="text-sm text-[var(--secondary)] font-mono mt-1">
                {asset.code}
              </p>
            </div>
            <span
              className={`text-xs px-3 py-1 rounded-full status-${asset.status.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {asset.status}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[var(--secondary)] w-24">Category:</span>
              <span className="font-medium">{asset.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[var(--secondary)]" />
              <span className="font-medium">{asset.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--secondary)] w-24">Condition:</span>
              <span className="font-medium">{asset.condition}</span>
            </div>
            {asset.lastServiceDate && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[var(--secondary)]" />
                <span>Last serviced: {asset.lastServiceDate}</span>
              </div>
            )}
            {asset.nextServiceDate && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[var(--secondary)]" />
                <span>Next service: {asset.nextServiceDate}</span>
              </div>
            )}
          </div>
        </div>

        {recentHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
            <h2 className="font-semibold mb-3">Recent Activity</h2>
            <div className="space-y-3">
              {recentHistory.map((entry) => (
                <div key={entry.id} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-[var(--primary)] mt-2 shrink-0" />
                  <div>
                    <p className="font-medium">{entry.action}</p>
                    <p className="text-[var(--secondary)] text-xs">
                      {entry.details}
                    </p>
                    <p className="text-[var(--secondary)] text-xs">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link
          href={`/asset/${id}/report`}
          className="block w-full py-3 bg-[var(--primary)] text-white text-center rounded-2xl font-semibold hover:bg-[var(--primary-hover)] transition-colors shadow-md"
        >
          Report an Issue
        </Link>
      </div>
    </div>
  );
}
