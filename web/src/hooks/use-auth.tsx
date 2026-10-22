import { useCallback, useEffect, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";

import { supabase } from "@/lib/supabase";

export type UserRole = "admin" | "viewer" | "sub-office";

/** Registration account type for the public portal. */
export type ViewerAccountType = "writer" | "sub-office";

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
  school?: string;
  subOffice?: string;
}

const STORAGE_KEY = "deped-lr-tracker.auth.v2";

/** Admin credentials for SDO Batangas LRMS. */
const ADMIN_USERNAME = "SDOBatangasLRMS";
const ADMIN_PASSWORD = "SDOBatangas@LRMS*2026";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface StoredAuth {
  user: AuthUser | null;
}

/** Row shape from the Supabase viewer_accounts table. */
interface ViewerAccountRow {
  id: string;
  full_name: string;
  email: string;
  school: string;
  sub_office: string;
  role: string | null;
}

export interface RegisterViewerInput {
  name: string;
  email: string;
  /** Only required for writer accounts; sub-office monitors register without a school. */
  school?: string;
  subOffice: string;
  accountType: ViewerAccountType;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
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

/** Look up a registered viewer account by (case-insensitive) email. */
async function findViewerAccount(email: string): Promise<ViewerAccountRow | null> {
  const { data, error } = await supabase
    .from("viewer_accounts")
    .select("*")
    .ilike("email", email)
    .maybeSingle();
  if (error) {
    console.error("Failed to look up viewer account", error);
    return null;
  }
  return (data as ViewerAccountRow) ?? null;
}

/**
 * Authentication context for the SDO Batangas Learning Resource Tracker.
 * Admins authenticate with a username and password. Viewers must register
 * once (complete name, school, sub-office, email) and then sign in with the
 * registered name and email.
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

  /**
   * Sign in as a viewer. Both the complete name and the email must match the
   * viewer's registration record.
   */
  const loginViewer = useCallback(
    async (name: string, email: string): Promise<AuthResult> => {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();

      if (!trimmedName || !trimmedEmail) {
        return {
          ok: false,
          error: "Please enter your complete name and email address.",
        };
      }
      if (!EMAIL_REGEX.test(trimmedEmail)) {
        return { ok: false, error: "Please enter a valid email address." };
      }

      const account = await findViewerAccount(trimmedEmail);
      if (!account) {
        return {
          ok: false,
          error:
            "No registered account was found for this email address. Please register first.",
        };
      }
      if (account.full_name.trim().toLowerCase() !== trimmedName.toLowerCase()) {
        return {
          ok: false,
          error:
            "The name you entered does not match the one registered for this email address.",
        };
      }

      setUser({
        name: account.full_name,
        email: account.email,
        role: account.role === "sub_office" ? "sub-office" : "viewer",
        school: account.school,
        subOffice: account.sub_office,
      });
      return { ok: true };
    },
    [],
  );

  /**
   * Register a new viewer account (complete name, school, sub-office, email)
   * and sign the viewer in immediately.
   */
  const registerViewer = useCallback(
    async (input: RegisterViewerInput): Promise<AuthResult> => {
      const name = input.name.trim();
      const email = input.email.trim().toLowerCase();

      if (name.length < 2) {
        return { ok: false, error: "Please enter your complete name." };
      }
      if (!input.subOffice) {
        return { ok: false, error: "Please select your sub-office." };
      }
      if (input.accountType === "writer" && !input.school) {
        return { ok: false, error: "Please select your school." };
      }
      if (!email || !EMAIL_REGEX.test(email)) {
        return { ok: false, error: "Please enter a valid email address." };
      }

      const existing = await findViewerAccount(email);
      if (existing) {
        return {
          ok: false,
          error:
            "This email address is already registered. Please sign in instead.",
        };
      }

      const { error } = await supabase.from("viewer_accounts").insert({
        full_name: name,
        email,
        school: input.school ?? "",
        sub_office: input.subOffice,
        role: input.accountType === "sub-office" ? "sub_office" : "viewer",
      });
      if (error) {
        console.error("Failed to register viewer account", error);
        return {
          ok: false,
          error:
            error.code === "23505"
              ? "This email address is already registered. Please sign in instead."
              : "Registration failed. Please try again.",
        };
      }

      setUser({
        name,
        email,
        role: input.accountType === "sub-office" ? "sub-office" : "viewer",
        school: input.school ?? "",
        subOffice: input.subOffice,
      });
      return { ok: true };
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const isAdmin = user?.role === "admin";
  const isSubOffice = user?.role === "sub-office";

  return { user, isAdmin, isSubOffice, loginAdmin, loginViewer, registerViewer, logout };
}

export const [AuthProvider, useAuth] = createContextHook(useAuthProvider);
