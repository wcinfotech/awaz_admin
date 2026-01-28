import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
    MapPin,
    Phone,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Eye,
    Download,
    Filter,
    Search
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Types
interface SosEvent {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        profilePicture?: string;
    };
    latitude: number;
    longitude: number;
    address?: string;
    mapLink: string;
    contacts: Array<{
        phone: string;
        status: "SENT" | "DELIVERED" | "FAILED";
        providerResponse?: string;
        sentAt: string;
        deliveredAt?: string;
        failedAt?: string;
    }>;
    overallStatus: "SENT" | "PARTIAL_FAILED" | "FAILED" | "RESOLVED";
    triggeredAt: string;
    resolvedAt?: string;
    resolvedBy?: {
        _id: string;
        name: string;
        email: string;
    };
}

interface SosStatistics {
    total: number;
    statusBreakdown: {
        sent: number;
        partialFailed: number;
        failed: number;
        resolved: number;
    };
    averageResponseTime?: {
        milliseconds: number;
        formatted: string;
    };
    recentEvents: SosEvent[];
}

export default function SosDashboard() {
    const queryClient = useQueryClient();
    const [selectedEvent, setSelectedEvent] = useState<SosEvent | null>(null);
    const [filters, setFilters] = useState({
        status: 'all',
        date: '',
        userId: '',
        search: ''
    });

    // Fetch SOS statistics
    const { data: statistics, isLoading: isLoadingStats } = useQuery<SosStatistics>({
        queryKey: ['sos-statistics', '7d'],
        queryFn: async () => {
            try {
                const res = await api.get('/admin/v1/sos/statistics?period=7d');
                console.log('🔍 SOS Statistics API Response:', res.data);

                // Ensure we always return valid data structure
                const data = res.data?.data;
                if (!data) {
                    console.log('🔍 No statistics data, returning default');
                    return {
                        total: 0,
                        statusBreakdown: {
                            sent: 0,
                            partialFailed: 0,
                            failed: 0,
                            resolved: 0
                        },
                        averageResponseTime: null,
                        recentEvents: []
                    };
                }

                return data;
            } catch (error) {
                console.error('🔍 SOS Statistics fetch error:', error);
                // Return default data on error
                return {
                    total: 0,
                    statusBreakdown: {
                        sent: 0,
                        partialFailed: 0,
                        failed: 0,
                        resolved: 0
                    },
                    averageResponseTime: null,
                    recentEvents: []
                };
            }
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    // Fetch SOS events list
    const { data: eventsData, isLoading: isLoadingEvents, refetch: refetchEvents } = useQuery<{
        events: SosEvent[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>({
        queryKey: ['sos-events', filters],
        queryFn: async () => {
            try {
                const params = new URLSearchParams();
                if (filters.status !== 'all') params.append('status', filters.status);
                if (filters.date) params.append('date', filters.date);
                if (filters.userId) params.append('userId', filters.userId);
                params.append('page', '1');
                params.append('limit', '20');

                const res = await api.get(`/admin/v1/sos/list?${params}`);
                console.log('🔍 SOS Events API Response:', res.data);

                // Ensure we always return valid data structure
                const data = res.data?.data;
                if (!data) {
                    console.log('🔍 No events data, returning default');
                    return {
                        events: [],
                        pagination: {
                            page: 1,
                            limit: 20,
                            total: 0,
                            pages: 0
                        }
                    };
                }

                return data;
            } catch (error) {
                console.error('🔍 SOS Events fetch error:', error);
                // Return default data on error
                return {
                    events: [],
                    pagination: {
                        page: 1,
                        limit: 20,
                        total: 0,
                        pages: 0
                    }
                };
            }
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    // Resolve SOS mutation
    const resolveMutation = useMutation({
        mutationFn: async (sosId: string) => {
            const res = await api.put(`/admin/v1/sos/${sosId}/resolve`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sos-events'] });
            queryClient.invalidateQueries({ queryKey: ['sos-statistics'] });
            toast.success("SOS event resolved successfully");
            setSelectedEvent(null);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to resolve SOS event");
        },
    });

    // Export SOS events
    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.status !== 'all') params.append('status', filters.status);
            if (filters.date) params.append('date', filters.date);
            if (filters.userId) params.append('userId', filters.userId);

            const res = await api.get(`/admin/v1/sos/export?${params}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `sos-events-${format(new Date(), 'yyyy-MM-dd')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("SOS events exported successfully");
        } catch (error) {
            toast.error("Failed to export SOS events");
        }
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            SENT: "bg-blue-500/20 text-blue-400",
            PARTIAL_FAILED: "bg-amber-500/20 text-amber-400",
            FAILED: "bg-red-500/20 text-red-400",
            RESOLVED: "bg-emerald-500/20 text-emerald-400"
        };

        return (
            <Badge className={cn("border-0", variants[status as keyof typeof variants])}>
                {status.replace('_', ' ')}
            </Badge>
        );
    };

    const getContactStatusBadge = (status: string) => {
        const variants = {
            SENT: "bg-blue-500/20 text-blue-400",
            DELIVERED: "bg-emerald-500/20 text-emerald-400",
            FAILED: "bg-red-500/20 text-red-400"
        };

        return (
            <Badge className={cn("border-0 text-xs", variants[status as keyof typeof variants])}>
                {status}
            </Badge>
        );
    };

    const filteredEvents = useMemo(() => {
        if (!eventsData?.events) return [];

        return eventsData.events.filter(event => {
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                return (
                    event.userId.name.toLowerCase().includes(searchLower) ||
                    event.userId.email.toLowerCase().includes(searchLower) ||
                    event.address?.toLowerCase().includes(searchLower)
                );
            }
            return true;
        });
    }, [eventsData, filters.search]);

    return (
        <AdminLayout title="SOS Emergency System">
            <div className="space-y-6">
                {/* Statistics Cards */}
                <div className="grid gap-4 lg:grid-cols-4">
                    <Card className="border-white/10 bg-card">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium">Total SOS</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{statistics?.total || 0}</div>
                            <p className="text-xs text-muted-foreground">Last 7 days</p>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-card">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium">Active</CardTitle>
                            <Clock className="h-4 w-4 text-amber-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">
                                {(statistics?.statusBreakdown.sent || 0) + (statistics?.statusBreakdown.partialFailed || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">Pending resolution</p>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-card">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium">Failed</CardTitle>
                            <XCircle className="h-4 w-4 text-red-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{statistics?.statusBreakdown.failed || 0}</div>
                            <p className="text-xs text-muted-foreground">Message delivery failed</p>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-card">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{statistics?.statusBreakdown.resolved || 0}</div>
                            <p className="text-xs text-muted-foreground">Successfully resolved</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="border-white/10 bg-card">
                    <CardHeader>
                        <CardTitle className="text-lg">Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                                    <SelectTrigger className="bg-white/5 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="SENT">Sent</SelectItem>
                                        <SelectItem value="PARTIAL_FAILED">Partial Failed</SelectItem>
                                        <SelectItem value="FAILED">Failed</SelectItem>
                                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={filters.date}
                                    onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                                    className="bg-white/5 border-white/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>User ID</Label>
                                <Input
                                    placeholder="Enter user ID"
                                    value={filters.userId}
                                    onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                                    className="bg-white/5 border-white/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, email..."
                                        value={filters.search}
                                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                        className="bg-white/5 border-white/10 pl-10"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => refetchEvents()}
                                disabled={isLoadingEvents}
                                className="bg-blue-600 hover:bg-blue-500"
                            >
                                <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingEvents && "animate-spin")} />
                                Refresh
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleExport}
                                className="border-white/20 text-white hover:bg-white/10"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* SOS Events List */}
                <Card className="border-white/10 bg-card">
                    <CardHeader>
                        <CardTitle className="text-lg">SOS Events</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredEvents.length} of {eventsData?.pagination.total || 0} events
                        </p>
                    </CardHeader>
                    <CardContent>
                        {isLoadingEvents ? (
                            <div className="flex items-center justify-center py-8">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="text-center py-8">
                                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-lg font-medium text-white">No SOS events found</p>
                                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredEvents.map((event) => (
                                    <Card key={event._id} className="border-white/10 bg-card/90">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-white">{event.userId.name}</span>
                                                        <span className="text-sm text-muted-foreground">{event.userId.email}</span>
                                                        {getStatusBadge(event.overallStatus)}
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {format(new Date(event.triggeredAt), "MMM dd, yyyy • hh:mm a")}
                                                        </span>
                                                        {event.address && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {event.address}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-muted-foreground">Contacts:</span>
                                                        {event.contacts.map((contact, index) => (
                                                            <div key={index} className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                <span className="text-sm">{contact.phone}</span>
                                                                {getContactStatusBadge(contact.status)}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {event.resolvedAt && (
                                                        <div className="text-sm text-emerald-400">
                                                            Resolved by {event.resolvedBy?.name} at {format(new Date(event.resolvedAt), "MMM dd, yyyy • hh:mm a")}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-white/20 text-white hover:bg-white/10"
                                                        onClick={() => window.open(event.mapLink, '_blank')}
                                                    >
                                                        <MapPin className="h-4 w-4 mr-1" />
                                                        Map
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-white/20 text-white hover:bg-white/10"
                                                        onClick={() => setSelectedEvent(event)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        Details
                                                    </Button>
                                                    {event.overallStatus !== 'RESOLVED' && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                                            onClick={() => resolveMutation.mutate(event._id)}
                                                            disabled={resolveMutation.isPending}
                                                        >
                                                            {resolveMutation.isPending ? (
                                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                            )}
                                                            Resolve
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* SOS Details Dialog */}
                <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#1a1a1f] border-white/10">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-white">
                                SOS Event Details
                            </DialogTitle>
                        </DialogHeader>

                        {selectedEvent && (
                            <div className="space-y-6">
                                {/* User Info */}
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-white">User Information</h3>
                                    <div className="grid gap-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Name:</span>
                                            <span className="text-white">{selectedEvent.userId.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Email:</span>
                                            <span className="text-white">{selectedEvent.userId.email}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Location Info */}
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-white">Location Information</h3>
                                    <div className="grid gap-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Coordinates:</span>
                                            <span className="text-white">{selectedEvent.latitude}, {selectedEvent.longitude}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Address:</span>
                                            <span className="text-white">{selectedEvent.address || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Map Link:</span>
                                            <Button
                                                size="sm"
                                                variant="link"
                                                className="p-0 h-auto text-blue-400"
                                                onClick={() => window.open(selectedEvent.mapLink, '_blank')}
                                            >
                                                Open in Google Maps
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Delivery Status */}
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-white">Message Delivery Status</h3>
                                    <div className="space-y-3">
                                        {selectedEvent.contacts.map((contact, index) => (
                                            <div key={index} className="border border-white/10 rounded-lg p-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4" />
                                                        <span className="text-white">{contact.phone}</span>
                                                        {getContactStatusBadge(contact.status)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Sent: {format(new Date(contact.sentAt), "hh:mm a")}
                                                        {contact.deliveredAt && (
                                                            <span> • Delivered: {format(new Date(contact.deliveredAt), "hh:mm a")}</span>
                                                        )}
                                                        {contact.failedAt && (
                                                            <span> • Failed: {format(new Date(contact.failedAt), "hh:mm a")}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {contact.providerResponse && (
                                                    <div className="mt-2 text-xs text-muted-foreground">
                                                        Provider Response: {contact.providerResponse}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-white">Timeline</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Triggered:</span>
                                            <span className="text-white">{format(new Date(selectedEvent.triggeredAt), "MMM dd, yyyy • hh:mm:ss a")}</span>
                                        </div>
                                        {selectedEvent.resolvedAt && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Resolved:</span>
                                                <span className="text-white">{format(new Date(selectedEvent.resolvedAt), "MMM dd, yyyy • hh:mm:ss a")}</span>
                                            </div>
                                        )}
                                        {selectedEvent.resolvedBy && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Resolved By:</span>
                                                <span className="text-white">{selectedEvent.resolvedBy.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
