import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function PendingApproval() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="max-w-md w-full p-8">
                <div className="rounded-xl border border-white/5 bg-card/80 p-6 text-center">
                    <h2 className="text-2xl font-semibold text-white mb-2">Pending Approval</h2>
                    <p className="text-sm text-muted-foreground mb-6">Your admin access is pending approval from Super Admin. Please wait until your account is approved.</p>
                    <div className="flex justify-center gap-2">
                        <Button variant="outline" onClick={handleLogout}>Logout</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}