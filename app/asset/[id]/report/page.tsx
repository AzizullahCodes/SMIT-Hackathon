"use client";

import { useEffect, useState, use } from "react";
import {
  getAsset,
  createIssue,
  generateIssueNumber,
  addHistoryEntry,
} from "@/lib/helpers";
import type { Asset, IssueCategory, IssuePriority } from "@/lib/types";
import { Wrench, CheckCircle, Sparkles } from "lucide-react";
import Link from "next/link";

const CATEGORIES: IssueCategory[] = [
  "Electrical",
  "Mechanical",
  "Plumbing",
  "HVAC",
  "IT/Network",
  "Furniture",
  "Structural",
  "General",
  "Other",
];

const PRIORITIES: IssuePriority[] = ["Low", "Medium", "High", "Critical"];

export default function ReportIssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [issueNumber, setIssueNumber] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium" as IssuePriority,
    category: "General" as IssueCategory,
    reporterName: "",
    reporterEmail: "",
    reporterPhone: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const a = await getAsset(id);
        setAsset(a);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleAITriage() {
    if (!form.description) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint: form.description,
          assetContext: asset
            ? {
                name: asset.name,
                category: asset.category,
                condition: asset.condition,
                location: asset.location,
                model: asset.model,
              }
            : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm((f) => ({
          ...f,
          title: data.title || f.title,
          category: data.category || f.category,
          priority: data.priority || f.priority,
        }));
      }
    } catch {
      // AI unavailable
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!asset) return;
    setError("");
    setSubmitting(true);

    try {
      const issueNum = generateIssueNumber();
      const issueId = await createIssue({
        issueNumber: issueNum,
        assetId: id,
        assetName: asset.name,
        assetCode: asset.code,
        title: form.title,
        description: form.description,
        priority: form.priority,
        category: form.category,
        status: "Reported",
        reporterName: form.reporterName || "Anonymous",
        reporterEmail: form.reporterEmail || "",
        reporterPhone: form.reporterPhone || undefined,
      });

      await addHistoryEntry({
        assetId: id,
        issueId,
        action: "Issue Reported",
        actorName: form.reporterName || "Anonymous",
        actorRole: "admin",
        details: `Issue reported: ${form.title}`,
      });

      setIssueNumber(issueNum);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to submit issue";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-2">Asset Not Found</h1>
          <Link
            href="/"
            className="text-[var(--primary)] hover:underline"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-[var(--primary)] text-white p-4">
          <div className="max-w-lg mx-auto flex items-center gap-2">
            <Wrench size={20} />
            <span className="font-semibold">MaintainIQ</span>
          </div>
        </div>
        <div className="max-w-lg mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <CheckCircle
              size={48}
              className="mx-auto text-green-500 mb-4"
            />
            <h1 className="text-2xl font-bold mb-2">Issue Reported!</h1>
            <p className="text-[var(--secondary)] mb-4">
              Your issue has been submitted successfully.
            </p>
            <p className="text-sm bg-[var(--muted)] rounded-lg p-3 mb-6">
              Issue Number: <span className="font-mono font-bold">{issueNumber}</span>
            </p>
            <Link
              href={`/asset/${id}`}
              className="inline-block px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)]"
            >
              Back to Asset
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <p className="text-sm text-[var(--secondary)] mb-1">Reporting issue for</p>
          <h1 className="text-xl font-bold">{asset.name}</h1>
          <p className="text-sm text-[var(--secondary)] font-mono">{asset.code}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-4">Describe the Problem</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Problem Description *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                placeholder="What's wrong? Be as detailed as possible..."
              />
              <button
                type="button"
                onClick={handleAITriage}
                disabled={aiLoading || !form.description}
                className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 disabled:opacity-50 transition-colors"
              >
                <Sparkles size={14} />
                {aiLoading ? "Analyzing..." : "AI Auto-Triage"}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                placeholder="Brief title for the issue"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Your Name (optional)
              </label>
              <input
                type="text"
                name="reporterName"
                value={form.reporterName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email (optional)
              </label>
              <input
                type="email"
                name="reporterEmail"
                value={form.reporterEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                placeholder="For status updates"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[var(--primary)] text-white rounded-lg font-semibold hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
