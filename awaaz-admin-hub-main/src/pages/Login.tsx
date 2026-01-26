import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, LogOut } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type LoginFormProps = {
  siteKey: string;
};

const LoginForm = ({ siteKey }: LoginFormProps) => {
  const [email, setEmail] = useState("admin@awaaz.com");
  const [password, setPassword] = useState("operator123");
  const [showPassword, setShowPassword] = useState(false);
  const [keepMeLogin, setKeepMeLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [authStatus, setAuthStatus] = useState<"idle" | "success" | "error">("idle");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const { loginWithPassword, token, user } = useAuth();
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);

  useEffect(() => {
    if (token) navigate("/", { replace: true });
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      toast.error("Missing credentials", {
        description: "Enter both email and password to continue.",
      });
      return;
    }

    if (!captchaToken) {
      toast.error("Complete the captcha", {
        description: "Please tick the checkbox to continue.",
      });
      return;
    }

    setIsLoading(true);
    setAuthStatus("idle");

    try {
      const authedUser = await loginWithPassword({ email, password, remember: keepMeLogin });
      setAuthStatus("success");
      toast.success("Login successful", {
        description: "Welcome back, routing you to the dashboard.",
        duration: 2400,
      });
      if (authedUser.approval === "PENDING_APPROVAL") {
        navigate("/pending-approval", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      const message = typeof err === "string" ? err : (err as Error)?.message || "Login failed";
      setError(message);
      setAuthStatus("error");
      toast.error("Login failed", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_20%,hsl(var(--muted-foreground)/0.12),transparent_35%),radial-gradient(circle_at_80%_10%,hsl(var(--accent-foreground)/0.1),transparent_40%),linear-gradient(90deg,hsl(var(--muted)/0.12)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--muted)/0.12)_1px,transparent_1px)] bg-[length:520px_520px,620px_620px,120px_120px,120px_120px]">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0f] to-black opacity-90" />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize: "40px 40px" }} />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-xl rounded-3xl border border-white/5 bg-white/5 p-10 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex flex-col items-center text-center gap-6 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 p-2 shadow-lg shadow-blue-900/40 ring-1 ring-white/15">
              <img src="/awaz_logo.png" alt="Awaaz logo" className="h-full w-full object-contain" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xs uppercase tracking-[0.3em] text-blue-300">Awaaz Operator</h1>
              <h2 className="text-3xl font-bold text-white leading-tight">
                WELCOME TO THE OPERATOR PANEL OF AWAAZ APP
              </h2>
              <p className="text-sm text-white/60 max-w-xl">
                Secure access for operators. Dark-only experience with streamlined controls.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@awaaz.com"
                  className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40"
                  required
                />
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/40">
                  <LockKeyhole className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Link to="/forgot-password" className="text-blue-300 hover:text-blue-200">Forgot your password?</Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-white/10 bg-white/5 pr-12 text-white placeholder:text-white/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-white/60 hover:text-white"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-white/70">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-500"
                  checked={keepMeLogin}
                  onChange={(e) => setKeepMeLogin(e.target.checked)}
                />
                Keep me Login
              </label>
              <div className="inline-flex items-center gap-2 text-xs text-white/50">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${authStatus === "success"
                    ? "bg-emerald-400"
                    : authStatus === "error"
                      ? "bg-red-500"
                      : "bg-white/20"
                    }`}
                />
                {authStatus === "success"
                  ? "Session authenticated"
                  : authStatus === "error"
                    ? "Check credentials"
                    : "Awaiting sign-in"}
                <span className={`ml-2 inline-block h-2 w-2 rounded-full ${captchaToken ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span>{captchaToken ? "Captcha ready" : "Captcha required"}</span>
              </div>
            </div>

            <Button
              type="submit"
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-900/50 transition-all hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-blue-300/60"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <>
                  {authStatus === "success" ? "Enter Dashboard" : "Log In"}
                  {authStatus === "success" ? <LogOut className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
                </>
              )}
            </Button>

            <div className="flex items-center justify-center pt-2">
              <ReCAPTCHA
                ref={(ref) => (recaptchaRef.current = ref)}
                sitekey={siteKey}
                theme="dark"
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
              />
            </div>

            <p className="text-center text-sm text-white/60">
              New here?{" "}
              <Link to="/register" className="font-medium text-white underline underline-offset-2 hover:text-blue-300">
                Register Now
              </Link>

            </p>
            <p className="text-center text-xs text-white/60">Securely connects to the admin API for sign-in and approval checks.</p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

const Login = () => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

  if (!siteKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white px-6">
        <div className="max-w-lg rounded-2xl border border-white/10 bg-white/5 p-6 text-center shadow-lg backdrop-blur">
          <h2 className="text-xl font-semibold mb-2">reCAPTCHA not configured</h2>
          <p className="text-sm text-white/70">Set VITE_RECAPTCHA_SITE_KEY in your .env (restart Vite), then reload this page.</p>
        </div>
      </div>
    );
  }

  return <LoginForm siteKey={siteKey} />;
};

export default Login;
