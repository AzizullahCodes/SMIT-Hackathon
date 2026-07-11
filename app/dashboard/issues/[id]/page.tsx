"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getIssue,
  updateIssue,
  getTechnicians,
  addHistoryEntry,
} from "@/lib/helpers";
import type { Issue, IssueStatus, User } from "@/lib/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const STATUS_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  Reported: ["Assigned"],
  Assigned: ["Inspection Started"],
  "Inspection Started": ["Maintenance In Progress", "Waiting for Parts"],
  "Maintenance In Progress": ["Waiting for Parts", "Resolved"],
  "Waiting for Parts": ["Maintenance In Progress"],
  Resolved: ["Closed", "Reopened"],
  Closed: ["Reopened"],
  Reopened: ["Assigned", "Inspection Started"],
};

export default function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [maintenanceNotes, setMaintenanceNotes] = useState("");
  const [partsReplaced, setPartsReplaced] = useState("");
  const [maintenanceCost, setMaintenanceCost] = useState("");
  const [timeSpent, setTimeSpent] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [i, techs] = await Promise.all([getIssue(id), getTechnicians()]);
      setIssue(i);
      setTechnicians(techs);
      if (i) {
        setMaintenanceNotes(i.maintenanceNotes || "");
        setPartsReplaced(i.partsReplaced || "");
        setMaintenanceCost(i.maintenanceCost?.toString() || "");
        setTimeSpent(i.timeSpent || "");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(techId: string, techName: string) {
    if (!issue) return;
    setSaving(true);
    try {
      await updateIssue(issue.id, {
        assignedToId: techId,
        assignedToName: techName,
        status: "Assigned",
      });
      await addHistoryEntry({
        assetId: issue.assetId,
        issueId: issue.id,
        action: "Issue Assigned",
        actorName: user?.displayName || "Admin",
        actorRole: user?.role || "admin",
        details: `Assigned to ${techName}`,
      });
      loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: IssueStatus) {
    if (!issue) return;
    setSaving(true);
    try {
      const updates: Partial<Issue> = { status: newStatus };

      if (newStatus === "Inspection Started") {
        await addHistoryEntry({
          assetId: issue.assetId,
          issueId: issue.id,
          action: "Inspection Started",
          actorName: user?.displayName || "Technician",
          actorRole: user?.role || "technician",
          details: "Inspection started",
        });
      }

      if (newStatus === "Maintenance In Progress") {
        await addHistoryEntry({
          assetId: issue.assetId,
          issueId: issue.id,
          action: "Maintenance Started",
          actorName: user?.displayName || "Technician",
          actorRole: user?.role || "technician",
          details: "Maintenance work begun",
        });
      }

      if (newStatus === "Resolved") {
        if (!maintenanceNotes.trim()) {
          setSaving(false);
          alert("Maintenance notes are required to resolve an issue.");
          return;
        }
        updates.maintenanceNotes = maintenanceNotes;
        updates.partsReplaced = partsReplaced || undefined;
        updates.maintenanceCost = maintenanceCost
          ? parseFloat(maintenanceCost)
          : undefined;
        updates.timeSpent = timeSpent || undefined;
        updates.completedDate = new Date().toISOString();
        updates.resolvedBy = user?.displayName || "Technician";

        await addHistoryEntry({
          assetId: issue.assetId,
          issueId: issue.id,
          action: "Issue Resolved",
          actorName: user?.displayName || "Technician",
          actorRole: user?.role || "technician",
          details: `Resolved. ${maintenanceNotes}${partsReplaced ? ` Parts: ${partsReplaced}` : ""}${maintenanceCost ? ` Cost: Rs. ${maintenanceCost}` : ""}`,
        });
      }

      if (newStatus === "Reopened") {
        await addHistoryEntry({
          assetId: issue.assetId,
          issueId: issue.id,
          action: "Issue Reopened",
          actorName: user?.displayName || "Admin",
          actorRole: user?.role || "admin",
          details: "Issue reopened for further work",
        });
      }

      await updateIssue(issue.id, updates);
      loadData();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Issue not found</h2>
        <Link
          href="/dashboard/issues"
          className="text-[var(--primary)] hover:underline mt-2 inline-block"
        >
          Back to Issues
        </Link>
      </div>
    );
  }

  const allowedTransitions = STATUS_TRANSITIONS[issue.status] || [];
  const isClosed = issue.status === "Closed";
  const isAdmin = user?.role === "admin";
  const isAssignedTech = user?.uid === issue.assignedToId;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/dashboard/issues"
        className="inline-flex items-center gap-1 text-sm text-[var(--secondary)] hover:text-[var(--foreground)] mb-4"
      >
        <ArrowLeft size={16} />
        Back to Issues
      </Link>

      <div className="bg-white rounded-xl border border-[var(--border)] p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{issue.title}</h1>
            <p className="text-[var(--secondary)] font-mono text-sm mt-1">
              {issue.issueNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {issue.priority === "Critical" && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">
                CRITICAL
              </span>
            )}
            <span
              className={`text-xs px-3 py-1 rounded-full priority-${issue.priority.toLowerCase()}`}
            >
              {issue.priority}
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-[var(--muted)]">
              {issue.status}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-[var(--secondary)]">Asset:</span>{" "}
            <Link
              href={`/dashboard/assets/${issue.assetId}`}
              className="font-medium text-[var(--primary)] hover:underline"
            >
              {issue.assetName}
            </Link>{" "}
            <span className="text-[var(--secondary)]">({issue.assetCode})</span>
          </div>
          <div>
            <span className="text-[var(--secondary)]">Category:</span>{" "}
            <span className="font-medium">{issue.category}</span>
          </div>
          <div>
            <span className="text-[var(--secondary)]">Reported by:</span>{" "}
            <span className="font-medium">{issue.reporterName}</span>
          </div>
          <div>
            <span className="text-[var(--secondary)]">Date:</span>{" "}
            <span className="font-medium">
              {new Date(issue.createdAt).toLocaleDateString()}
            </span>
          </div>
          {issue.assignedToName && (
            <div>
              <span className="text-[var(--secondary)]">Assigned to:</span>{" "}
              <span className="font-medium">{issue.assignedToName}</span>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--border)] pt-4">
          <h3 className="text-sm font-medium text-[var(--secondary)] mb-1">
            Description
          </h3>
          <p className="text-sm">{issue.description}</p>
        </div>
      </div>

      {!isClosed && (isAdmin || isAssignedTech) && (
        <div className="bg-white rounded-xl border border-[var(--border)] p-6 mb-6">
          <h2 className="font-semibold mb-4">Actions</h2>

          {issue.status === "Reported" && isAdmin && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Assign Technician
              </label>
              <div className="flex gap-2">
                <select
                  id="assign-tech"
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                >
                  <option value="">Select technician...</option>
                  {technicians.map((t) => (
                    <option key={t.uid} value={`${t.uid}|${t.displayName}`}>
                      {t.displayName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const sel = document.getElementById(
                      "assign-tech"
                    ) as HTMLSelectElement;
                    const [techId, techName] = sel.value.split("|");
                    if (techId) handleAssign(techId, techName);
                  }}
                  disabled={saving}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            </div>
          )}

          {allowedTransitions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allowedTransitions.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={saving}
                  className="px-4 py-2 bg-[var(--muted)] rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  {status === "Resolved"
                    ? "Mark Resolved"
                    : status === "Closed"
                      ? "Close Issue"
                      : status === "Reopened"
                        ? "Reopen"
                        : `Move to ${status}`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {(issue.status === "Inspection Started" ||
        issue.status === "Maintenance In Progress" ||
        issue.status === "Waiting for Parts") &&
        (isAdmin || isAssignedTech) && (
          <div className="bg-white rounded-xl border border-[var(--border)] p-6 mb-6">
            <h2 className="font-semibold mb-4">Maintenance Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Maintenance Notes * (required to resolve)
                </label>
                <textarea
                  value={maintenanceNotes}
                  onChange={(e) => setMaintenanceNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                  placeholder="Describe the work performed..."
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Parts Replaced
                  </label>
                  <input
                    type="text"
                    value={partsReplaced}
                    onChange={(e) => setPartsReplaced(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                    placeholder="e.g. HDMI Cable"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Cost (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={maintenanceCost}
                    onChange={(e) => setMaintenanceCost(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Time Spent
                  </label>
                  <input
                    type="text"
                    value={timeSpent}
                    onChange={(e) => setTimeSpent(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                    placeholder="e.g. 2 hours"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!issue) return;
                    setSaving(true);
                    try {
                      await updateIssue(issue.id, {
                        maintenanceNotes: maintenanceNotes || undefined,
                        partsReplaced: partsReplaced || undefined,
                        maintenanceCost: maintenanceCost
                          ? parseFloat(maintenanceCost)
                          : undefined,
                        timeSpent: timeSpent || undefined,
                      });
                      await addHistoryEntry({
                        assetId: issue.assetId,
                        issueId: issue.id,
                        action: "Parts Recorded",
                        actorName: user?.displayName || "Technician",
                        actorRole: user?.role || "technician",
                        details: `Notes updated${partsReplaced ? `. Parts: ${partsReplaced}` : ""}${maintenanceCost ? `. Cost: Rs. ${maintenanceCost}` : ""}`,
                      });
                      loadData();
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving..." : "Save Notes"}
                </button>
              </div>
            </div>
          </div>
        )}

      {issue.maintenanceNotes && (
        <div className="bg-white rounded-xl border border-[var(--border)] p-6">
          <h2 className="font-semibold mb-3">Resolution Details</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-[var(--secondary)]">Notes:</span>{" "}
              {issue.maintenanceNotes}
            </p>
            {issue.partsReplaced && (
              <p>
                <span className="text-[var(--secondary)]">Parts:</span>{" "}
                {issue.partsReplaced}
              </p>
            )}
            {issue.maintenanceCost !== undefined && (
              <p>
                <span className="text-[var(--secondary)]">Cost:</span> Rs.{" "}
                {issue.maintenanceCost.toLocaleString()}
              </p>
            )}
            {issue.timeSpent && (
              <p>
                <span className="text-[var(--secondary)]">Time:</span>{" "}
                {issue.timeSpent}
              </p>
            )}
            {issue.resolvedBy && (
              <p>
                <span className="text-[var(--secondary)]">Resolved by:</span>{" "}
                {issue.resolvedBy}
              </p>
            )}
            {issue.completedDate && (
              <p>
                <span className="text-[var(--secondary)]">Completed:</span>{" "}
                {new Date(issue.completedDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
