"use client";

import { useEffect, useState, use } from "react";
import {
  getAsset,
  getIssuesByAsset,
  getAssetHistory,
  updateAsset,
} from "@/lib/helpers";
import { useAuth } from "@/contexts/AuthContext";
import type { Asset, Issue, HistoryEntry } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Copy,
  Edit3,
  Clock,
} from "lucide-react";

export default function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Asset>>({});

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [a, i, h] = await Promise.all([
        getAsset(id),
        getIssuesByAsset(id),
        getAssetHistory(id),
      ]);
      setAsset(a);
      setIssues(i);
      setHistory(h);
      if (a) setEditForm(a);
    } finally {
      setLoading(false);
    }
  }

  function getPublicUrl() {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/asset/${id}`;
    }
    return "";
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(getPublicUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadQR() {
    const svg = document.getElementById("qr-code-svg") as SVGElement | null;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 0, 0, 300, 300);
      const link = document.createElement("a");
      link.download = `${asset?.code || "qr-code"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }

  async function handleSaveEdit() {
    if (!asset) return;
    await updateAsset(asset.id, editForm);
    setEditing(false);
    loadData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Asset not found</h2>
        <Link
          href="/dashboard/assets"
          className="text-[var(--primary)] hover:underline mt-2 inline-block"
        >
          Back to Assets
        </Link>
      </div>
    );
  }

  const publicUrl = getPublicUrl();

  return (
    <div>
      <Link
        href="/dashboard/assets"
        className="inline-flex items-center gap-1 text-sm text-[var(--secondary)] hover:text-[var(--foreground)] mb-4"
      >
        <ArrowLeft size={16} />
        Back to Assets
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-[var(--border)] p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.name || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="text-2xl font-bold border border-[var(--border)] rounded px-2 py-1 w-full"
                  />
                ) : (
                  <h1 className="text-2xl font-bold">{asset.name}</h1>
                )}
                <p className="text-[var(--secondary)] font-mono text-sm mt-1">
                  {asset.code}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-3 py-1 rounded-full status-${asset.status.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {asset.status}
                </span>
                {user?.role === "admin" && (
                  <button
                    onClick={() => (editing ? handleSaveEdit() : setEditing(true))}
                    className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--secondary)]">Category:</span>{" "}
                {editing ? (
                  <select
                    value={editForm.category || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                    className="border border-[var(--border)] rounded px-2 py-1 ml-1"
                  >
                    {[
                      "Electronics",
                      "Furniture",
                      "HVAC",
                      "Plumbing",
                      "Electrical",
                      "IT/Network",
                      "Structural",
                      "General",
                      "Other",
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-medium">{asset.category}</span>
                )}
              </div>
              <div>
                <span className="text-[var(--secondary)]">Location:</span>{" "}
                {editing ? (
                  <input
                    type="text"
                    value={editForm.location || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, location: e.target.value })
                    }
                    className="border border-[var(--border)] rounded px-2 py-1 ml-1"
                  />
                ) : (
                  <span className="font-medium">{asset.location}</span>
                )}
              </div>
              <div>
                <span className="text-[var(--secondary)]">Condition:</span>{" "}
                {editing ? (
                  <select
                    value={editForm.condition || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        condition: e.target.value as Asset["condition"],
                      })
                    }
                    className="border border-[var(--border)] rounded px-2 py-1 ml-1"
                  >
                    {["Excellent", "Good", "Fair", "Poor", "Critical"].map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      )
                    )}
                  </select>
                ) : (
                  <span className="font-medium">{asset.condition}</span>
                )}
              </div>
              <div>
                <span className="text-[var(--secondary)]">Model:</span>{" "}
                <span className="font-medium">{asset.model || "N/A"}</span>
              </div>
              <div>
                <span className="text-[var(--secondary)]">Last Service:</span>{" "}
                <span className="font-medium">
                  {asset.lastServiceDate || "Never"}
                </span>
              </div>
              <div>
                <span className="text-[var(--secondary)]">Next Service:</span>{" "}
                <span className="font-medium">
                  {asset.nextServiceDate || "Not scheduled"}
                </span>
              </div>
              {asset.assignedTechnicianName && (
                <div className="sm:col-span-2">
                  <span className="text-[var(--secondary)]">Technician:</span>{" "}
                  <span className="font-medium">
                    {asset.assignedTechnicianName}
                  </span>
                </div>
              )}
            </div>

            {asset.description && (
              <p className="mt-4 text-sm text-[var(--secondary)]">
                {asset.description}
              </p>
            )}

            {editing && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)]"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditForm(asset);
                  }}
                  className="px-4 py-2 bg-[var(--muted)] rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[var(--border)]">
            <div className="p-4 border-b border-[var(--border)]">
              <h2 className="font-semibold">Issue History</h2>
            </div>
            {issues.length === 0 ? (
              <p className="p-4 text-sm text-[var(--secondary)]">
                No issues reported yet.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {issues.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/dashboard/issues/${issue.id}`}
                    className="flex items-center justify-between p-4 hover:bg-[var(--muted)] transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{issue.title}</p>
                      <p className="text-xs text-[var(--secondary)]">
                        {issue.issueNumber}
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
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[var(--border)]">
            <div className="p-4 border-b border-[var(--border)]">
              <h2 className="font-semibold flex items-center gap-2">
                <Clock size={16} />
                Activity Timeline
              </h2>
            </div>
            {history.length === 0 ? (
              <p className="p-4 text-sm text-[var(--secondary)]">
                No activity recorded yet.
              </p>
            ) : (
              <div className="p-4 space-y-3">
                {history.map((entry) => (
                  <div key={entry.id} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-[var(--primary)] mt-2 shrink-0" />
                    <div>
                      <p>
                        <span className="font-medium">{entry.action}</span>
                        <span className="text-[var(--secondary)] ml-2">
                          by {entry.actorName}
                        </span>
                      </p>
                      <p className="text-[var(--secondary)] text-xs">
                        {entry.details}
                      </p>
                      <p className="text-[var(--secondary)] text-xs mt-0.5">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[var(--border)] p-6">
            <h2 className="font-semibold mb-4">QR Code</h2>
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 border border-[var(--border)] rounded-xl">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={publicUrl}
                  size={200}
                  level="M"
                  includeMargin
                />
              </div>
            </div>
            <p className="text-xs text-center text-[var(--secondary)] mb-4 font-mono">
              {asset.code}
            </p>
            <div className="space-y-2">
              <button
                onClick={handleDownloadQR}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
              >
                <Download size={16} />
                Download QR
              </button>
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--muted)] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <Copy size={16} />
                {copied ? "Copied!" : "Copy Public Link"}
              </button>
              <Link
                href={`/asset/${id}`}
                target="_blank"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--muted)] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <ExternalLink size={16} />
                Open Public Page
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--border)] p-6">
            <h2 className="font-semibold mb-3">Print Label</h2>
            <div className="border border-[var(--border)] rounded-lg p-4 text-center">
              <p className="text-xs text-[var(--secondary)] mb-1">
                MaintainIQ
              </p>
              <p className="font-bold text-sm">{asset.name}</p>
              <p className="text-xs font-mono mb-2">{asset.code}</p>
              <QRCodeSVG value={publicUrl} size={120} level="M" />
              <p className="text-xs text-[var(--secondary)] mt-2">
                {asset.location}
              </p>
              <p className="text-[10px] text-[var(--secondary)] mt-1">
                Scan to report an issue
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
