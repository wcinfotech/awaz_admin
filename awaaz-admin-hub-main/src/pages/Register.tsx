import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Mail, LockKeyhole, UserPlus } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";
import type { AxiosError } from "axios";

type RegisterFormProps = {
    siteKey: string;
};

const RegisterForm = ({ siteKey }: RegisterFormProps) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const navigate = useNavigate();
    const recaptchaRef = useRef<ReCAPTCHA | null>(null);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validatePassword = (password: string) => {
        return password.length >= 8;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!name.trim()) {
            setError("Please enter your name");
            toast.error("Name required", {
                description: "Enter your full name to continue.",
            });
            return;
        }

        if (!email) {
            setError("Please enter your email");
            toast.error("Email required", {
                description: "Enter a valid email address.",
            });
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address");
            toast.error("Invalid email", {
                description: "Enter a valid email format.",
            });
            return;
        }

        if (!password) {
            setError("Please enter a password");
            toast.error("Password required", {
                description: "Enter a password to secure your account.",
            });
            return;
        }

        if (!validatePassword(password)) {
            setError("Password must be at least 8 characters");
            toast.error("Weak password", {
                description: "Password must be at least 8 characters long.",
            });
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            toast.error("Password mismatch", {
                description: "Confirm password must match your password.",
            });
            return;
        }

        // Check captcha
        if (!captchaToken) {
            toast.error("Complete the captcha", {
                description: "Please tick the checkbox to continue.",
            });
            return;
        }

        setIsLoading(true);

        // Save as Admin account (project is admin panel)
        try {
            const response = await api.post("/admin/v1/auth/register/email", { name, email, password });
            const message = response?.data?.message || "Registration submitted";
            setStatusMessage(message);
            toast.success("Registration submitted", { description: message });
            setName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            recaptchaRef.current?.reset();
            setCaptchaToken(null);
        } catch (err) {
            const apiError = err as AxiosError<{ message?: string }>;
            const message = apiError?.response?.data?.message || (apiError as any)?.message || "Registration failed. Please try again.";
            setError(message);
            toast.error("Registration failed", {
                description: message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = name.trim() && validateEmail(email) && validatePassword(password) && password === confirmPassword;

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
                            <h2 className="text-3xl font-bold italic text-white leading-tight">
                                WELCOME TO THE OPERATOR PANEL OF AWAAZ APP
                            </h2>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-white">Name</Label>
                            <div className="relative">
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Name"
                                    className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40"
                                    required
                                />
                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/40">
                                    <User className="h-4 w-4" />
                                </div>
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-white">Email address</Label>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email"
                                    className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40"
                                    required
                                />
                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/40">
                                    <Mail className="h-4 w-4" />
                                </div>
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
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
                            {password && !validatePassword(password) && (
                                <p className="text-xs text-amber-400">Password must be at least 8 characters</p>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm Password"
                                    className="h-12 rounded-xl border-white/10 bg-white/5 pr-12 text-white placeholder:text-white/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    className="absolute inset-y-0 right-3 flex items-center text-white/60 hover:text-white"
                                    aria-label="Toggle confirm password visibility"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="text-xs text-red-400">Passwords do not match</p>
                            )}
                            {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
                                <p className="text-xs text-emerald-400">Passwords match</p>
                            )}
                        </div>

                        {/* Status Indicators */}
                        <div className="flex items-center justify-end text-sm text-white/70">
                            <div className="inline-flex items-center gap-2 text-xs text-white/50">
                                <span
                                    className={`inline-block h-2 w-2 rounded-full ${isFormValid ? "bg-emerald-400" : "bg-amber-400"}`}
                                />
                                <span>{isFormValid ? "Ready to register" : "Complete all fields"}</span>
                                <span className={`ml-2 inline-block h-2 w-2 rounded-full ${captchaToken ? "bg-emerald-400" : "bg-amber-400"}`} />
                                <span>{captchaToken ? "Captcha ready" : "Captcha required"}</span>
                            </div>
                        </div>

                        {/* Register Button */}
                        <div>
                            {statusMessage ? (
                                <div className="space-y-3">
                                    <div className="rounded-md bg-muted/20 p-4 text-center text-sm text-white/80">{statusMessage}</div>
                                    <div className="flex justify-center gap-2">
                                        <Link to="/login">
                                            <Button>Back to Login</Button>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    type="submit"
                                    className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-base font-semibold text-black shadow-lg transition-all hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/60"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/40 border-t-black" />
                                    ) : (
                                        <>
                                            Register
                                            <UserPlus className="h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>

                        {/* reCAPTCHA */}
                        <div className="flex items-center justify-center pt-2">
                            <ReCAPTCHA
                                ref={(ref) => (recaptchaRef.current = ref)}
                                sitekey={siteKey}
                                theme="dark"
                                onChange={(token) => setCaptchaToken(token)}
                                onExpired={() => setCaptchaToken(null)}
                            />
                        </div>

                        {/* Login Link */}
                        <p className="text-center text-sm text-white/60">
                            Already using Awaaz?{" "}
                            <Link to="/login" className="font-medium text-white underline underline-offset-2 hover:text-blue-300">
                                Login Now
                            </Link>
                        </p>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

const Register = () => {
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

    return <RegisterForm siteKey={siteKey} />;
};

export default Register;
