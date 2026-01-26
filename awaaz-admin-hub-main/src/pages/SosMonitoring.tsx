import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Phone, MapPin, Clock, Check, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type SOSStatus = "Pending" | "Active" | "Escalated" | "Resolved";

interface SosItem {
    id: string;
    user: string;
    phone: string;
    location: string;
    timestamp: string; // ISO string
    status: SOSStatus;
    notes?: string[];
}

const initialSOS: SosItem[] = [
    {
        id: "sos-01",
        user: "Asha Verma",
        phone: "+91 98765 43210",
        location: "Sector 15, Noida",
        timestamp: new Date().toISOString(),
        status: "Pending",
        notes: [],
    },
    {
        id: "sos-02",
        user: "Kamal Rao",
        phone: "+91 91234 56789",
        location: "MG Road, Ahmedabad",
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        status: "Active",
        notes: ["Responder dispatched"],
    },
    {
        id: "sos-03",
        user: "Sonia Gupta",
        phone: "+91 99887 66554",
        location: "Bandra West, Mumbai",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        status: "Escalated",
        notes: ["Escalated to state control"],
    },
    {
        id: "sos-04",
        user: "Rohit Sen",
        phone: "+91 90123 45678",
        location: "Koramangala, Bangalore",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
        status: "Resolved",
        notes: ["Resolved by local team"],
    },
];

function StatusBadge({ status }: { status: SOSStatus }) {
    const classes = cn(
        "px-2 py-0.5 rounded-full text-xs font-medium",
        status === "Pending" && "bg-blue-500/20 text-blue-300",
        status === "Active" && "bg-emerald-500/20 text-emerald-400",
        status === "Escalated" && "bg-red-500/20 text-red-400",
        status === "Resolved" && "bg-gray-500/20 text-white/80"
    );
    return <span className={classes}>{status}</span>;
}

function SOSCard({ item, onUpdate }: { item: SosItem; onUpdate: (id: string, status: SOSStatus) => void }) {
    return (
        <Card className="border-white/10 bg-card/80">
            <CardContent className="flex items-start gap-4 p-4">
                <div className="flex flex-col items-center gap-2 w-16">
                    <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center text-white text-lg font-semibold">{item.user.slice(0, 2).toUpperCase()}</div>
                    <StatusBadge status={item.status} />
                </div>

                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold text-white">{item.user}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                                <Phone className="h-3 w-3" /> <span>{item.phone}</span>
                                <span className="mx-1">•</span>
                                <MapPin className="h-3 w-3" /> <span>{item.location}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground">{format(new Date(item.timestamp), "MMM dd, yyyy")}</div>
                            <div className="text-xs text-white/60">{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</div>
                        </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => onUpdate(item.id, "Active")} disabled={item.status === "Active"}>
                            <Check className="h-4 w-4 mr-1" /> Mark Active
                        </Button>
                        <Button size="sm" className="bg-red-600 hover:bg-red-500" onClick={() => onUpdate(item.id, "Escalated")} disabled={item.status === "Escalated"}>
                            <ArrowUpRight className="h-4 w-4 mr-1" /> Escalate
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500" onClick={() => onUpdate(item.id, "Resolved")} disabled={item.status === "Resolved"}>
                            Resolve
                        </Button>
                    </div>

                    {item.notes && item.notes.length > 0 && (
                        <div className="mt-3 text-sm text-white/80">
                            <Label className="text-sm">Notes</Label>
                            <ul className="mt-2 space-y-1">
                                {item.notes.map((n, i) => (
                                    <li key={i} className="text-sm text-white/70">- {n}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function SosMonitoringPage() {
    const [list, setList] = useState<SosItem[]>(initialSOS);

    const counts = useMemo(() => ({
        total: list.length,
        active: list.filter((s) => s.status === "Active").length,
        escalated: list.filter((s) => s.status === "Escalated").length,
        resolved: list.filter((s) => s.status === "Resolved").length,
    }), [list]);

    const handleUpdate = (id: string, status: SOSStatus) => {
        setList((prev) => prev.map((s) => (s.id === id ? { ...s, status, notes: status === "Escalated" ? [...(s.notes || []), "Escalated by Admin"] : s.notes } : s)));
    };

    return (
        <AdminLayout title="SOS Monitoring">
            <div className="space-y-6 text-foreground">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">SOS Monitoring</h1>
                        <p className="text-sm text-muted-foreground">Monitor and take action on SOS reports (UI-only).</p>
                    </div>
                    <div className="flex gap-3">
                        <Card className="border-white/10 bg-card/80 px-4 py-3">
                            <CardContent>
                                <div className="text-xs text-muted-foreground">Total SOS</div>
                                <div className="text-xl font-semibold">{counts.total}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-white/10 bg-card/80 px-4 py-3">
                            <CardContent>
                                <div className="text-xs text-muted-foreground">Active</div>
                                <div className="text-xl font-semibold text-emerald-400">{counts.active}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-white/10 bg-card/80 px-4 py-3">
                            <CardContent>
                                <div className="text-xs text-muted-foreground">Escalated</div>
                                <div className="text-xl font-semibold text-red-400">{counts.escalated}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-white/10 bg-card/80 px-4 py-3">
                            <CardContent>
                                <div className="text-xs text-muted-foreground">Resolved</div>
                                <div className="text-xl font-semibold text-white/80">{counts.resolved}</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Card className="border-white/10 bg-card">
                    <CardHeader>
                        <CardTitle>SOS List</CardTitle>
                        <p className="text-sm text-muted-foreground">Recent SOS reports at a glance. Actions update status locally.</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid gap-3">
                            {list.map((item) => (
                                <SOSCard key={item.id} item={item} onUpdate={handleUpdate} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
