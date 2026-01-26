import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search,
    RefreshCw,
    Download,
    Filter,
    Clock,
    User,
    Activity,
    AlertTriangle,
    CheckCircle2,
    Info,
    XCircle,
    Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/lib/api";

type LogLevel = "info" | "warning" | "error" | "success";
type LogType = "user" | "app" | "post" | "comment" | "notification" | "system" | "admin" | "report" | "sos";

interface LogEntry {
    _id: string;
    level: LogLevel;
    type: LogType;
    action: string;
    message: string;
    userId?: string;
    adminId?: string;
    entityId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    updatedAt: string;
    user?: {
        _id: string;
        name?: string;
        username?: string;
        email?: string;
    } | null;
    admin?: {
        _id: string;
        name?: string;
        email?: string;
    } | null;
}

interface LogStats {
    totalLogs: number;
    todayLogs: number;
    errorLogs: number;
    warningLogs: number;
    levelStats: Record<string, number>;
    typeStats: Record<string, number>;
}

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
}

const getLevelIcon = (level: LogLevel) => {
    switch (level) {
        case "info":
            return <Info className="h-4 w-4 text-blue-400" />;
        case "warning":
            return <AlertTriangle className="h-4 w-4 text-amber-400" />;
        case "error":
            return <XCircle className="h-4 w-4 text-red-400" />;
        case "success":
            return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
        default:
            return <Info className="h-4 w-4 text-blue-400" />;
    }
};

const getLogIcon = (type: LogType, level: LogLevel) => {
    // For SOS logs, always show Shield icon regardless of level
    if (type === "sos") {
        return <Shield className="h-4 w-4 text-red-400" />;
    }
    // For other types, use level-based icons
    return getLevelIcon(level);
};

const getLevelBadgeClass = (level: LogLevel) => {
    switch (level) {
        case "info":
            return "bg-blue-500/20 text-blue-400";
        case "warning":
            return "bg-amber-500/20 text-amber-400";
        case "error":
            return "bg-red-500/20 text-red-400";
        case "success":
            return "bg-emerald-500/20 text-emerald-400";
        default:
            return "bg-gray-500/20 text-gray-400";
    }
};

const getTypeBadgeClass = (type: LogType) => {
    switch (type) {
        case "user":
            return "bg-cyan-500/20 text-cyan-400";
        case "app":
            return "bg-purple-500/20 text-purple-400";
        case "post":
            return "bg-blue-500/20 text-blue-400";
        case "comment":
            return "bg-green-500/20 text-green-400";
        case "notification":
            return "bg-purple-500/20 text-purple-400";
        case "sos":
            return "bg-red-500/20 text-red-400";
        case "system":
            return "bg-gray-500/20 text-gray-400";
        case "admin":
            return "bg-orange-500/20 text-orange-400";
        case "report":
            return "bg-red-500/20 text-red-400";
        default:
            return "bg-gray-500/20 text-gray-400";
    }
};

const formatTimestamp = (timestamp: string) => {
    try {
        return format(new Date(timestamp), "MMM dd, yyyy • hh:mm:ss a");
    } catch {
        return timestamp;
    }
};

