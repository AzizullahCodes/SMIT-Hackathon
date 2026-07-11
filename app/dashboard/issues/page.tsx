"use client";

import { useEffect, useState } from "react";
import { getIssues } from "@/lib/helpers";
import type { Issue, IssueStatus, IssuePriority } from "@/lib/types";
import Link from "next/link";
import { Plus, Search, Filter, AlertTriangle } from "lucide-react";

const STATUS_OPTIONS: IssueStatus[] = [
  "Reported",
  "Assigned",
  "Inspection Started",
  "Maintenance In Progress",
  "Waiting for Parts",
  "Resolved",
  "Closed",
  "Reopened",
];

const PRIORITY_OPTIONS: IssuePriority[] = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  useEffect(() => {
    loadIssues();
  }, []);

  async function loadIssues() {
    setLoading(true);
    try {
      const data = await getIssues({
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setIssues(data);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadIssues();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Issues</h1>
          <p className="text-[var(--secondary)] text-sm mt-1">
            Track and manage all reported issues
          </p>
        </div>
        <Link
          href="/dashboard/issues/new"
          className="flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          <Plus size={16} />
          Report Issue
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
              placeholder="Search issues..."
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
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
          >
            <option value="">All Priority</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
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
      ) : issues.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--border)] p-12 text-center">
          <AlertTriangle
            size={48}
            className="mx-auto text-[var(--secondary)] mb-4"
          />
          <h3 className="text-lg font-semibold mb-2">No issues found</h3>
          <p className="text-[var(--secondary)] text-sm">
            All clear! No issues to report.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--border)]">
          <div className="divide-y divide-[var(--border)]">
            {issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/dashboard/issues/${issue.id}`}
                className="flex items-center justify-between p-4 hover:bg-[var(--muted)] transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{issue.title}</h3>
                    {issue.priority === "Critical" && (
                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--secondary)] mt-0.5">
                    {issue.issueNumber} &middot; {issue.assetName} &middot;{" "}
                    {issue.category}
                  </p>
                  <p className="text-xs text-[var(--secondary)] mt-1">
                    Reported by {issue.reporterName} &middot;{" "}
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full priority-${issue.priority.toLowerCase()}`}
                  >
                    {issue.priority}
                  </span>
                  <span className="text-xs text-[var(--secondary)] min-w-[120px] text-right">
                    {issue.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
