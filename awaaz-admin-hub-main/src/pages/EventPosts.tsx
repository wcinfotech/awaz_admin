import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { initSocket, getSocket } from "@/lib/socket";
import { toast } from "sonner";
import { Filter, Check, X, Upload, Pencil } from "lucide-react";

interface EventPost {
    id: string;
    title: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    category: string;
    distanceKm: number;
    type: string;
    createdAt: string;
    timeline: { id: string; label: string; timestamp: string }[];
}

const fallback: EventPost[] = [
    {
        id: "1",
        title: "Flood relief in Delhi",
        status: "PENDING",
        category: "Rescue",
        distanceKm: 2.4,
        type: "Flood",
        createdAt: "2026-01-05",
        timeline: [
            { id: "t1", label: "Reported", timestamp: "2026-01-05T08:00:00Z" },
            { id: "t2", label: "Volunteer assigned", timestamp: "2026-01-05T09:00:00Z" },
        ],
    },
];

export default function EventPosts() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<string>("");
    const [type, setType] = useState<string>("");
    const [category, setCategory] = useState<string>("");
    const [distance, setDistance] = useState<string>("");
    const [date, setDate] = useState<string>("");
    const [nearbyOnly, setNearbyOnly] = useState<boolean>(false);
    const [hasRescueHelpers, setHasRescueHelpers] = useState<boolean>(false);

    // Minimal create form (direct admin post)
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newLat, setNewLat] = useState<string>("");
    const [newLon, setNewLon] = useState<string>("");
    const [newEventTime, setNewEventTime] = useState<string>("");
    const [newPostCategoryId, setNewPostCategoryId] = useState<string>("");
    const [creating, setCreating] = useState(false);

    const { data: apiData = fallback, isLoading, refetch } = useQuery({
        queryKey: ["event-posts", { search, status, type, category, distance, date, nearbyOnly, hasRescueHelpers }],
        queryFn: async () => {
            const res = await api.get(`/admin/v1/event-post/incident/list`, {
                params: { search, page: 1, limit: 50 },
            });
            // Backend returns: { message, body: { page, totalPages, totalItems, limit, data: [events] } }
            const rows = res.data?.body?.data || [];
            return (rows as any[]).map((item) => ({
                id: item._id || item.id,
                title: item.title || "Untitled",
                status: ((item.status || "PENDING") as string).toUpperCase() as EventPost["status"],
                category: item.postCategory || "",
                distanceKm: 0,
                type: item.postType || "",
                createdAt: item.createdAt || "",
                timeline: [],
            }));
        },
        staleTime: 30_000,
        retry: false,
    });

    // Prefer events stored in localStorage (persisted by Event page) if present
    const [localData, setLocalData] = useState<EventPost[] | null>(() => {
        try {
            const raw = localStorage.getItem("awaaz:events");
            if (!raw) return null;
            const parsed = JSON.parse(raw) as any[];
            return parsed.map((e) => ({
                id: e.id,
                title: e.title || e.title,
                status: (e.status || "Pending").toUpperCase() as EventPost["status"],
                category: e.category || "",
                distanceKm: 0,
                type: "",
                createdAt: e.datetime || "",
                timeline: [],
            }));
        } catch {
            return null;
        }
    });

    // Listen for changes in saved events
    useState(() => {
        const handler = () => {
            try {
                const raw = localStorage.getItem("awaaz:events");
                if (!raw) {
                    setLocalData(null);
                    return;
                }
                const parsed = JSON.parse(raw) as any[];
                setLocalData(
                    parsed.map((e) => ({
                        id: e.id,
                        title: e.title || e.title,
                        status: (e.status || "Pending").toUpperCase() as EventPost["status"],
                        category: e.category || "",
                        distanceKm: 0,
                        type: "",
                        createdAt: e.datetime || "",
                        timeline: [],
                    }))
                );
            } catch {
                setLocalData(null);
            }
        };
        window.addEventListener("awaaz-events-changed", handler);
        return () => window.removeEventListener("awaaz-events-changed", handler);
    });

    // Initialize socket and listen for realtime comment events
    useEffect(() => {
        const stored = localStorage.getItem("awaaz-admin-auth");
        let token: string | undefined;
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as { token?: string };
                token = parsed.token;
            } catch { }
        }

        const socket = initSocket(token);
        const onReceiveComment = (payload: any) => {
            // a comment changed, refresh list to surface counts or updates
            refetch();
        };
        socket.on("receiveEventPostComment", onReceiveComment);
        return () => {
            socket.off("receiveEventPostComment", onReceiveComment);
        };
    }, [refetch]);

    const sourceData = localData ?? apiData;

    const filtered = useMemo(
        () =>
            sourceData.filter((item) =>
                item.title.toLowerCase().includes(search.toLowerCase())
            ),
        [sourceData, search]
    );

    const handleAction = async (
        id: string,
        action: "approve" | "reject" | "delete" | "restore"
    ) => {
        try {
            await api.post(`/events/moderation/${id}/${action}`);
            toast.success(`Post ${action}d`);
            refetch();
        } catch (err) {
            toast.error("Failed to update post", { description: String(err) });
        }
    };

    const handleTimelineUpdate = async (id: string) => {
        toast.info("Wire timeline editor to backend", { description: `Timeline update for ${id}` });
    };

    const handleCreate = async () => {
        if (!newTitle || !newLat || !newLon || !newEventTime || !newPostCategoryId) {
            toast.error("Fill title, lat, lon, event time, category id.");
            return;
        }

        const fd = new FormData();
        fd.append("isDirectAdminPost", "true");
        fd.append("postType", "incident");
        fd.append("postCategoryId", newPostCategoryId);
        fd.append("title", newTitle);
        fd.append("description", newDescription);
        fd.append("latitude", newLat);
        fd.append("longitude", newLon);
        fd.append("eventTime", newEventTime);
        fd.append("isSensitiveContent", "false");
        fd.append("isShareAnonymously", "false");

        try {
            setCreating(true);
            await api.post("/admin/v1/event-post/add", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Event post created.");
            setNewTitle("");
            setNewDescription("");
            setNewLat("");
            setNewLon("");
            setNewEventTime("");
            setNewPostCategoryId("");
            refetch();
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || "Failed to create";
            toast.error("Create failed", { description: msg });
        } finally {
            setCreating(false);
        }
    };

    return (
        <AdminLayout title="Event Posts">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-3">
                        <div className="relative w-64">
                            <Input
                                placeholder="Search posts"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Any</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Any</SelectItem>
                                <SelectItem value="Flood">Flood</SelectItem>
                                <SelectItem value="Fire">Fire</SelectItem>
                                <SelectItem value="Earthquake">Earthquake</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All</SelectItem>
                                <SelectItem value="Rescue">Rescue</SelectItem>
                                <SelectItem value="Medical">Medical</SelectItem>
                                <SelectItem value="Shelter">Shelter</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            type="number"
                            placeholder="Distance km"
                            value={distance}
                            onChange={(e) => setDistance(e.target.value)}
                            className="w-32"
                        />
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-40"
                        />
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={nearbyOnly}
                                onChange={(e) => setNearbyOnly(e.target.checked)}
                                className="h-4 w-4"
                            />
                            Nearby only
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={hasRescueHelpers}
                                onChange={(e) => setHasRescueHelpers(e.target.checked)}
                                className="h-4 w-4"
                            />
                            Rescue helpers
                        </label>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => refetch()}>Refresh</Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Create Admin Event Post (minimal)</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-3">
                        <Input placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                        <Input placeholder="Description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
                        <Input placeholder="Post Category ID" value={newPostCategoryId} onChange={(e) => setNewPostCategoryId(e.target.value)} />
                        <Input placeholder="Latitude" value={newLat} onChange={(e) => setNewLat(e.target.value)} />
                        <Input placeholder="Longitude" value={newLon} onChange={(e) => setNewLon(e.target.value)} />
                        <Input type="datetime-local" value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} />
                        <Button className="md:col-span-3" onClick={handleCreate} disabled={creating}>
                            {creating ? "Creating..." : "Create Event Post"}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Incoming Event Posts</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Distance</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading
                                    ? Array.from({ length: 5 }).map((_, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell colSpan={6}>
                                                <Skeleton className="h-10 w-full" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                    : filtered.map((post) => (
                                        <TableRow key={post.id}>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium text-foreground">{post.title}</div>
                                                    <div className="text-xs text-muted-foreground">Created {post.createdAt}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        post.status === "APPROVED"
                                                            ? "text-success border-success/30"
                                                            : post.status === "REJECTED"
                                                                ? "text-destructive border-destructive/30"
                                                                : "text-warning border-warning/30"
                                                    }
                                                >
                                                    {post.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{post.category}</TableCell>
                                            <TableCell>{post.distanceKm} km</TableCell>
                                            <TableCell>{post.type}</TableCell>
                                            <TableCell>
                                                {post.status === "PENDING" ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button size="sm" variant="outline" className="gap-1" onClick={() => handleAction(post.id, "approve")}>
                                                            <Check className="h-4 w-4" /> Approve
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="gap-1" onClick={() => handleAction(post.id, "reject")}>
                                                            <X className="h-4 w-4" /> Reject
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="gap-1" onClick={() => handleTimelineUpdate(post.id)}>
                                                            <Pencil className="h-4 w-4" /> Timeline
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-muted-foreground">No actions available</span>
                                                        <Button size="sm" variant="ghost" className="gap-1" onClick={() => handleTimelineUpdate(post.id)}>
                                                            <Pencil className="h-4 w-4" /> Timeline
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Timeline Editor</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                            <Input placeholder="Title" />
                            <Input type="datetime-local" placeholder="Timestamp" />
                            <div className="flex gap-3">
                                <Button className="gap-2" onClick={() => toast.info("Add timeline entry")}>Add Entry</Button>
                                <Button variant="outline" className="gap-2" onClick={() => toast.info("Upload attachment")}>
                                    <Upload className="h-4 w-4" /> Upload
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Textarea placeholder="Notes or media links" rows={5} />
                            <Button variant="secondary" onClick={() => toast.info("Save timeline")}>Save Timeline</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
