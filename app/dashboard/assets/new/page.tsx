"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createAsset, getAssets, getTechnicians } from "@/lib/helpers";
import type { User, AssetCondition, AssetStatus } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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

const CONDITIONS: AssetCondition[] = [
  "Excellent",
  "Good",
  "Fair",
  "Poor",
  "Critical",
];

const STATUSES: AssetStatus[] = [
  "Operational",
  "Issue Reported",
  "Under Inspection",
  "Under Maintenance",
  "Out of Service",
  "Retired",
];

export default function NewAssetPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "Electronics",
    location: "",
    condition: "Good" as AssetCondition,
    status: "Operational" as AssetStatus,
    description: "",
    model: "",
    serialNumber: "",
    purchaseDate: "",
    assignedTechnicianId: "",
    assignedTechnicianName: "",
  });

  useEffect(() => {
    getTechnicians().then(setTechnicians);
  }, []);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleTechChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const techId = e.target.value;
    const tech = technicians.find((t) => t.uid === techId);
    setForm({
      ...form,
      assignedTechnicianId: techId,
      assignedTechnicianName: tech?.displayName || "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const existingAssets = await getAssets();
      const count = existingAssets.filter(
        (a) => a.category === form.category
      ).length;
      const code = `${form.category.substring(0, 3).toUpperCase()}-${String(count + 1).padStart(4, "0")}`;

      const duplicateCode = existingAssets.find((a) => a.code === code);
      if (duplicateCode) {
        throw new Error("Asset code already exists. Try again.");
      }

      await createAsset({
        name: form.name,
        code,
        category: form.category,
        location: form.location,
        condition: form.condition,
        status: form.status,
        description: form.description,
        model: form.model || undefined,
        serialNumber: form.serialNumber || undefined,
        purchaseDate: form.purchaseDate || undefined,
        assignedTechnicianId: form.assignedTechnicianId || undefined,
        assignedTechnicianName: form.assignedTechnicianName || undefined,
        createdBy: user?.uid || "",
      });

      router.push("/dashboard/assets");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create asset";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard/assets"
        className="inline-flex items-center gap-1 text-sm text-[var(--secondary)] hover:text-[var(--foreground)] mb-4"
      >
        <ArrowLeft size={16} />
        Back to Assets
      </Link>

      <div className="bg-white rounded-xl border border-[var(--border)] p-6">
        <h1 className="text-2xl font-bold mb-6">Register New Asset</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Asset Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                placeholder="e.g. Classroom Projector 01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Category *
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
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location *</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
              placeholder="e.g. Building A, Room 101"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Condition</label>
              <select
                name="condition"
                value={form.condition}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
              placeholder="Brief description of the asset..."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <input
                type="text"
                name="model"
                value={form.model}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                placeholder="e.g. Epson EB-X51"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Serial Number
              </label>
              <input
                type="text"
                name="serialNumber"
                value={form.serialNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={form.purchaseDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Assign Technician
              </label>
              <select
                name="assignedTechnicianId"
                value={form.assignedTechnicianId}
                onChange={handleTechChange}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
              >
                <option value="">Unassigned</option>
                {technicians.map((t) => (
                  <option key={t.uid} value={t.uid}>
                    {t.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating..." : "Create Asset"}
            </button>
            <Link
              href="/dashboard/assets"
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
