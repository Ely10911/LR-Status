import { useCallback, useEffect, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";

export type UserRole = "admin" | "viewer";

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
}

const STORAGE_KEY = "deped-lr-tracker.auth.v2";

/** Admin credentials for SDO Batangas LRMS. */
const ADMIN_USERNAME = "SDOBatangasLRMS";
const ADMIN_PASSWORD = "SDOBatangas@LRMS*2026";

interface StoredAuth {
  user: AuthUser | null;
}

function loadAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    return parsed.user ?? null;
  } catch (error) {
    console.error("Failed to load auth from storage", error);
    return null;
  }
}

/**
 * Authentication context for the SDO Batangas Learning Resource Tracker.
 * Admins authenticate with a username and password; viewers enter their name and email.
 */
function useAuthProvider() {
  const [user, setUser] = useState<AuthUser | null>(() => loadAuth());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user } satisfies StoredAuth));
    } catch (error) {
      console.error("Failed to persist auth", error);
    }
  }, [user]);

  /** Attempt admin login with username + password. Returns true on success. */
  const loginAdmin = useCallback((username: string, password: string): boolean => {
    if (username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setUser({ name: "SDO Batangas LRMS Admin", email: "", role: "admin" });
      return true;
    }
    return false;
  }, []);

  /** Sign in as a viewer (read-only access) with a display name and email. */
  const loginViewer = useCallback((name: string, email: string) => {
    setUser({ name, email, role: "viewer" });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const isAdmin = user?.role === "admin";

  return { user, isAdmin, loginAdmin, loginViewer, logout };
}

export const [AuthProvider, useAuth] = createContextHook(useAuthProvider);
