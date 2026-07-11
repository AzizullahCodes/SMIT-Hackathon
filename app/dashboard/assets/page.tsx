"use client";

import { useEffect, useState } from "react";
import { getAssets } from "@/lib/helpers";
import type { Asset, AssetStatus } from "@/lib/types";
import Link from "next/link";
import { Plus, Search, Filter, Box } from "lucide-react";

const STATUS_OPTIONS: AssetStatus[] = [
  "Operational",
  "Issue Reported",
  "Under Inspection",
  "Under Maintenance",
  "Out of Service",
  "Retired",
];

const CATEGORIES = [
  "Electronics",
  "Furniture",
  "HVAC",
  "Plumbing",
  "Electrical",
  "IT/Network",
  "Structural",
  "General",
  "Other",
];

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    setLoading(true);
    try {
      const data = await getAssets({
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      });
      setAssets(data);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadAssets();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Assets</h1>
          <p className="text-[var(--secondary)] text-sm mt-1">
            Manage all registered assets
          </p>
        </div>
        <Link
          href="/dashboard/assets/new"
          className="flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          <Plus size={16} />
          Add Asset
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-[var(--border)] mb-6">
        <form onSubmit={handleSearch} className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary)]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets..."
              className="w-full pl-9 pr-4 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--muted)] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Filter size={14} />
            Filter
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--border)] p-12 text-center">
          <Box size={48} className="mx-auto text-[var(--secondary)] mb-4" />
          <h3 className="text-lg font-semibold mb-2">No assets found</h3>
          <p className="text-[var(--secondary)] text-sm mb-4">
            Get started by registering your first asset.
          </p>
          <Link
            href="/dashboard/assets/new"
            className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)]"
          >
            <Plus size={16} />
            Add Asset
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <Link
              key={asset.id}
              href={`/dashboard/assets/${asset.id}`}
              className="bg-white rounded-xl border border-[var(--border)] p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{asset.name}</h3>
                  <p className="text-xs text-[var(--secondary)] font-mono">
                    {asset.code}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full status-${asset.status.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {asset.status}
                </span>
              </div>
              <div className="space-y-1 text-sm text-[var(--secondary)]">
                <p>Category: {asset.category}</p>
                <p>Location: {asset.location}</p>
                <p>Condition: {asset.condition}</p>
              </div>
              {asset.assignedTechnicianName && (
                <p className="mt-2 text-xs text-[var(--primary)]">
                  Assigned: {asset.assignedTechnicianName}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
