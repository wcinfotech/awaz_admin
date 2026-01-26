import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { DistanceSelector } from "@/components/DistanceSelector";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Archive, Filter, MapPin, RefreshCw, Search, X, HelpCircle, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const initialGeneralPosts = [
    {
        id: "g1",
        user: "Rohini Patel",
        title: "Road blocked near market",
        description: "A large truck overturned blocking both lanes.",
        location: "Sector 21, Noida",
        datetime: "2026-01-10T09:12:00",
        distanceKm: 2.4,
        status: "Pending" as const,
    },
    {
        id: "g2",
        user: "Yusuf Khan",
        title: "Water logging on main road",
        description: "Heavy rain causing water logging at the junction.",
        location: "MG Road, Ahmedabad",
        datetime: "2026-01-09T19:45:00",
        distanceKm: 12.7,
        status: "Approved" as const,
    },
    {
        id: "g3",
        user: "Neha Reddy",
        title: "Street light not working",
        description: "Several street lights are out near the park.",
        location: "Koramangala, Bangalore",
        datetime: "2026-01-08T11:00:00",
        distanceKm: 6.3,
        status: "Rejected" as const,
    },
];

type GeneralStatus = "Pending" | "Approved" | "Rejected";

function safeFormatDatetime(dt?: string) {
    if (!dt) return "Unknown date";
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    try {
        return format(d, "MMM dd, yyyy • hh:mm a");
    } catch {
        return dt;
    }
}

