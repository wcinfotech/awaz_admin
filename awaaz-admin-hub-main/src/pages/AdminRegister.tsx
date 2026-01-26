import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/lib/api";
import type { AxiosError } from "axios";

export default function AdminRegisterPage() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatusMessage(null);
        if (!fullName || !email || !password || !confirmPassword) {
            toast.error("Please fill all fields");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await api.post("/admin/v1/auth/register/email", { name: fullName, email, password });
            const message = response?.data?.message || "Registration submitted";
            setStatusMessage(message);
            toast.success("Registration submitted", { description: message });
            setFullName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
        } catch (err) {
            const apiError = err as AxiosError<{ message?: string }>;
            const message = apiError?.response?.data?.message || (apiError as any)?.message || "Failed to register";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-3xl mx-auto py-12 px-4">
                <Card className="border-white/5 bg-card/90 shadow-card">
                    <CardHeader>
                        <CardTitle>Admin Register</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statusMessage ? (
                            <div className="space-y-4">
                                <p className="text-sm text-white/80">{statusMessage}</p>
                                <p className="text-sm text-muted-foreground">Registration date: {format(new Date(), "PPP p")}</p>
                                <div className="flex gap-2">
                                    <Link to="/login">
                                        <Button>Back to Login</Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-white">Full Name</Label>
                                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white">Email</Label>
                                    <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" type="email" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-white">Password</Label>
                                    <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white">Confirm Password</Label>
                                    <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" type="password" />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600" disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Register"}</Button>
                                    <Link to="/login" className="text-sm text-muted-foreground underline">Already registered? Login</Link>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}