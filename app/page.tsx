"use client";

import Link from "next/link";
import { Wrench, QrCode, AlertTriangle, Clock, Shield, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <nav className="flex items-center justify-between p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Wrench className="text-[var(--primary)]" size={28} />
          <span className="text-xl font-bold">MaintainIQ</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-[var(--primary)] hover:bg-blue-50 rounded-lg transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AI-Powered Maintenance
            <br />
            & Asset History Platform
          </h1>
          <p className="text-lg text-[var(--secondary)] max-w-2xl mx-auto mb-8">
            Give every physical asset a digital identity. Report issues, triage
            with AI, track maintenance, and maintain a complete history.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-8 py-3 bg-[var(--primary)] text-white rounded-xl text-lg font-semibold hover:bg-[var(--primary-hover)] transition-colors shadow-lg shadow-blue-200"
            >
              Open Dashboard
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: QrCode,
              title: "QR-Accessible Assets",
              desc: "Each asset gets a unique QR code. Scan to view details and report issues instantly.",
            },
            {
              icon: Sparkles,
              title: "AI Issue Triage",
              desc: "Natural language complaints are automatically structured into professional issue records.",
            },
            {
              icon: Clock,
              title: "Complete History",
              desc: "Every action is logged. Know who did what, when, and why.",
            },
            {
              icon: AlertTriangle,
              title: "Issue Workflow",
              desc: "Track issues from report to resolution with controlled status transitions.",
            },
            {
              icon: Shield,
              title: "Role-Based Access",
              desc: "Admins manage assets, technicians handle maintenance, public users report issues.",
            },
            {
              icon: Wrench,
              title: "Maintenance Records",
              desc: "Log parts, costs, notes, and evidence for every maintenance action.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow"
            >
              <feature.icon
                size={32}
                className="text-[var(--primary)] mb-4"
              />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-[var(--secondary)]">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[var(--border)] text-center">
          <h2 className="text-2xl font-bold mb-3">How It Works</h2>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {[
              "1. Register Asset",
              "2. Generate QR Code",
              "3. User Scans QR",
              "4. Reports Issue",
              "5. AI Triages",
              "6. Technician Assigned",
              "7. Maintenance Done",
              "8. History Updated",
            ].map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm"
              >
                <span className="w-7 h-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="font-medium">{step.replace(/^\d+\.\s/, "")}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center p-6 text-sm text-[var(--secondary)] border-t border-[var(--border)]">
        MaintainIQ &mdash; Built for SMIT Final Hackathon
      </footer>
    </div>
  );
}
