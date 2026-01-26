import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2, Send } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type ForgotPasswordFormProps = {
    siteKey: string;
};

const ForgotPasswordForm = ({ siteKey }: ForgotPasswordFormProps) => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const recaptchaRef = useRef<ReCAPTCHA | null>(null);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email) {
            setError("Please enter your email address");
            toast.error("Email required", {
                description: "Enter your registered email to reset password.",
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

        if (!captchaToken) {
            toast.error("Complete the captcha", {
                description: "Please tick the checkbox to continue.",
            });
            return;
        }

        setIsLoading(true);

        // Simulate API call for password reset
        try {
            await new Promise((resolve) => setTimeout(resolve, 2000));

            setIsEmailSent(true);
            toast.success("Reset link sent!", {
                description: "Check your email for the password reset link.",
                duration: 5000,
            });
        } catch (err) {
            setError("Failed to send reset link. Please try again.");
            toast.error("Request failed", {
                description: typeof err === "string" ? err : "Please try again later.",
            });
            recaptchaRef.current?.reset();
            setCaptchaToken(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = () => {
        setIsEmailSent(false);
        setCaptchaToken(null);
        recaptchaRef.current?.reset();
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
                    {/* Back to Login Link */}
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Login
                    </Link>

                    <div className="flex flex-col items-center text-center gap-6 mb-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 p-2 shadow-lg shadow-blue-900/40 ring-1 ring-white/15">
                            <img src="/awaz_logo.png" alt="Awaaz logo" className="h-full w-full object-contain" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xs uppercase tracking-[0.3em] text-blue-300">Password Recovery</h1>
                            <h2 className="text-3xl font-bold text-white leading-tight">
                                {isEmailSent ? "Check Your Email" : "Forgot Password?"}
                            </h2>
                            <p className="text-sm text-white/60 max-w-md">
                                {isEmailSent
                                    ? `We've sent a password reset link to ${email}. Please check your inbox and spam folder.`
                                    : "No worries! Enter your registered email address and we'll send you a link to reset your password."}
                            </p>
                        </div>
                    </div>

                    {isEmailSent ? (
                        /* Success State */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-6"
                        >
                            <div className="flex flex-col items-center gap-4 py-6">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/40">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                                </div>
                                <div className="space-y-2 text-center">
                                    <p className="text-lg font-semibold text-white">Email Sent Successfully!</p>
                                    <p className="text-sm text-white/60">
                                        The reset link will expire in 15 minutes.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={handleResend}
                                    variant="outline"
                                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-white/20 text-base font-medium text-white hover:bg-white/10"
                                >
                                    <Mail className="h-5 w-5" />
                                    Resend Email
                                </Button>

                                <Link to="/login" className="block">
                                    <Button
                                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-900/50 transition-all hover:bg-blue-500"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                        Return to Login
                                    </Button>
                                </Link>
                            </div>

                            <p className="text-center text-xs text-white/40">
                                Didn't receive the email? Check your spam folder or try with a different email address.
                            </p>
                        </motion.div>
                    ) : (
                        /* Form State */
                        <>
                            {error && (
                                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Email Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-white">Email address</Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your registered email"
                                            className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40"
                                            required
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/40">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                    </div>
                                    {email && !validateEmail(email) && (
                                        <p className="text-xs text-amber-400">Please enter a valid email address</p>
                                    )}
                                    {email && validateEmail(email) && (
                                        <p className="text-xs text-emerald-400">Email format is valid</p>
                                    )}
                                </div>

                                {/* Status Indicators */}
                                <div className="flex items-center justify-end text-sm text-white/70">
                                    <div className="inline-flex items-center gap-2 text-xs text-white/50">
                                        <span
                                            className={`inline-block h-2 w-2 rounded-full ${validateEmail(email) ? "bg-emerald-400" : "bg-amber-400"}`}
                                        />
                                        <span>{validateEmail(email) ? "Email valid" : "Enter email"}</span>
                                        <span className={`ml-2 inline-block h-2 w-2 rounded-full ${captchaToken ? "bg-emerald-400" : "bg-amber-400"}`} />
                                        <span>{captchaToken ? "Captcha ready" : "Captcha required"}</span>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-900/50 transition-all hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-blue-300/60"
                                    disabled={isLoading || !validateEmail(email)}
                                >
                                    {isLoading ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                    ) : (
                                        <>
                                            Send Reset Link
                                            <Send className="h-5 w-5" />
                                        </>
                                    )}
                                </Button>

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
                                    Remember your password?{" "}
                                    <Link to="/login" className="font-medium text-white underline underline-offset-2 hover:text-blue-300">
                                        Login Now
                                    </Link>
                                </p>

                                {/* Register Link */}
                                <p className="text-center text-sm text-white/60">
                                    Don't have an account?{" "}
                                    <Link to="/register" className="font-medium text-white underline underline-offset-2 hover:text-blue-300">
                                        Register Now
                                    </Link>
                                </p>
                            </form>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

const ForgotPassword = () => {
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

    return <ForgotPasswordForm siteKey={siteKey} />;
};

export default ForgotPassword;
