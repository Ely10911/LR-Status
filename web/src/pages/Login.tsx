import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Loader2,
  Lock,
  Mail,
  School as SchoolIcon,
  ShieldCheck,
  User2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useVisitors } from "@/hooks/use-visitors";
import { SCHOOLS_BY_SUB_OFFICE, SUB_OFFICES } from "@/lib/schools";
import { cn } from "@/lib/utils";

type LoginMode = "admin" | "viewer";
type ViewerAction = "signin" | "register";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { loginAdmin, loginViewer, registerViewer } = useAuth();
  const { logVisitor } = useVisitors();
  const navigate = useNavigate();

  const [mode, setMode] = useState<LoginMode>("admin");
  const [viewerAction, setViewerAction] = useState<ViewerAction>("signin");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [viewerName, setViewerName] = useState<string>("");
  const [viewerEmail, setViewerEmail] = useState<string>("");
  const [regName, setRegName] = useState<string>("");
  const [regSubOffice, setRegSubOffice] = useState<string>("");
  const [regSchool, setRegSchool] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [pending, setPending] = useState<boolean>(false);
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

  const handleViewerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = viewerName.trim();
    const trimmedEmail = viewerEmail.trim();

    if (trimmedName.length < 2) {
      setError("Please enter your complete name.");
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

    setPending(true);
    const result = await loginViewer(trimmedName, trimmedEmail);
    setPending(false);

    if (!result.ok) {
      setError(result.error ?? "Sign in failed. Please try again.");
      return;
    }

    logVisitor(trimmedName, trimmedEmail);
    toast.success(`Welcome, ${trimmedName}`, {
      description: "Viewer access — browse resource statuses.",
    });
    navigate("/");
  };

  const handleViewerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = regName.trim();
    const trimmedEmail = regEmail.trim();

    if (trimmedName.length < 2) {
      setError("Please enter your complete name.");
      return;
    }
    if (!regSubOffice) {
      setError("Please select your sub-office.");
      return;
    }
    if (!regSchool) {
      setError("Please select your school.");
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

    setPending(true);
    const result = await registerViewer({
      name: trimmedName,
      email: trimmedEmail,
      school: regSchool,
      subOffice: regSubOffice,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error ?? "Registration failed. Please try again.");
      return;
    }

    logVisitor(trimmedName, trimmedEmail);
    toast.success(`Welcome, ${trimmedName}`, {
      description: "Your viewer account has been registered.",
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
    setViewerAction("signin");
    setRegName("");
    setRegSubOffice("");
    setRegSchool("");
    setRegEmail("");
  };

  const switchViewerAction = (action: ViewerAction) => {
    setViewerAction(action);
    setError("");
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

          {/* Viewer sign in / register */}
          {mode === "viewer" && (
            <div className="space-y-4">
              {/* Sign in / register toggle */}
              <div className="flex rounded-xl border border-white/10 bg-card/50 p-1">
                <button
                  type="button"
                  onClick={() => switchViewerAction("signin")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                    viewerAction === "signin"
                      ? "bg-accent text-accent-foreground shadow"
                      : "text-primary-foreground/60 hover:text-primary-foreground",
                  )}
                >
                  <Eye className="h-4 w-4" />
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchViewerAction("register")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                    viewerAction === "register"
                      ? "bg-accent text-accent-foreground shadow"
                      : "text-primary-foreground/60 hover:text-primary-foreground",
                  )}
                >
                  <UserPlus className="h-4 w-4" />
                  Register
                </button>
              </div>

              {viewerAction === "signin" ? (
                <form
                  onSubmit={handleViewerLogin}
                  className="space-y-5 rounded-2xl border border-white/10 bg-card p-6 text-card-foreground shadow-2xl shadow-black/30"
                >
                  <p className="text-sm text-muted-foreground">
                    Sign in using the complete name and email address you
                    registered.
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="viewerName">Complete Name</Label>
                    <div className="relative">
                      <User2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="viewerName"
                        value={viewerName}
                        onChange={(e) => setViewerName(e.target.value)}
                        placeholder="e.g. Juan A. Dela Cruz"
                        autoFocus
                        disabled={pending}
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
                        disabled={pending}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={pending}
                    className="w-full gap-2 bg-primary hover:bg-primary/90"
                  >
                    {pending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                    Sign In as Viewer
                  </Button>
                </form>
              ) : (
                <form
                  onSubmit={handleViewerRegister}
                  className="space-y-5 rounded-2xl border border-white/10 bg-card p-6 text-card-foreground shadow-2xl shadow-black/30"
                >
                  <p className="text-sm text-muted-foreground">
                    Register once to submit learning resources and track their
                    status. You will sign in with your registered name and email.
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="regName">Complete Name</Label>
                    <div className="relative">
                      <User2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="regName"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Juan A. Dela Cruz"
                        autoComplete="name"
                        autoFocus
                        disabled={pending}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regSubOffice">Sub-Office / Unit</Label>
                    <Select
                      onValueChange={(value) => {
                        setRegSubOffice(value);
                        setRegSchool("");
                      }}
                      value={regSubOffice}
                      disabled={pending}
                    >
                      <SelectTrigger id="regSubOffice">
                        <SelectValue placeholder="Select sub-office" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUB_OFFICES.map((office) => (
                          <SelectItem key={office} value={office}>
                            {office}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regSchool">School</Label>
                    <div className="relative">
                      <SchoolIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Select
                        onValueChange={setRegSchool}
                        value={regSchool}
                        disabled={pending || !regSubOffice}
                      >
                        <SelectTrigger id="regSchool" className="pl-9">
                          <SelectValue
                            placeholder={
                              regSubOffice ? "Select school" : "Select a sub-office first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {(SCHOOLS_BY_SUB_OFFICE[regSubOffice] ?? []).map((school) => (
                            <SelectItem key={school} value={school}>
                              {school}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regEmail">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="regEmail"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="e.g. juan.delacruz@deped.gov.ph"
                        autoComplete="email"
                        disabled={pending}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={pending}
                    className="w-full gap-2 bg-primary hover:bg-primary/90"
                  >
                    {pending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <UserPlus className="h-5 w-5" />
                    )}
                    Create Viewer Account
                  </Button>
                </form>
              )}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-primary-foreground/50">
            Viewers must register before signing in. Only Admin users can add
            and update learning resources. All resources are submitted by SDO
            Batangas.
          </p>
        </div>
      </div>
    </div>
  );
}