export default function GeneralPage() {
    const [posts, setPosts] = useState(() => {
        try {
            const raw = localStorage.getItem("awaaz:general_posts");
            return raw ? JSON.parse(raw) : initialGeneralPosts;
        } catch {
            return initialGeneralPosts;
        }
    });
    const [processingIds, setProcessingIds] = useState<string[]>([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Advanced filter controls
    const [filterEnabled, setFilterEnabled] = useState<boolean>(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newPost, setNewPost] = useState({ title: "", description: "", location: "" });

    // City picker
    const cities = [
        "Mumbai, India",
        "Delhi, India",
        "Bengaluru, India",
        "Kolkata, India",
        "Chennai, India",
        "Ahmedabad, India",
        "Hyderabad, India",
        "Pune, India",
        "Noida, India",
        "Gurgaon, India",
        "Surat, India",
        "Jaipur, India",
        "Lucknow, India",
        "Kanpur, India",
        "Nagpur, India",
        "Visakhapatnam, India",
        "Bhopal, India",
        "Patna, India",
        "Vadodara, India",
        "Thane, India",
    ];
    const [cityDialogOpen, setCityDialogOpen] = useState(false);
    const [citySearch, setCitySearch] = useState("");
    const [selectedCity, setSelectedCity] = useState<string>("All Cities");

    const [distanceKm, setDistanceKm] = useState(466.45);
    const [showDistance, setShowDistance] = useState(false);

    const allCount = useMemo(() => posts.length, [posts]);

    const dashboard = useMemo(() => ({
        total: posts.length,
        approved: posts.filter((p) => p.status === "Approved").length,
        pending: posts.filter((p) => p.status === "Pending").length,
        rejected: posts.filter((p) => p.status === "Rejected").length,
    }), [posts]);

    const dashboardItems = [
        { label: "Total General", value: `${dashboard.total}` },
        { label: "Approved", value: `${dashboard.approved}` },
        { label: "Pending", value: `${dashboard.pending}` },
        { label: "Rejected", value: `${dashboard.rejected}` },
    ];

    const filteredPosts = useMemo(() => {
        if (!posts) return [];

        return posts
            .filter((p) => {
                // Status
                if (statusFilter !== "all" && p.status !== statusFilter) return false;
                // Search
                if (search.trim()) {
                    const text = `${p.title} ${p.description} ${p.user}`.toLowerCase();
                    if (!text.includes(search.trim().toLowerCase())) return false;
                }

                if (filterEnabled) {
                    if (selectedDate) {
                        const postDate = new Date(p.datetime);
                        if (isNaN(postDate.getTime())) return false;
                        if (
                            postDate.getFullYear() !== selectedDate.getFullYear() ||
                            postDate.getMonth() !== selectedDate.getMonth() ||
                            postDate.getDate() !== selectedDate.getDate()
                        ) {
                            return false;
                        }
                    }

                    if (typeof (p as any).distanceKm === 'number' && distanceKm && distanceKm > 0) {
                        if ((p as any).distanceKm > distanceKm) return false;
                    }

                    if (selectedCity && selectedCity !== "All Cities") {
                        if (!p.location || !p.location.toLowerCase().includes(selectedCity.split(',')[0].toLowerCase())) return false;
                    }
                }

                return true;
            })
            .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
    }, [posts, search, statusFilter, filterEnabled, selectedDate, distanceKm, selectedCity]);

    const handleApprove = async (id: string) => {
        if (processingIds.includes(id)) return;
        setProcessingIds((s) => [...s, id]);
        await new Promise((r) => setTimeout(r, 800));
        setPosts((prev) => {
            const next = prev.map((p) => (p.id === id ? { ...p, status: "Approved" } : p));
            localStorage.setItem("awaaz:general_posts", JSON.stringify(next));
            import("@/lib/storage").then((m) => m.addLog({
                id: `log-${Date.now()}`,
                timestamp: new Date().toLocaleString(),
                level: "success",
                type: "event",
                user: "admin@awaaz.com",
                action: "General Approved",
                details: `Approved general post id: ${id}`,
            }));
            return next;
        });
        setProcessingIds((s) => s.filter((x) => x !== id));
    };

    const handleDisapprove = async (id: string) => {
        if (processingIds.includes(id)) return;
        setProcessingIds((s) => [...s, id]);
        await new Promise((r) => setTimeout(r, 800));
        setPosts((prev) => {
            const next = prev.map((p) => (p.id === id ? { ...p, status: "Rejected" } : p));
            localStorage.setItem("awaaz:general_posts", JSON.stringify(next));
            import("@/lib/storage").then((m) => m.addLog({
                id: `log-${Date.now()}`,
                timestamp: new Date().toLocaleString(),
                level: "info",
                type: "event",
                user: "admin@awaaz.com",
                action: "General Disapproved",
                details: `Disapproved general post id: ${id}`,
            }));
            return next;
        });
        setProcessingIds((s) => s.filter((x) => x !== id));
    };

    const handleCreatePost = async () => {
        if (!newPost.title.trim() || !newPost.description.trim()) return;
        setIsSubmitting(true);
        await new Promise((r) => setTimeout(r, 900));
        const created = {
            id: `g-${Date.now()}`,
            user: "Admin",
            title: newPost.title,
            description: newPost.description,
            location: newPost.location || "",
            datetime: new Date().toISOString(),
            status: "Pending" as GeneralStatus,
        };
        setPosts((p) => {
            const next = [created, ...p];
            localStorage.setItem("awaaz:general_posts", JSON.stringify(next));
            import("@/lib/storage").then((m) => m.addLog({
                id: `log-${Date.now()}`,
                timestamp: new Date().toLocaleString(),
                level: "success",
                type: "event",
                user: "admin@awaaz.com",
                action: "General Created",
                details: `Created general post id: ${created.id}`,
            }));
            return next;
        });
        setIsSubmitting(false);
        setIsCreateOpen(false);
        setNewPost({ title: "", description: "", location: "" });
    };



    return (
        <AdminLayout title="General">
            <div className="space-y-6 text-foreground">
                {/* Header */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-xl border border-white/5 bg-gradient-to-r from-blue-900/60 via-blue-800/50 to-blue-700/40 p-4 shadow-card">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold text-white">General</h1>
                        <p className="text-sm text-white/70">Overview of general posts</p>
                    </div>
                    <Button className="gap-2 rounded-full bg-blue-600 px-4 text-white shadow-md hover:bg-blue-500" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4" />
                        New Post
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    {dashboardItems.map((item) => (
                        <Card key={item.label} className="border-white/5 bg-card/90 shadow-card">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-white/80">{item.label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-semibold text-white">{item.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main content grid */}
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <Card className="border-white/5 bg-card/90 shadow-card">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-base text-white">All General ({allCount})</CardTitle>
                                <div className="mt-1 text-sm text-muted-foreground flex items-center gap-3">
                                    <span>Filters:</span>
                                    <span className="rounded-full bg-muted/20 px-2 py-1 text-xs">City: <strong className="text-white">{selectedCity}</strong></span>
                                    <span className="rounded-full bg-muted/20 px-2 py-1 text-xs">Date: <strong className="text-white">{selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Any'}</strong></span>
                                    <span className="rounded-full bg-muted/20 px-2 py-1 text-xs">Distance: <strong className="text-white">{distanceKm > 0 ? `${distanceKm.toFixed(2)} km` : 'Any'}</strong></span>
                                    <span className={`rounded-full px-2 py-1 text-xs ${filterEnabled ? 'bg-emerald-600 text-white' : 'bg-muted/20'}`}>{filterEnabled ? 'Enabled' : 'Disabled'}</span>
                                    <span className="ml-auto text-xs text-muted-foreground">Showing: <strong className="text-white">{filteredPosts.length}</strong></span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white/5 border-white/10" />
                                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                                    <SelectTrigger className="h-10 w-[120px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2">
                                {filteredPosts.length === 0 ? (
                                    <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-white/10 bg-muted/20 p-6 text-center">
                                        <p className="text-sm text-white/60">No General Found</p>
                                    </div>
                                ) : (
                                    filteredPosts.map((p) => (
                                        <Card key={p.id} className="border-white/10 bg-card/80">
                                            <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-[1fr_auto] md:items-start">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-semibold text-white">{p.title}</div>
                                                        <div className="text-xs text-muted-foreground">by {p.user}</div>
                                                    </div>
                                                    <div className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</div>
                                                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2"><MapPin className="h-3 w-3" /> {p.location}</div>
                                                    <div className="mt-2 text-xs text-muted-foreground">{safeFormatDatetime(p.datetime)}</div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <Badge variant="outline" className={p.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' : p.status === 'Pending' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-400'}>{p.status}</Badge>
                                                    {p.status === 'Pending' ? (
                                                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <button className="h-8 rounded-full bg-neutral-700 px-3 text-xs font-medium text-white hover:bg-neutral-600 disabled:opacity-60" onClick={() => handleDisapprove(p.id)} disabled={processingIds.includes(p.id)}>
                                                                {processingIds.includes(p.id) ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : 'Disapprove'}
                                                            </button>
                                                            <button className="h-8 rounded-full bg-white px-3 text-xs font-medium text-black hover:bg-neutral-200 disabled:opacity-60" onClick={() => handleApprove(p.id)} disabled={processingIds.includes(p.id)}>
                                                                {processingIds.includes(p.id) ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : 'Approve'}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-muted-foreground">No actions available</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card className="border-white/5 bg-card/90 shadow-card">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base text-white">Filter</CardTitle>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3 text-sm text-white/80">
                                    <Checkbox id="filter-checkbox" checked={filterEnabled} onCheckedChange={(v) => setFilterEnabled(Boolean(v))} className="border-white/30 data-[state=checked]:bg-blue-600" />
                                    <label htmlFor="filter-checkbox">Enable Filter</label>
                                </div>
                                <Separator className="bg-white/10" />
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm text-white/80">
                                        <span className="font-semibold">Location</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                className="rounded-full bg-blue-900/60 px-3 py-1 text-xs text-blue-100 transition hover:bg-blue-800/70"
                                                onClick={() => setShowDistance(true)}
                                            >
                                                Distance : {distanceKm.toFixed(2)} KM
                                            </button>
                                            <button type="button" aria-label="Search cities" title="Search cities" className="text-muted-foreground hover:text-white" onClick={() => setCityDialogOpen(true)}>
                                                <Search className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-muted/20 px-3 py-2 text-sm text-white/80">
                                        <button type="button" className="inline-flex items-center gap-2 text-left truncate" onClick={() => setCityDialogOpen(true)}>
                                            <MapPin className="h-4 w-4 text-blue-300" />
                                            <span className="truncate">{selectedCity === 'All Cities' ? 'All Cities' : selectedCity}</span>
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <button type="button" className="text-muted-foreground hover:text-white" onClick={() => { setDistanceKm(0); setFilterEnabled(true); toast.success('Distance cleared'); import("@/lib/storage").then((m) => m.addLog({ id: `log-${Date.now()}`, timestamp: new Date().toLocaleString(), level: "info", type: "event", user: "admin@awaaz.com", action: "Distance Cleared", details: `Cleared distance filter` })); }}>
                                                Clear Distance
                                            </button>
                                            <button type="button" aria-label="Open city picker" className="text-muted-foreground hover:text-white" onClick={() => setCityDialogOpen(true)}>
                                                <Search className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/5 bg-card/90 shadow-card">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base text-white">{format(selectedDate || new Date(), "MMMM yyyy")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mx-auto">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        month={selectedDate || new Date()}
                                        onSelect={(d) => setSelectedDate(d)}
                                        className="mx-auto rounded-lg border border-white/5 bg-muted/10"
                                        classNames={{
                                            day_selected: "bg-blue-600 text-white hover:bg-blue-600",
                                            day_today: "text-white",
                                        }}
                                        showOutsideDays={false}
                                    />
                                    <div className="mt-2 flex justify-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedDate(null)}>Clear Date</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/5 bg-card/90 shadow-card">
                            <CardContent className="flex items-center justify-center gap-3 py-4">
                                <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-muted/30 text-muted-foreground transition hover:text-white">
                                    <Archive className="h-5 w-5" />
                                </button>
                                <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-muted/30 text-muted-foreground transition hover:text-white">
                                    <Filter className="h-5 w-5" />
                                </button>
                                <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-muted/30 text-muted-foreground transition hover:text-white">
                                    <RefreshCw className="h-5 w-5" />
                                </button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <DistanceSelector
                    open={showDistance}
                    initialValue={distanceKm}
                    min={1}
                    max={500}
                    onDone={(val) => setDistanceKm(val)}
                    onClose={() => setShowDistance(false)}
                />

                {/* Create Post Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a1f] border-white/10">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-white">Create General Post</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 p-4">
                            <div className="space-y-2">
                                <Label className="text-white">Title</Label>
                                <Input value={newPost.title} onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))} placeholder="Enter title" />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-white">Description</Label>
                                <textarea className="w-full min-h-[120px] rounded-md bg-white/5 border border-white/10 p-3 text-white" value={newPost.description} onChange={(e) => setNewPost((p) => ({ ...p, description: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-white">Location</Label>
                                <Input value={newPost.location} onChange={(e) => setNewPost((p) => ({ ...p, location: e.target.value }))} placeholder="City, area" />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={handleCreatePost} disabled={isSubmitting}>{isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : 'Create'}</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* City Picker Dialog (moved out of Create Dialog so it can open anytime) */}
                <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
                    <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto bg-[#1a1a1f] border-white/10">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-white">Select City</DialogTitle>
                        </DialogHeader>
                        <div className="p-4">
                            <Input placeholder="Search city" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} className="mb-3" autoFocus />
                            <div className="space-y-1 max-h-[320px] overflow-y-auto">
                                <button key="all-cities" className={`w-full text-left rounded-md px-3 py-2 hover:bg-white/5 ${selectedCity === 'All Cities' ? 'bg-white/5' : ''}`} onClick={() => {
                                    setSelectedCity('All Cities');
                                    setCityDialogOpen(false);
                                    setFilterEnabled(true);
                                    import("@/lib/storage").then((m) => m.addLog({
                                        id: `log-${Date.now()}`,
                                        timestamp: new Date().toLocaleString(),
                                        level: "info",
                                        type: "event",
                                        user: "admin@awaaz.com",
                                        action: "City Selected",
                                        details: `Selected All Cities`,
                                    }));
                                }}>
                                    All Cities
                                </button>
                                {(() => {
                                    const matches = cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));
                                    if (matches.length === 0) return <div className="text-sm text-muted-foreground p-2">No cities found</div>;
                                    return matches.map((c) => (
                                        <button key={c} className={`w-full text-left rounded-md px-3 py-2 hover:bg-white/5 ${selectedCity === c ? 'bg-white/5' : ''}`} onClick={() => {
                                            console.log('City selected:', c);
                                            setSelectedCity(c);
                                            setCityDialogOpen(false);
                                            setFilterEnabled(true);
                                            import("@/lib/storage").then((m) => m.addLog({
                                                id: `log-${Date.now()}`,
                                                timestamp: new Date().toLocaleString(),
                                                level: "info",
                                                type: "event",
                                                user: "admin@awaaz.com",
                                                action: "City Selected",
                                                details: `Selected city ${c}`,
                                            }));
                                        }}>
                                            {c}
                                        </button>
                                    ));
                                })()}
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                                <Button variant="outline" onClick={() => { setSelectedCity('All Cities'); setCityDialogOpen(false); import("@/lib/storage").then((m) => m.addLog({ id: `log-${Date.now()}`, timestamp: new Date().toLocaleString(), level: "info", type: "event", user: "admin@awaaz.com", action: "City Selected", details: `Cleared city selection` })); }}>Clear</Button>
                                <Button onClick={() => { setCityDialogOpen(false); }}>Close</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
