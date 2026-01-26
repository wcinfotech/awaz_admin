import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw, ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface HealthResponse {
    status: "ok" | "degraded" | "down";
    version?: string;
}

interface VerifyResponse {
    valid: boolean;
    role?: string;
}

export default function Health() {
    const { data: health, isLoading: healthLoading, refetch } = useQuery({
        queryKey: ["health"],
        queryFn: async () => {
            const res = await api.get("/health");
            return res.data as HealthResponse;
        },
    });

    const { data: verify, isLoading: verifyLoading, refetch: refetchVerify } = useQuery({
        queryKey: ["token-verify"],
        queryFn: async () => {
            const res = await api.get("/auth/verify");
            return res.data as VerifyResponse;
        },
    });

    const badgeClass = (status?: string) => {
        if (status === "ok") return "bg-success/10 text-success border-success/30";
        if (status === "degraded") return "bg-warning/10 text-warning border-warning/30";
        return "bg-destructive/10 text-destructive border-destructive/30";
    };

    return (
        <AdminLayout title="Health & Tokens">
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle>Health Check</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                            <RefreshCcw className="h-4 w-4" /> Refresh
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {healthLoading ? (
                            <Skeleton className="h-10 w-40" />
                        ) : (
                            <Badge variant="outline" className={badgeClass(health?.status)}>
                                {health?.status ?? "unknown"}
                            </Badge>
                        )}
                        <div className="text-sm text-muted-foreground">
                            Version: {health?.version ?? "n/a"}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle>Token Verification</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => refetchVerify()} className="gap-2">
                            <ShieldCheck className="h-4 w-4" /> Verify
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {verifyLoading ? (
                            <Skeleton className="h-10 w-40" />
                        ) : verify?.valid ? (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/30">Valid</Badge>
                        ) : (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Invalid</Badge>
                        )}
                        <div className="text-sm text-muted-foreground">Role: {verify?.role ?? "unknown"}</div>
                        <Button variant="secondary" onClick={() => toast.info("Standard API response handling")}>Inspect Response</Button>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
