"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Box,
  AlertTriangle,
  LogOut,
  Shield,
  Wrench,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/assets", label: "Assets", icon: Box },
  { href: "/dashboard/issues", label: "Issues", icon: AlertTriangle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white p-2 rounded-lg shadow-md"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-[var(--border)] z-50 transform transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Wrench className="text-[var(--primary)]" size={24} />
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              MaintainIQ
            </h1>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden absolute top-4 right-4"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--secondary)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--border)]">
          {user && (
            <div className="mb-3 px-3">
              <div className="flex items-center gap-2 text-sm">
                {user.role === "admin" ? (
                  <Shield size={14} className="text-[var(--primary)]" />
                ) : (
                  <Wrench size={14} className="text-[var(--warning)]" />
                )}
                <span className="font-medium truncate">{user.displayName}</span>
              </div>
              <p className="text-xs text-[var(--secondary)] mt-0.5 ml-5 capitalize">
                {user.role}
              </p>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--danger)] hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
