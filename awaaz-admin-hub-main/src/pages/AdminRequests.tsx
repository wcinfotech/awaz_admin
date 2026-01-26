import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layout/AdminLayout";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { RefreshCw } from "lucide-react";

type AdminStatus = "Approved" | "Rejected" | "Pending";

interface AdminItem {
    _id: string;
    email: string;
    name?: string;
    createdAt?: string;
    ownerApproveStatus?: AdminStatus | string;
    isVerified?: boolean;
}

export default function AdminRequests() {
    const { user } = useAuth();
    const [admins, setAdmins] = useState<AdminItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/v1/user/all-admin-users", { params: { limit: 100 } });
            const list = res?.data?.body?.data || [];
            setAdmins(list);
        } catch (err: any) {
            toast.error("Failed to load admin requests", { description: err?.response?.data?.message || err?.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const updateStatus = async (adminId: string, status: AdminStatus) => {
        setLoading(true);
        try {
            const res = await api.patch("/admin/v1/user/update-status-approved-or-rejected", {
                registerAdminId: adminId,
                status,
            });

            setAdmins((prev) =>
                prev.map((admin) =>
                    admin._id === adminId
                        ? { ...admin, ownerApproveStatus: status, isVerified: status === "Approved" }
                        : admin
                )
            );

            toast.success(`Admin ${status.toLowerCase()}`);
            const warning = res?.data?.body?.emailWarning;
            if (warning) {
                toast.info("Email skipped", { description: warning });
            }

            fetchAdmins();
        } catch (err: any) {
            toast.error("Update failed", { description: err?.response?.data?.message || err?.message });
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => ({
        total: admins.length,
        approved: admins.filter((a) => (a.ownerApproveStatus || "").toLowerCase() === "approved").length,
        pending: admins.filter((a) => (a.ownerApproveStatus || "").toLowerCase() === "pending").length,
        rejected: admins.filter((a) => (a.ownerApproveStatus || "").toLowerCase() === "rejected").length,
    }), [admins]);

    const filtered = useMemo(() => {
        if (statusFilter === "all") return admins;
        return admins.filter((a) => (a.ownerApproveStatus || "").toLowerCase() === statusFilter.toLowerCase());
    }, [admins, statusFilter]);

    const renderBadge = (status?: string) => {
        const normalized = (status || "").toLowerCase();
        if (normalized === "pending") return <Badge className="bg-blue-500/20 text-blue-300">Pending</Badge>;
        if (normalized === "approved") return <Badge className="bg-emerald-500/20 text-emerald-300">Approved</Badge>;
        if (normalized === "rejected") return <Badge className="bg-red-500/20 text-red-300">Rejected</Badge>;
        return <Badge>{status}</Badge>;
    };

    return (
        <AdminLayout title="Admin Requests">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-white/5 bg-card/90 shadow-card cursor-pointer" onClick={() => setStatusFilter('all')}>
                        <CardHeader>
                            <CardTitle className="text-sm text-white/80">Total Admins</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-semibold text-white">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card className={`border-white/5 bg-card/90 shadow-card cursor-pointer ${statusFilter === 'approved' ? 'ring-2 ring-emerald-500' : ''}`} onClick={() => setStatusFilter('approved')}>
                        <CardHeader>
                            <CardTitle className="text-sm text-white/80">Approved</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-semibold text-white">{stats.approved}</div>
                        </CardContent>
                    </Card>
                    <Card className={`border-white/5 bg-card/90 shadow-card cursor-pointer ${statusFilter === 'pending' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setStatusFilter('pending')}>
                        <CardHeader>
                            <CardTitle className="text-sm text-white/80">Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-semibold text-white">{stats.pending}</div>
                        </CardContent>
                    </Card>
                    <Card className={`border-white/5 bg-card/90 shadow-card cursor-pointer ${statusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`} onClick={() => setStatusFilter('rejected')}>
                        <CardHeader>
                            <CardTitle className="text-sm text-white/80">Rejected</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-semibold text-white">{stats.rejected}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-white/5 bg-card/90 shadow-card">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Admin Requests</CardTitle>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchAdmins}
                            disabled={loading}
                            title="Refresh"
                            aria-label="Refresh admin requests"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="text-sm text-muted-foreground">Filter:</div>
                            <div className={`text-xs rounded-full px-2 py-1 ${statusFilter === 'all' ? 'bg-muted/20' : 'bg-muted/10'}`}>Status: <strong className="ml-1">{statusFilter === 'all' ? 'All' : statusFilter}</strong></div>
                            {statusFilter !== 'all' && <Button variant="outline" onClick={() => setStatusFilter('all')}>Clear</Button>}
                        </div>

                        <div className="space-y-3">
                            {filtered.length === 0 ? (
                                <div className="text-sm text-muted-foreground">No admin requests</div>
                            ) : (
                                filtered.map((a) => (
                                    <div key={a.email} className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-muted/10 p-3">
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold text-white">{a.name || a.email}</div>
                                            <div className="text-sm text-muted-foreground">{a.email}</div>
                                            <div className="text-xs text-muted-foreground">{a.createdAt ? format(new Date(a.createdAt), "PPP p") : ""}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {renderBadge(a.ownerApproveStatus)}
                                            {(a.ownerApproveStatus || "").toLowerCase() === "pending" ? (
                                                <div className="flex gap-2">
                                                    <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={() => updateStatus(a._id, "Approved")} disabled={loading}>Approve</Button>
                                                    <Button className="bg-red-600 hover:bg-red-500" onClick={() => updateStatus(a._id, "Rejected")} disabled={loading}>Reject</Button>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">No actions</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}