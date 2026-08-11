import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Lock, Mail, ShieldCheck, User2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useVisitors } from "@/hooks/use-visitors";
import { cn } from "@/lib/utils";

type LoginMode = "admin" | "viewer";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { loginAdmin, loginViewer } = useAuth();
  const { logVisitor } = useVisitors();
  const navigate = useNavigate();

  const [mode, setMode] = useState<LoginMode>("admin");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [viewerName, setViewerName] = useState<string>("");
  const [viewerEmail, setViewerEmail] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    const success = loginAdmin(username, password);
    if (success) {
      toast.success("Welcome, SDO Batangas LRMS Admin", {
        description: "Admin access — you can log and update learning resources.",
      });
      navigate("/");
    } else {
      setError("Invalid username or password. Please try again.");
    }
  };

  const handleViewerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = viewerName.trim();
    const trimmedEmail = viewerEmail.trim();

    if (trimmedName.length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    loginViewer(trimmedName, trimmedEmail);
    logVisitor(trimmedName, trimmedEmail);
    toast.success(`Welcome, ${trimmedName}`, {
      description: "Viewer access — browse resource statuses.",
    });
    navigate("/");
  };

  const switchMode = (newMode: LoginMode) => {
    setMode(newMode);
    setError("");
    setUsername("");
    setPassword("");
    setViewerName("");
    setViewerEmail("");
  };

  return (
    <div className="min-h-screen">
      {/* Philippine tricolor accent strip */}
      <div className="flex h-1.5">
        <div className="flex-1 bg-[hsl(217,71%,38%)]" />
        <div className="flex-1 bg-[hsl(350,78%,45%)]" />
        <div className="flex-1 bg-[hsl(43,96%,50%)]" />
      </div>

      <div className="header-texture flex min-h-[calc(100vh-6px)] flex-col items-center justify-center px-4 py-12 text-primary-foreground">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            {/* SDO Batangas Logo */}
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl shadow-black/30 ring-4 ring-accent/30">
              <img
                src="/sdo-batangas-logo.png"
                alt="SDO Batangas Logo"
                className="h-full w-full rounded-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector(".logo-fallback")) {
                    const fallback = document.createElement("div");
                    fallback.className = "logo-fallback flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground";
                    fallback.innerHTML = "<svg width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'/><path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'/></svg>";
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Department of Education · LRMDS
            </p>
            <h1 className="font-display mt-1 text-2xl font-semibold">
              SDO Batangas Learning Resource Tracker
            </h1>
            <p className="mt-2 max-w-sm text-sm text-primary-foreground/70">
              Monitor the quality assurance status of DepEd-developed learning
              resources.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="mb-4 flex rounded-xl border border-white/10 bg-card/50 p-1">
            <button
              type="button"
              onClick={() => switchMode("admin")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                mode === "admin"
                  ? "bg-accent text-accent-foreground shadow"
                  : "text-primary-foreground/60 hover:text-primary-foreground",
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => switchMode("viewer")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                mode === "viewer"
                  ? "bg-accent text-accent-foreground shadow"
                  : "text-primary-foreground/60 hover:text-primary-foreground",
              )}
            >
              <Eye className="h-4 w-4" />
              Viewer
            </button>
          </div>

          {/* Admin login form */}
          {mode === "admin" && (
            <form
              onSubmit={handleAdminLogin}
              className="space-y-5 rounded-2xl border border-white/10 bg-card p-6 text-card-foreground shadow-2xl shadow-black/30"
            >
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter admin username"
                    autoComplete="username"
                    autoFocus
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full gap-2 bg-primary hover:bg-primary/90">
                <ShieldCheck className="h-5 w-5" />
                Sign In as Admin
              </Button>
            </form>
          )}

          {/* Viewer login form */}
          {mode === "viewer" && (
            <form
              onSubmit={handleViewerLogin}
              className="space-y-5 rounded-2xl border border-white/10 bg-card p-6 text-card-foreground shadow-2xl shadow-black/30"
            >
              <div className="space-y-2">
                <Label htmlFor="viewerName">Your Name</Label>
                <div className="relative">
                  <User2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="viewerName"
                    value={viewerName}
                    onChange={(e) => setViewerName(e.target.value)}
                    placeholder="e.g. Juan A. Dela Cruz"
                    autoFocus
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="viewerEmail">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="viewerEmail"
                    type="email"
                    value={viewerEmail}
                    onChange={(e) => setViewerEmail(e.target.value)}
                    placeholder="e.g. juan.delacruz@deped.gov.ph"
                    autoComplete="email"
                    className="pl-9"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full gap-2 bg-primary hover:bg-primary/90">
                <Eye className="h-5 w-5" />
                Sign In as Viewer
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-primary-foreground/50">
            Only Admin users can add and update learning resources. All
            resources are submitted by SDO Batangas.
          </p>
        </div>
      </div>
    </div>
  );
}
