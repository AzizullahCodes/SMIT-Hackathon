"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUser, createUser } from "@/lib/helpers";
import type { User } from "@/lib/types";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role: "admin" | "technician"
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const loginResolveRef = useRef<(() => void) | null>(null);

  const waitForLogin = useCallback(() => {
    return new Promise<void>((resolve) => {
      loginResolveRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email || "",
          displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
          role: "technician",
          createdAt: new Date().toISOString(),
        });
        setLoading(false);
        getUser(fbUser.uid)
          .then((userData) => {
            if (userData) setUser(userData);
          })
          .catch(() => {});
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!loading && loginResolveRef.current) {
      loginResolveRef.current();
      loginResolveRef.current = null;
    }
  }, [loading]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const loginPromise = waitForLogin();
    await signInWithEmailAndPassword(auth, email, password);
    await loginPromise;
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: "admin" | "technician"
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await createUser(cred.user.uid, { email, displayName: name, role });
    // Don't wait for auth state - register will logout immediately after
    setUser({ uid: cred.user.uid, email, displayName: name, role, createdAt: new Date().toISOString() });
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ firebaseUser, user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