export default function LogsPage() {
    const [search, setSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch logs from API
    const { data: logsData, isLoading, refetch, isFetching } = useQuery({
        queryKey: ["activity-logs", page, levelFilter, typeFilter, debouncedSearch],
        queryFn: async () => {
            const params: Record<string, string> = {
                page: String(page),
                limit: "50",
            };
            if (levelFilter !== "all") params.level = levelFilter;
            if (typeFilter !== "all") params.type = typeFilter;
            if (debouncedSearch) params.search = debouncedSearch;

            const res = await api.get("/admin/v1/activity-log/list", { params });
            return res.data?.data as { logs: LogEntry[]; pagination: PaginationInfo };
        },
        staleTime: 30000, // 30 seconds
    });

    // Fetch stats
    const { data: statsData } = useQuery({
        queryKey: ["activity-log-stats"],
        queryFn: async () => {
            const res = await api.get("/admin/v1/activity-log/stats");
            return res.data?.data as LogStats;
        },
        staleTime: 60000, // 1 minute
    });

    const logs = logsData?.logs || [];
    const pagination = logsData?.pagination;

    const stats = {
        total: statsData?.totalLogs || 0,
        info: statsData?.levelStats?.info || 0,
        warning: statsData?.levelStats?.warning || 0,
        error: statsData?.levelStats?.error || 0,
        success: statsData?.levelStats?.success || 0,
    };

    const handleRefresh = async () => {
        await refetch();
        toast.success("Logs refreshed");
    };

    const handleExport = async () => {
        try {
            const res = await api.get("/admin/v1/activity-log/export", {
                params: {
                    level: levelFilter !== "all" ? levelFilter : undefined,
                    type: typeFilter !== "all" ? typeFilter : undefined,
                },
            });
            const data = JSON.stringify(res.data?.data || [], null, 2);
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `logs-${format(new Date(), "yyyy-MM-dd")}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Logs exported successfully");
        } catch (err) {
            toast.error("Failed to export logs");
        }
    };

    const handleExportCSV = async () => {
        try {
            const res = await api.get("/admin/v1/activity-log/export", {
                params: {
                    level: levelFilter !== "all" ? levelFilter : undefined,
                    type: typeFilter !== "all" ? typeFilter : undefined,
                },
            });
            const exportLogs = res.data?.data || [];

            if (!exportLogs.length) {
                toast.info("No logs to export");
                return;
            }

            const headers = ["timestamp", "level", "type", "action", "user", "details", "ip"];
            const escapeCsv = (value: any) => {
                if (value === null || value === undefined) return "";
                const str = String(value);
                const escaped = str.replace(/"/g, '""');
                return `"${escaped}"`;
            };

            const rows = exportLogs.map((log: any) => [
                log.timestamp,
                log.level,
                log.type,
                log.action,
                log.user,
                log.details,
                log.ip ?? "",
            ]);

            const csv = [headers.join(","), ...rows.map((r: any[]) => r.map(escapeCsv).join(","))].join("\n");
            const csvWithBom = "\uFEFF" + csv;
            const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`Exported ${exportLogs.length} logs (CSV)`);
        } catch (err) {
            toast.error("Failed to export logs");
        }
    };

    return (
        <AdminLayout title="Logs">
            <div className="space-y-6 text-foreground">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-5">
                    <Card className="border-white/10 bg-card">
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                                <Activity className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                                )}
                                <p className="text-xs text-muted-foreground">Total Logs</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-card">
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                                <Info className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    <p className="text-2xl font-bold text-white">{stats.info}</p>
                                )}
                                <p className="text-xs text-muted-foreground">Info</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-card">
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    <p className="text-2xl font-bold text-white">{stats.success}</p>
                                )}
                                <p className="text-xs text-muted-foreground">Success</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-card">
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                                <AlertTriangle className="h-6 w-6 text-amber-400" />
                            </div>
                            <div>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    <p className="text-2xl font-bold text-white">{stats.warning}</p>
                                )}
                                <p className="text-xs text-muted-foreground">Warnings</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-card">
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20">
                                <XCircle className="h-6 w-6 text-red-400" />
                            </div>
                            <div>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    <p className="text-2xl font-bold text-white">{stats.error}</p>
                                )}
                                <p className="text-xs text-muted-foreground">Errors</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Logs Table */}
                <Card className="border-white/10 bg-card">
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-lg">Activity Logs</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Monitor all system activities and actions
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-white/20"
                                onClick={handleRefresh}
                                disabled={isFetching}
                            >
                                <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
                                {isFetching ? "Refreshing..." : "Refresh"}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-white/20"
                                onClick={handleExportCSV}
                                disabled={logs.length === 0}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-white/20"
                                onClick={handleExport}
                                disabled={logs.length === 0}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export JSON
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[200px]">
                                <Input
                                    placeholder="Search logs..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 bg-white/5 border-white/10"
                                />
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            </div>
                            <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-[130px] bg-white/5 border-white/10">
                                    <SelectValue placeholder="Level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Levels</SelectItem>
                                    <SelectItem value="info">Info</SelectItem>
                                    <SelectItem value="success">Success</SelectItem>
                                    <SelectItem value="warning">Warning</SelectItem>
                                    <SelectItem value="error">Error</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-[130px] bg-white/5 border-white/10">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="app">App</SelectItem>
                                    <SelectItem value="post">Post</SelectItem>
                                    <SelectItem value="comment">Comment</SelectItem>
                                    <SelectItem value="notification">Notification</SelectItem>
                                    <SelectItem value="sos">SOS</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="report">Report</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Logs List */}
                        <div className="max-h-[500px] space-y-2 overflow-y-auto pr-2">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-24 w-full" />
                                ))
                            ) : logs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-lg font-medium text-white">No logs found</p>
                                    <p className="text-sm text-muted-foreground">
                                        {debouncedSearch || levelFilter !== "all" || typeFilter !== "all"
                                            ? "Try adjusting your filters"
                                            : "Activity logs will appear here as actions are performed"}
                                    </p>
                                </div>
                            ) : (
                                logs.map((log) => (
                                    <div
                                        key={log._id}
                                        className={cn(
                                            "flex items-start gap-4 rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10",
                                            log.level === "error" && "border-l-2 border-l-red-500",
                                            log.level === "warning" && "border-l-2 border-l-amber-500"
                                        )}
                                    >
                                        <div className="mt-0.5">{getLogIcon(log.type, log.level)}</div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-white">{log.action.replace(/_/g, " ")}</span>
                                                <Badge
                                                    variant="outline"
                                                    className={cn("border-0 text-[10px]", getLevelBadgeClass(log.level))}
                                                >
                                                    {log.level.toUpperCase()}
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className={cn("border-0 text-[10px]", getTypeBadgeClass(log.type))}
                                                >
                                                    {log.type.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{log.message || "No details"}</p>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {log.user?.name || log.user?.username || log.user?.email || 'System'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatTimestamp(log.createdAt)}
                                                </span>
                                                {log.ipAddress && (
                                                    <span className="text-white/40">IP: {log.ipAddress}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total)
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => p + 1)}
                                        disabled={page >= pagination.totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="rounded-xl border border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
                            <span>Showing {logs.length} logs{pagination ? ` of ${pagination.totalItems} total` : ""}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
