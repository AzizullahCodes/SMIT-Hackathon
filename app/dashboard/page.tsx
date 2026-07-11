"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAssets, getIssues } from "@/lib/helpers";
import type { Asset, Issue } from "@/lib/types";
import Link from "next/link";
import {
  Box,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [a, i] = await Promise.all([getAssets(), getIssues()]);
        setAssets(a);
        setIssues(i);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  const totalAssets = assets.length;
  const operationalAssets = assets.filter(
    (a) => a.status === "Operational"
  ).length;
  const openIssues = issues.filter(
    (i) =>
      i.status !== "Resolved" &&
      i.status !== "Closed"
  ).length;
  const resolvedIssues = issues.filter(
    (i) => i.status === "Resolved" || i.status === "Closed"
  ).length;
  const criticalIssues = issues.filter(
    (i) => i.priority === "Critical" && i.status !== "Resolved" && i.status !== "Closed"
  ).length;
  const totalCost = issues.reduce((sum, i) => sum + (i.maintenanceCost || 0), 0);

  const recentIssues = issues.slice(0, 5);
  const recentAssets = assets.slice(0, 5);

  const stats = [
    {
      label: "Total Assets",
      value: totalAssets,
      icon: Box,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Operational",
      value: operationalAssets,
      icon: CheckCircle,
      color: "bg-green-100 text-green-700",
    },
    {
      label: "Open Issues",
      value: openIssues,
      icon: AlertTriangle,
      color: "bg-amber-100 text-amber-700",
    },
    {
      label: "Critical",
      value: criticalIssues,
      icon: Clock,
      color: "bg-red-100 text-red-700",
    },
    {
      label: "Resolved Issues",
      value: resolvedIssues,
      icon: CheckCircle,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Total Cost",
      value: `Rs. ${totalCost.toLocaleString()}`,
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-700",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--secondary)] mt-1">
          Welcome back, {user?.displayName || "User"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-4 border border-[var(--border)]"
          >
            <div
              className={`inline-flex p-2 rounded-lg ${stat.color} mb-2`}
            >
              <stat.icon size={18} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-[var(--secondary)] mt-0.5">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[var(--border)]">
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h2 className="font-semibold">Recent Issues</h2>
            <Link
              href="/dashboard/issues"
              className="text-sm text-[var(--primary)] flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {recentIssues.length === 0 ? (
              <p className="p-4 text-sm text-[var(--secondary)]">
                No issues yet
              </p>
            ) : (
              recentIssues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/dashboard/issues/${issue.id}`}
                  className="flex items-center justify-between p-4 hover:bg-[var(--muted)] transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{issue.title}</p>
                    <p className="text-xs text-[var(--secondary)]">
                      {issue.issueNumber} &middot; {issue.assetName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full priority-${issue.priority.toLowerCase()}`}
                    >
                      {issue.priority}
                    </span>
                    <span className="text-xs text-[var(--secondary)]">
                      {issue.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--border)]">
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h2 className="font-semibold">Recent Assets</h2>
            <Link
              href="/dashboard/assets"
              className="text-sm text-[var(--primary)] flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {recentAssets.length === 0 ? (
              <p className="p-4 text-sm text-[var(--secondary)]">
                No assets yet.{" "}
                <Link
                  href="/dashboard/assets/new"
                  className="text-[var(--primary)] hover:underline"
                >
                  Add one
                </Link>
              </p>
            ) : (
              recentAssets.map((asset) => (
                <Link
                  key={asset.id}
                  href={`/dashboard/assets/${asset.id}`}
                  className="flex items-center justify-between p-4 hover:bg-[var(--muted)] transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{asset.name}</p>
                    <p className="text-xs text-[var(--secondary)]">
                      {asset.code} &middot; {asset.location}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full status-${asset.status.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {asset.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
