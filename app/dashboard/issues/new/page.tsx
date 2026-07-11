"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  createIssue,
  getAssets,
  generateIssueNumber,
  addHistoryEntry,
} from "@/lib/helpers";
import type { Asset, IssueCategory, IssuePriority } from "@/lib/types";
import { ArrowLeft, Sparkles } from "lucide-react";
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

export default function NewIssuePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const [form, setForm] = useState({
    assetId: "",
    title: "",
    description: "",
    priority: "Medium" as IssuePriority,
    category: "General" as IssueCategory,
    reporterName: user?.displayName || "",
    reporterEmail: user?.email || "",
    reporterPhone: "",
  });

  useEffect(() => {
    getAssets().then(setAssets);
  }, []);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        reporterName: user.displayName || "",
        reporterEmail: user.email || "",
      }));
    }
  }, [user]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === "assetId") {
      const asset = assets.find((a) => a.id === value);
      setSelectedAsset(asset || null);
    }
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
          assetContext: selectedAsset
            ? {
                name: selectedAsset.name,
                category: selectedAsset.category,
                condition: selectedAsset.condition,
                location: selectedAsset.location,
                model: selectedAsset.model,
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
      // AI unavailable, continue without it
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.assetId) {
      setError("Please select an asset");
      return;
    }
    setLoading(true);

    try {
      const asset = assets.find((a) => a.id === form.assetId)!;
      const issueNumber = generateIssueNumber();

      const issueId = await createIssue({
        issueNumber,
        assetId: form.assetId,
        assetName: asset.name,
        assetCode: asset.code,
        title: form.title,
        description: form.description,
        priority: form.priority,
        category: form.category,
        status: "Reported",
        reporterName: form.reporterName,
        reporterEmail: form.reporterEmail,
        reporterPhone: form.reporterPhone || undefined,
      });

      await addHistoryEntry({
        assetId: form.assetId,
        issueId,
        action: "Issue Reported",
        actorName: form.reporterName,
        actorRole: user?.role || "admin",
        details: `Issue reported: ${form.title}`,
      });

      router.push("/dashboard/issues");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to report issue";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard/issues"
        className="inline-flex items-center gap-1 text-sm text-[var(--secondary)] hover:text-[var(--foreground)] mb-4"
      >
        <ArrowLeft size={16} />
        Back to Issues
      </Link>

      <div className="bg-white rounded-xl border border-[var(--border)] p-6">
        <h1 className="text-2xl font-bold mb-6">Report New Issue</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Asset *
            </label>
            <select
              name="assetId"
              value={form.assetId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
            >
              <option value="">Choose an asset...</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.code}) - {a.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Describe the Problem *
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
              placeholder="Describe what's wrong in detail..."
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
              placeholder="Brief issue title"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
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
              <label className="block text-sm font-medium mb-1">Priority</label>
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

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Reporter Name
              </label>
              <input
                type="text"
                name="reporterName"
                value={form.reporterName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Reporter Email
              </label>
              <input
                type="email"
                name="reporterEmail"
                value={form.reporterEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Phone (optional)
            </label>
            <input
              type="tel"
              name="reporterPhone"
              value={form.reporterPhone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
            >
              {loading ? "Submitting..." : "Submit Issue"}
            </button>
            <Link
              href="/dashboard/issues"
              className="px-6 py-2.5 bg-[var(--muted)] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
