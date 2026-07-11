"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Wrench, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "technician">("technician");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const { login, register, logout } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name, role);
        await logout();
        setJustRegistered(true);
        setIsRegister(false);
        setEmail("");
        setPassword("");
        setName("");
      } else {
        await login(email, password);
        router.replace("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Wrench className="text-[var(--primary)]" size={32} />
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              MaintainIQ
            </h1>
          </div>
          <p className="text-[var(--secondary)]">
            AI-Powered Maintenance Platform
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-6">
            {isRegister ? "Create Account" : "Sign In"}
          </h2>

          {justRegistered && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              Account created! Please sign in.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as "admin" | "technician")
                    }
                    className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                  >
                    <option value="technician">Technician</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none pr-10"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--secondary)]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
            >
              {loading
                ? "Please wait..."
                : isRegister
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-[var(--secondary)]">
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            </span>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
                setJustRegistered(false);
              }}
              className="text-[var(--primary)] font-medium hover:underline"
            >
              {isRegister ? "Sign In" : "Register"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--secondary)] mt-6">
          <Link href="/" className="hover:underline">
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
