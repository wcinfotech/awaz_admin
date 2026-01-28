import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// Interface for category from API (event-reaction)
interface CategoryFromAPI {
    _id: string;
    reactionName: string;
    reactionIcon?: string;
}
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
    Check,
    Clock,
    Filter,
    MapPin,
    Play,
    RefreshCw,
    Search,
    Video,
    X,
    Paperclip,
    Flag,
    FolderPlus,
    ChevronLeft,
    ChevronRight,
    CalendarIcon,
    Upload,
    Image,
    AlertTriangle,
    Eye,
    Trash,
} from "lucide-react";
import { format } from "date-fns";
import { cn, haversineKm, parseDistanceFromLocation } from "@/lib/utils";

// Interface for event from API
interface EventFromAPI {
    _id: string;
    title: string;
    description: string | null;
    attachment: string | null;
    attachmentFileType: string | null;
    status: "Pending" | "Approved" | "Rejected";
    eventTime: string;
    createdAt?: string; // Fallback for date
    address: string | null;
    userId: string | null;
    name: string | null;
    profilePicture: string | null;
    username: string | null;
    postCategory: {
        eventName: string | null;
        notificationCategotyName: string | null;
        eventIcon: string | null;
    };
    mainCategory: {
        eventName: string | null;
        notificationCategotyName: string | null;
        eventIcon: string | null;
    };
    subCategory: {
        eventName: string | null;
        notificationCategotyName: string | null;
        eventIcon: string | null;
    };
    thumbnail: string | null;
    latitude: string | null;
    longitude: string | null;
    hashTags: string[];
}

// Transformed event for UI
interface TransformedEvent {
    id: string;
    user: string;
    avatar: string;
    title: string;
    description: string;
    location: string;
    datetime: string;
    isoTimestamp: string; // ISO string for reliable sorting
    status: "Pending" | "Approved" | "Rejected";
    type: "video" | "image";
    category: string;
    postType: string; // Required for approve/reject API
    latitude?: string;
    longitude?: string;
    isDraft?: boolean;
}

// Temporarily commented out Escalations feature
// const escalationsData = [
//     {
//         id: "esc-01",
//         eventTitle: "Major fire outbreak in industrial area",
//         user: "Rahul Sharma",
//         priority: "Critical" as const,
//         reason: "Multiple casualties reported, requires immediate attention",
//         escalatedAt: "Jan 10, 2026 • 08:15 AM",
//         status: "Open" as const,
//     },
//     {
//         id: "esc-02",
//         eventTitle: "Gas leak in residential complex",
//         user: "Priya Verma",
//         priority: "High" as const,
//         reason: "Toxic fumes spreading, evacuation needed",
//         escalatedAt: "Jan 10, 2026 • 07:45 AM",
//         status: "In Progress" as const,
//     },
//     {
//         id: "esc-03",
//         eventTitle: "Bridge collapse on highway",
//         user: "Amit Kumar",
//         priority: "Critical" as const,
//         reason: "Multiple vehicles trapped, emergency services delayed",
//         escalatedAt: "Jan 09, 2026 • 11:30 PM",
//         status: "Open" as const,
//     },
//     {
//         id: "esc-04",
//         eventTitle: "Suspicious package found at metro station",
//         user: "Neha Gupta",
//         priority: "Medium" as const,
//         reason: "Security threat, area cordoned off",
//         escalatedAt: "Jan 09, 2026 • 06:20 PM",
//         status: "Resolved" as const,
//     },
// ];

const queuedEvents = [
    {
        id: "evt-01",
        user: "Riya Singh",
        avatar: "",
        title: "Flooded underpass needs clearing",
        description: "Water level rising near Sector 18 underpass. Commuters stranded.",
        location: "Noida, 10.2 KM",
        datetime: "Jan 08, 2026 • 09:24 AM",
        status: "Approved" as const,
        type: "video",
        category: "traffic",
    },
    {
        id: "evt-02",
        user: "Karan Patel",
        avatar: "",
        title: "Tree fall blocking main road",
        description: "Large tree blocking the east carriageway near Metro Gate 2.",
        location: "Ahmedabad, 0.8 KM",
        datetime: "Jan 08, 2026 • 08:40 AM",
        status: "Pending" as const,
        type: "image",
        category: "rescue",
    },
    {
        id: "evt-03",
        user: "Anita Joseph",
        avatar: "",
        title: "Chemical smell near warehouse",
        description: "Residents report strong chemical odor and light smoke.",
        location: "Hyderabad, 2.1 KM",
        datetime: "Jan 07, 2026 • 11:05 PM",
        status: "Rejected" as const,
        type: "video",
        category: "sos",
    },
    {
        id: "evt-04",
        user: "Riya Singh",
        avatar: "",
        title: "Flooded underpass needs clearing",
        description: "Water level rising near Sector 18 underpass. Commuters stranded.",
        location: "Noida, 1.2 KM",
        datetime: "Jan 08, 2026 • 09:24 AM",
        status: "Approved" as const,
        type: "video",
        category: "traffic",
    },
    {
        id: "evt-05",
        user: "Karan Patel",
        avatar: "",
        title: "Tree fall blocking main road",
        description: "Large tree blocking the east carriageway near Metro Gate 2.",
        location: "Ahmedabad, 0.8 KM",
        datetime: "Jan 08, 2026 • 08:40 AM",
        status: "Pending" as const,
        type: "image",
        category: "rescue",
    },
    {
        id: "evt-06",
        user: "Anita Joseph",
        avatar: "",
        title: "Chemical smell near warehouse",
        description: "Residents report strong chemical odor and light smoke.",
        location: "Hyderabad, 2.1 KM",
        datetime: "Jan 07, 2026 • 11:05 PM",
        status: "Rejected" as const,
        type: "video",
        category: "sos",
    },
];

const timelineEntries = [
    { id: "t1", label: "Reported", time: "Jan 07, 10:58 PM" },
    { id: "t2", label: "Queued for review", time: "Jan 07, 11:05 PM" },
    { id: "t3", label: "Operator picked", time: "Jan 08, 08:10 AM" },
];

const fileThumbs = [
    { id: "f1", name: "underpass.mp4", type: "video" },
    { id: "f2", name: "location-pin.png", type: "image" },
];

export default function EventPage({ fixedCategory }: { fixedCategory?: string }) {
    const navigate = useNavigate();
    const [status, setStatus] = useState("all");
    const [category, setCategory] = useState<string>(fixedCategory ?? "all");
    const [maxDistance, setMaxDistance] = useState("5");
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

    // Fetch categories from API
    const { data: categoriesData = [], isLoading: isLoadingCategories } = useQuery<CategoryFromAPI[]>({
        queryKey: ['event-reactions'],
        queryFn: async () => {
            console.log('[Event.tsx] Fetching categories from /admin/v1/event-reaction/list');
            const res = await api.get('/admin/v1/event-reaction/list');
            console.log('[Event.tsx] Categories API response:', res.data);
            // API returns { message, body } not { status, data }
            const categories = res.data?.body || res.data?.data || [];
            console.log('[Event.tsx] Parsed categories:', categories);
            return categories;
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

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
    const [cityInput, setCityInput] = useState<string>("");

    // Origin used for Haversine distance filtering (null = not set)
    const [origin, setOrigin] = useState<{ lat: number; lon: number } | null>(null);
    const [isLocLoading, setIsLocLoading] = useState(false);

    const toggleUseMyLocation = () => {
        if (origin) {
            setOrigin(null);
            toast.success('Location cleared');
            import("@/lib/storage").then((m) => m.addLog({ id: `log-${Date.now()}`, timestamp: new Date().toLocaleString(), level: "info", type: "event", user: "admin@awaaz.com", action: "Location Cleared", details: `Cleared origin coordinates` }));
            return;
        }

        if (!navigator?.geolocation) {
            toast.error('Geolocation not supported in this browser');
            return;
        }

        setIsLocLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setOrigin({ lat: pos.coords.latitude, lon: pos.coords.longitude });
                setIsLocLoading(false);
                toast.success('Origin location set');
                import("@/lib/storage").then((m) => m.addLog({ id: `log-${Date.now()}`, timestamp: new Date().toLocaleString(), level: "info", type: "event", user: "admin@awaaz.com", action: "Location Set", details: `Origin set to ${pos.coords.latitude}, ${pos.coords.longitude}` }));
            },
            (err) => {
                setIsLocLoading(false);
                toast.error('Unable to get location');
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    const queryClient = useQueryClient();
    const [processingIds, setProcessingIds] = useState<string[]>([]);

    const mapCategoryToPostType = (value?: string) => {
        if (value === "rescue") return "rescue";
        return "incident";
    };

    const buildEventFormData = (mode: "publish" | "draft") => {
        const formData = new FormData();
        const postType = mapCategoryToPostType(fixedCategory ?? newEvent.postCategory);

        formData.append("postType", postType);
        formData.append("isDirectAdminPost", "true");

        if (newEvent.title.trim()) formData.append("title", newEvent.title.trim());
        if (newEvent.description.trim()) formData.append("description", newEvent.description.trim());
        if (newEvent.latitude.trim()) formData.append("latitude", newEvent.latitude.trim());
        if (newEvent.longitude.trim()) formData.append("longitude", newEvent.longitude.trim());
        if (newEvent.address.trim()) formData.append("address", newEvent.address.trim());
        formData.append("eventTime", newEvent.startDate.toISOString());

        if (newEvent.postCategory) {
            console.log('[Event.tsx] Submitting postCategoryId:', newEvent.postCategory);
            formData.append("postCategoryId", newEvent.postCategory);
        }

        const tags = newEvent.hashtag.split(/\s+/).filter(Boolean);
        tags.forEach((tag) => formData.append("hashTags", tag));

        if (mode === "publish") {
            formData.append("isSensitiveContent", String(newEvent.sensitiveContent));
            formData.append("isShareAnonymously", String(false));
        } else {
            formData.append("sensitiveContent", String(newEvent.sensitiveContent));
            formData.append("shareAnonymous", String(false));
        }

        if (postType === "rescue") {
            formData.append("lostItemName", newEvent.title.trim() || "N/A");
            formData.append("countryCode", "IN");
            formData.append("mobileNumber", "0000000000");
        }

        if (newEvent.videoImage) {
            console.log('📎 Adding video file:', newEvent.videoImage.name, newEvent.videoImage.size);
            formData.append("gallaryAttachment", newEvent.videoImage);
        } else {
            console.log('❌ No video file selected');
        }
        if (newEvent.thumbnail) {
            console.log('🖼️ Adding thumbnail file:', newEvent.thumbnail.name, newEvent.thumbnail.size);
            formData.append("gallaryThumbnail", newEvent.thumbnail);
        } else {
            console.log('❌ No thumbnail file selected');
        }

        return formData;
    };

    // Helper to safely extract array from various API response shapes
    const extractItems = (responseData: any): any[] => {
        if (!responseData) return [];
        // Handle: { data: { data: [...] } }
        if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
            return responseData.data.data;
        }
        // Handle: { data: [...] }
        if (responseData?.data && Array.isArray(responseData.data)) {
            return responseData.data;
        }
        // Handle: { body: { data: [...] } }
        if (responseData?.body?.data && Array.isArray(responseData.body.data)) {
            return responseData.body.data;
        }
        // Handle: { body: [...] }
        if (responseData?.body && Array.isArray(responseData.body)) {
            return responseData.body;
        }
        // Handle: direct array
        if (Array.isArray(responseData)) {
            return responseData;
        }
        console.warn('[Event.tsx] Unknown response shape:', responseData);
        return [];
    };

    // Fetch events from backend API
    const { data: eventsData, isLoading: isLoadingEvents, refetch: refetchEvents } = useQuery<(EventFromAPI & { postType?: string; isDraft?: boolean })[], Error>({
        queryKey: ['event-posts', 'all-types', 'v3'],
        queryFn: async () => {
            console.log("[Event.tsx] Starting API fetch...");
            const postTypes = ['incident', 'rescue', 'general_category'];
            const results: (EventFromAPI & { postType?: string; isDraft?: boolean })[] = [];
            let lastError: any = null;

            for (const pt of postTypes) {
                try {
                    console.log(`[Event.tsx] Fetching ${pt}...`);
                    const response = await api.get(`/admin/v1/event-post/filter/${pt}/all`, {
                        params: { limit: 200, t: Date.now() },
                    });
                    console.log(`[Event.tsx] ${pt} raw response:`, response?.data);
                    const items = extractItems(response?.data);
                    console.log(`[Event.tsx] ${pt} extracted items:`, items.length);
                    items.forEach((item: any) => {
                        if (item && item._id) {
                            results.push({ ...item, postType: pt, isDraft: false });
                        }
                    });
                } catch (err: any) {
                    console.error(`[Event.tsx] Error fetching ${pt}:`, err?.message || err);
                    lastError = err;
                }
            }

            // Include admin drafts so they show up in the queue
            try {
                const draftRes = await api.get('/admin/v1/event-post-draft/admin-drafts', {
                    params: { t: Date.now() },
                    headers: { 'Cache-Control': 'no-cache' },
                });
                console.log('[Event.tsx] Drafts raw response:', draftRes?.data);
                const drafts = extractItems(draftRes?.data);
                console.log('[Event.tsx] Drafts extracted:', drafts.length);
                drafts.forEach((item: any) => {
                    if (item && item._id) {
                        results.push({
                            ...item,
                            isDraft: true,
                            postType: item.postType || 'draft',
                            status: 'Pending' as const,
                            eventTime: item?.eventTime || item?.createdAt || new Date().toISOString(),
                            description: item?.description || item?.title || "Draft event",
                        });
                    }
                });
            } catch (err: any) {
                console.warn('[Event.tsx] Drafts fetch failed (non-critical):', err?.message);
                // Non-critical - don't fail entire fetch
            }

            console.log("[Event.tsx] Total results:", results.length);
            if (results.length > 0) {
                console.log("[Event.tsx] Sample item:", JSON.stringify(results[0], null, 2));
            }

            if (!results.length && lastError) {
                const message = lastError?.response?.data?.message || 'Failed to load events';
                toast.error(message);
                throw lastError;
            }

            return results;
        },
        staleTime: 0,
        refetchOnMount: 'always',
        retry: 1,
    });

    // Helper to normalize category for consistent filtering
    const normalizeCategory = (item: any): string => {
        // Try postCategory.eventName first
        const catName = item?.postCategory?.eventName?.toLowerCase?.()?.trim();
        if (catName) return catName;
        // Fall back to postType
        const postType = item?.postType?.toLowerCase?.()?.trim();
        if (postType) {
            // Map backend postTypes to frontend category names
            if (postType === 'incident') return 'incident';
            if (postType === 'rescue') return 'rescue';
            if (postType === 'general_category') return 'general';
            return postType;
        }
        return 'general';
    };

    // Transform API data to UI format
    const events: TransformedEvent[] = useMemo(() => {
        const apiItems = eventsData;
        console.log("[Event.tsx] Transforming eventsData:", apiItems?.length || 0, "items");
        if (!Array.isArray(apiItems) || apiItems.length === 0) {
            console.warn('[Event.tsx] No items to transform');
            return [];
        }

        const transformed = apiItems.map((item: EventFromAPI & { postType?: string; isDraft?: boolean }) => {
            // Safely parse date with fallback
            let isoTimestamp = item.eventTime || item.createdAt || new Date().toISOString();
            let eventDate: Date;
            try {
                eventDate = new Date(isoTimestamp);
                if (isNaN(eventDate.getTime())) {
                    eventDate = new Date();
                    isoTimestamp = eventDate.toISOString();
                }
            } catch {
                eventDate = new Date();
                isoTimestamp = eventDate.toISOString();
            }
            const formattedDate = format(eventDate, "MMM dd, yyyy • hh:mm a");

            return {
                id: item._id,
                user: item.name || item.username || "Unknown User",
                avatar: item.profilePicture || "",
                title: item.title || "Untitled Event",
                description: item.description || "",
                location: item.address || "Unknown Location",
                datetime: formattedDate,
                isoTimestamp,
                status: item.isDraft ? "Pending" as const : (item.status || "Pending"),
                type: item.attachmentFileType?.includes('video') ? 'video' as const : 'image' as const,
                category: normalizeCategory(item),
                postType: item.postType || 'incident', // Store postType for API calls
                latitude: item.latitude || undefined,
                longitude: item.longitude || undefined,
                isDraft: item.isDraft || false,
            };
        });

        console.log('[Event.tsx] Transformed events:', transformed.length);
        return transformed;
    }, [eventsData]);

    // Approve mutation
    const approveMutation = useMutation({
        mutationFn: async (eventPostId: string) => {
            const response = await api.put('/admin/v1/event-post/update-user-post-status', {
                eventPostId,
                status: 'Approved',
                isSendNotification: true
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['event-posts', 'all-types'] });
            toast.success("Event approved");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to approve event");
        },
    });

    // Reject mutation
    const rejectMutation = useMutation({
        mutationFn: async (eventPostId: string) => {
            const response = await api.put('/admin/v1/event-post/update-user-post-status', {
                eventPostId,
                status: 'Rejected',
                isSendNotification: true
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['event-posts', 'all-types'] });
            toast.success("Event rejected");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to reject event");
        },
    });

    const deleteDraftMutation = useMutation({
        mutationFn: async ({ id, isDraft }: { id: string; isDraft: boolean }) => {
            // Use correct endpoints after fixing route conflicts
            const endpoint = isDraft
                ? `/admin/v1/event-post-draft/delete/${id}`  // Existing draft delete endpoint
                : `/admin/v1/event-post/${id}/simple-delete`; // Fixed simple delete endpoint

            const response = await api.delete(endpoint);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['event-posts', 'all-types'] });
            toast.success(variables.isDraft ? "Draft deleted successfully" : "Post deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to delete");
        },
    });

    // Create Event Modal State
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        postCategory: fixedCategory ?? "",
        startDate: new Date(),
        title: "",
        description: "",
        latitude: "",
        longitude: "",
        address: "",
        hashtag: "",
        sensitiveContent: false,
        videoImage: null as File | null,
        thumbnail: null as File | null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    // Confirmation dialog state
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        id: string;
        isDraft: boolean;
        title: string;
    }>({
        isOpen: false,
        id: '',
        isDraft: false,
        title: '',
    });

    // const [isEscalationsOpen, setIsEscalationsOpen] = useState(false);

    const pageTitle = fixedCategory ? (fixedCategory.charAt(0).toUpperCase() + fixedCategory.slice(1)) : "Event";

    // Dashboard stats (derived from events)
    const dashboardStats = useMemo(() => ({
        total: events.length,
        approved: events.filter((e) => e.status === "Approved").length,
        pending: events.filter((e) => e.status === "Pending").length,
        rejected: events.filter((e) => e.status === "Rejected").length,
    }), [events]);

    const dashboardItems = [
        { label: "Total Events", value: `${dashboardStats.total}` },
        { label: "Approved", value: `${dashboardStats.approved}` },
        { label: "Pending", value: `${dashboardStats.pending}` },
        { label: "Rejected", value: `${dashboardStats.rejected}` },
    ];

    // Approve / Disapprove handlers
    const handleApproveEvent = async (eventId: string) => {
        if (processingIds.includes(eventId)) return;
        setProcessingIds((p) => [...p, eventId]);
        try {
            await approveMutation.mutateAsync(eventId);
        } finally {
            setProcessingIds((p) => p.filter((id) => id !== eventId));
        }
    };

    const handleDisapproveEvent = async (eventId: string) => {
        if (processingIds.includes(eventId)) return;
        setProcessingIds((p) => [...p, eventId]);
        try {
            await rejectMutation.mutateAsync(eventId);
        } finally {
            setProcessingIds((p) => p.filter((id) => id !== eventId));
        }
    };

    const handleDeleteDraft = async (id: string, isDraft: boolean, title: string) => {
        // Show confirmation dialog instead of deleting immediately
        setDeleteConfirmation({
            isOpen: true,
            id,
            isDraft,
            title,
        });
    };

    const confirmDelete = async () => {
        const { id, isDraft } = deleteConfirmation;

        if (processingIds.includes(id)) return;
        setProcessingIds((p) => [...p, id]);

        // Close confirmation dialog
        setDeleteConfirmation({
            isOpen: false,
            id: '',
            isDraft: false,
            title: '',
        });

        queryClient.setQueryData<(EventFromAPI & { postType?: string; isDraft?: boolean })[]>(
            ['event-posts', 'all-types'],
            (current) => (current ? current.filter((item) => item._id !== id) : current)
        );

        try {
            await deleteDraftMutation.mutateAsync({ id, isDraft });
        } catch (err) {
            queryClient.invalidateQueries({ queryKey: ['event-posts', 'all-types'] });
        } finally {
            setProcessingIds((p) => p.filter((processingId) => processingId !== id));
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmation({
            isOpen: false,
            id: '',
            isDraft: false,
            title: '',
        });
    };
    const [videoImagePreview, setVideoImagePreview] = useState<string | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    const handleVideoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setNewEvent((prev) => ({ ...prev, videoImage: file }));
            const url = URL.createObjectURL(file);
            setVideoImagePreview(url);
            toast.success("Media attached", { description: file.name });
        }
        // Reset the input value so the same file can be selected again
        e.target.value = "";
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setNewEvent((prev) => ({ ...prev, thumbnail: file }));
            const url = URL.createObjectURL(file);
            setThumbnailPreview(url);
            toast.success("Thumbnail attached", { description: file.name });
        }
        // Reset the input value so the same file can be selected again
        e.target.value = "";
    };

    const removeVideoImage = () => {
        setNewEvent((prev) => ({ ...prev, videoImage: null }));
        if (videoImagePreview) {
            URL.revokeObjectURL(videoImagePreview);
            setVideoImagePreview(null);
        }
    };

    const removeThumbnail = () => {
        setNewEvent((prev) => ({ ...prev, thumbnail: null }));
        if (thumbnailPreview) {
            URL.revokeObjectURL(thumbnailPreview);
            setThumbnailPreview(null);
        }
    };

    // const handleResolveEscalation = (id: string) => {
    //     toast.success("Escalation marked as resolved", {
    //         description: `Escalation ${id} has been resolved.`,
    //     });
    // };

    const handleViewEvent = (title: string) => {
        toast.info("Opening event details", {
            description: title,
        });
    };

    const handleSyncQueue = async () => {
        if (isSyncing) return;

        setIsSyncing(true);
        toast.info("Syncing queue...", { duration: 1500 });

        try {
            await refetchEvents();
            setLastSyncTime(new Date());
            toast.success("Queue synced successfully!", {
                description: `Last synced at ${format(new Date(), "hh:mm:ss a")}`,
            });
        } catch (err) {
            toast.error("Sync failed", {
                description: "Unable to sync queue. Please try again.",
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleCreateEvent = async () => {
        if (!newEvent.postCategory) {
            toast.error("Please select a category");
            return;
        }
        if (!newEvent.title.trim()) {
            toast.error("Please enter a title");
            return;
        }
        if (!newEvent.description.trim()) {
            toast.error("Please enter a description");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = buildEventFormData("publish");
            console.log('📤 Sending event data...');
            const response = await api.post("/admin/v1/event-post/add", formData);
            console.log('✅ Event created successfully:', response);
            console.log('✅ Response data:', response.data);

            toast.success("Event captured", {
                description: "Refresh to fetch the latest items from the server.",
            });
            queryClient.invalidateQueries({ queryKey: ["event-posts", "all-types"] });
            setIsCreateEventOpen(false);
            if (videoImagePreview) URL.revokeObjectURL(videoImagePreview);
            if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
            setVideoImagePreview(null);
            setThumbnailPreview(null);
            setNewEvent({
                postCategory: fixedCategory ?? "",
                startDate: new Date(),
                title: "",
                description: "",
                latitude: "",
                longitude: "",
                address: "",
                hashtag: "",
                sensitiveContent: false,
                videoImage: null as File | null,
                thumbnail: null as File | null,
            });
        } catch (err) {
            console.error('❌ Create Event Error:', err);
            console.error('❌ Error Response:', (err as any)?.response);
            console.error('❌ Error Data:', (err as any)?.response?.data);
            console.error('❌ Error Status:', (err as any)?.response?.status);
            console.error('❌ Error Message:', (err as any)?.message);

            toast.error((err as any)?.response?.data?.message || "Failed to create event");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!newEvent.postCategory) {
            toast.error("Please select a category");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = buildEventFormData("draft");
            await api.post("/admin/v1/event-post-draft/add", formData);
            toast.success("Draft saved");
            queryClient.invalidateQueries({ queryKey: ["event-posts", "all-types"] });
            setIsCreateEventOpen(false);
            if (videoImagePreview) URL.revokeObjectURL(videoImagePreview);
            if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
            setVideoImagePreview(null);
            setThumbnailPreview(null);
            setNewEvent({
                postCategory: fixedCategory ?? "",
                startDate: new Date(),
                title: "",
                description: "",
                latitude: "",
                longitude: "",
                address: "",
                hashtag: "",
                sensitiveContent: false,
                videoImage: null as File | null,
                thumbnail: null as File | null,
            });
        } catch (err) {
            toast.error((err as any)?.response?.data?.message || "Failed to save draft");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredEvents = useMemo(() => {
        const maxD = parseFloat(maxDistance);
        console.log('[Event.tsx] Filtering:', { status, category, eventsCount: events.length });

        const filtered = events.filter((evt) => {
            // Status filter - case-insensitive comparison
            if (status !== "all" && evt.status.toLowerCase() !== status.toLowerCase()) {
                return false;
            }
            // Category filter - normalize both sides for comparison
            if (category !== "all") {
                const evtCat = evt.category?.toLowerCase?.() || '';
                const filterCat = category?.toLowerCase?.() || '';
                if (evtCat !== filterCat && !evtCat.includes(filterCat)) {
                    return false;
                }
            }

            // Distance check: prefer numeric lat/lon + haversine when origin is set, otherwise parse from location string
            if (!Number.isNaN(maxD) && maxD > 0) {
                let distKm: number | null = null;

                // Try numeric lat/lon on event
                const lat = parseFloat((evt as any).latitude ?? "");
                const lon = parseFloat((evt as any).longitude ?? "");
                if (origin && !Number.isNaN(lat) && !Number.isNaN(lon)) {
                    distKm = haversineKm(origin.lat, origin.lon, lat, lon);
                } else {
                    // Fallback: try parse from location text like "City, 10.2 KM"
                    distKm = parseDistanceFromLocation(evt.location);
                }

                if (distKm !== null && !Number.isNaN(distKm) && distKm > maxD) return false;
                // If distKm is null, we can't evaluate distance — allow event through
            }

            // City filter (always active)
            if (cityInput && cityInput.trim()) {
                if (!evt.location || !evt.location.toLowerCase().includes(cityInput.trim().split(',')[0].toLowerCase())) return false;
            }

            // Date filter - compare only the date portion
            if (dateFilter) {
                const evtDateStr = evt.datetime.split("•")[0].trim(); // e.g., "Jan 08, 2026"
                const evtDate = new Date(evtDateStr);
                const filterDate = new Date(dateFilter);
                if (
                    evtDate.getFullYear() !== filterDate.getFullYear() ||
                    evtDate.getMonth() !== filterDate.getMonth() ||
                    evtDate.getDate() !== filterDate.getDate()
                ) {
                    return false;
                }
            }

            if (search.trim()) {
                const text = `${evt.title} ${evt.description} ${evt.user}`.toLowerCase();
                if (!text.includes(search.trim().toLowerCase())) return false;
            }

            return true;
        });

        // Sort by ISO timestamp (most recent first)
        const sorted = filtered.sort((a, b) => {
            const dateA = new Date(a.isoTimestamp).getTime();
            const dateB = new Date(b.isoTimestamp).getTime();
            return dateB - dateA;
        });

        console.log('[Event.tsx] Filtered results:', sorted.length);
        return sorted;
    }, [status, category, maxDistance, search, dateFilter, events, cityInput, origin]);

    return (
        <AdminLayout title={pageTitle}>
            <div className="space-y-4 text-foreground">
                <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                    <Card className="border-white/10 bg-card">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Dashboard analytics</CardTitle>
                                <p className="text-sm text-muted-foreground">Live view of queue health and approvals.</p>
                            </div>
                            <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-200">Realtime</Badge>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-4">
                            {dashboardItems.map((stat) => (
                                <div key={stat.label} className="rounded-xl border border-white/5 bg-white/5 p-4">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                                    <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                                    <div className="mt-3 h-2 rounded-full bg-white/10">
                                        <div className="h-2 rounded-full bg-blue-500/80" style={{ width: "72%" }} />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-card">
                        <CardHeader>
                            <CardTitle className="text-lg">Features</CardTitle>
                            <p className="text-sm text-muted-foreground">Quick actions to keep the queue flowing.</p>
                        </CardHeader>
                        <CardContent className="space-y-3 text-foreground">
                            <Button
                                className="w-full justify-between bg-blue-600 hover:bg-blue-500 text-white"
                                onClick={() => setIsCreateEventOpen(true)}
                            >
                                <span className="flex items-center gap-2"><FolderPlus className="h-4 w-4" /> New Event</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-between border-white/20 text-white"
                                onClick={handleSyncQueue}
                                disabled={isSyncing}
                            >
                                <span className="flex items-center gap-2">
                                    <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                                    {isSyncing ? "Syncing..." : "Sync queue"}
                                </span>
                                {!isSyncing && <ChevronRight className="h-4 w-4" />}
                            </Button>
                            {lastSyncTime && (
                                <p className="text-xs text-muted-foreground text-center">
                                    Last synced: {format(lastSyncTime, "hh:mm:ss a")}
                                </p>
                            )}
                            {/* Temporarily commented out Escalations button
                            <Button
                                variant="outline"
                                className="w-full justify-between border-white/20 text-white"
                                onClick={() => setIsEscalationsOpen(true)}
                            >
                                <span className="flex items-center gap-2">
                                    <Flag className="h-4 w-4" />
                                    Escalations
                                    <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                                        {escalationsData.filter(e => e.status !== "Resolved").length}
                                    </Badge>
                                </span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            */}


                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                    <Card className="border-white/10 bg-card/80">
                        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Events log</CardTitle>
                                <p className="text-sm text-muted-foreground">Filtered list updates as you tweak the controls.</p>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-emerald-400" /> Approved</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-blue-400" /> Pending</span>
                                <span className="flex items-center gap-1"><X className="h-3 w-3 text-red-400" /> Rejected</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Input
                                        placeholder="Search by title, user, description"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="h-10 w-[100px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                                {!fixedCategory ? (
                                    <Select value={category} onValueChange={setCategory} disabled={isLoadingCategories}>
                                        <SelectTrigger className="h-10 w-[140px]">
                                            <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Category"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {isLoadingCategories ? (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading categories...</div>
                                            ) : categoriesData.length === 0 ? (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories found</div>
                                            ) : (
                                                categoriesData.map((cat) => (
                                                    <SelectItem key={cat._id} value={cat.reactionName.toLowerCase()}>
                                                        <div className="flex items-center gap-2">
                                                            {cat.reactionIcon && (
                                                                <img src={cat.reactionIcon} alt="" className="h-4 w-4 object-contain" />
                                                            )}
                                                            <span>{cat.reactionName}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="inline-flex items-center rounded-md bg-white/5 px-3 py-2 text-sm font-medium text-white/80">{fixedCategory.charAt(0).toUpperCase() + fixedCategory.slice(1)}</div>
                                )}
                                <div className="relative w-[200px] flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={maxDistance}
                                            onChange={(e) => setMaxDistance(e.target.value)}
                                            className="h-10 pl-8 pr-2"
                                        />
                                        <MapPin className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <button type="button" className="text-xs text-muted-foreground" onClick={toggleUseMyLocation} disabled={isLocLoading}>
                                            {origin ? 'Clear location' : isLocLoading ? 'Locating...' : 'Use my location'}
                                        </button>
                                        {origin && <span className="text-[11px] text-muted-foreground">{origin.lat.toFixed(4)}, {origin.lon.toFixed(4)}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="max-h-[500px] space-y-3 overflow-y-auto pr-2">
                                {isLoadingEvents ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                                    </div>
                                ) : filteredEvents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                        <AlertTriangle className="h-12 w-12 mb-3" />
                                        <p className="text-lg font-medium">No events found</p>
                                        <p className="text-sm">Try adjusting your filters</p>
                                        <p className="text-xs mt-2 text-yellow-400">Debug: events={events.length}, filtered={filteredEvents.length}, eventsData={eventsData?.length ?? 'undefined'}</p>
                                    </div>
                                ) : (
                                    filteredEvents.map((evt) => (
                                        <Card
                                            key={evt.id}
                                            className="border-white/10 bg-card/90 cursor-pointer transition-colors hover:bg-card"
                                            onClick={() => {
                                                if (evt.isDraft) return;
                                                navigate(`/event/${evt.postType || 'incident'}/${evt.id}`);
                                            }}
                                        >
                                            <CardContent className="grid grid-cols-1 gap-4 p-4 md:grid-cols-[180px_1fr_auto] md:items-start">
                                                {/* Left: Avatar + User Info */}
                                                <div className="flex items-start gap-3">
                                                    <Avatar className="h-12 w-12 shrink-0">
                                                        <AvatarImage src={evt.avatar} alt={evt.user} />
                                                        <AvatarFallback className="bg-blue-600 text-white text-sm">{evt.user.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-white">{evt.user}</span>
                                                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">1</span>
                                                        </div>
                                                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                                                            <Clock className="h-3 w-3 shrink-0" />
                                                            <span>{evt.datetime}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Center: Title + Description + Location */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white">{evt.title}</span>
                                                        {evt.type === "video" && <Play className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">{evt.description}</p>
                                                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <MapPin className="h-3 w-3 shrink-0" />
                                                        {evt.location}
                                                    </p>
                                                </div>

                                                {/* Right: Status + Actions */}
                                                <div className="flex flex-col items-end gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "border-0 px-3 py-0.5 text-sm font-medium",
                                                            evt.status === "Approved" && "bg-emerald-500/20 text-emerald-400",
                                                            evt.status === "Pending" && "bg-blue-500/20 text-blue-300",
                                                            evt.status === "Rejected" && "bg-red-500/20 text-red-400"
                                                        )}
                                                    >
                                                        {evt.status}
                                                    </Badge>
                                                    {evt.isDraft ? (
                                                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                className="h-8 rounded-full bg-red-500/80 px-3 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60"
                                                                onClick={() => handleDeleteDraft(evt.id, evt.isDraft, evt.title)}
                                                                disabled={processingIds.includes(evt.id)}
                                                            >
                                                                {processingIds.includes(evt.id) ? (
                                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                                                ) : evt.isDraft ? (
                                                                    "Delete Draft"
                                                                ) : (
                                                                    "Delete Post"
                                                                )}
                                                            </button>
                                                        </div>
                                                    ) : evt.status === "Pending" && (
                                                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                className="h-8 rounded-full bg-neutral-700 px-3 text-xs font-medium text-white hover:bg-neutral-600 disabled:opacity-60"
                                                                onClick={() => handleDisapproveEvent(evt.id)}
                                                                disabled={processingIds.includes(evt.id)}
                                                            >
                                                                {processingIds.includes(evt.id) ? (
                                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                                                ) : (
                                                                    "Disapprove"
                                                                )}
                                                            </button>
                                                            <button
                                                                className="h-8 rounded-full bg-white px-3 text-xs font-medium text-black hover:bg-neutral-200 disabled:opacity-60"
                                                                onClick={() => handleApproveEvent(evt.id)}
                                                                disabled={processingIds.includes(evt.id)}
                                                            >
                                                                {processingIds.includes(evt.id) ? (
                                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                                                ) : (
                                                                    "Approve"
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>

                            <div className="rounded-xl border border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
                                <span>Showing {filteredEvents.length} of {events.length}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-card">
                        <CardHeader>
                            <CardTitle className="text-lg">Filters</CardTitle>
                            <p className="text-sm text-muted-foreground">Apply filters to refine the events log.</p>
                        </CardHeader>
                        <CardContent className="space-y-4 text-foreground">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm text-white/80">
                                    <span className="font-semibold">Location</span>
                                    <div className="flex items-center gap-2">
                                        <Input placeholder="Enter city (e.g., Mumbai)" value={cityInput} onChange={(e) => setCityInput(e.target.value)} className="bg-muted/10 w-[180px] text-sm" />
                                        <button type="button" className="text-muted-foreground hover:text-white" onClick={() => setCityDialogOpen(true)}>
                                            <Search className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-muted/20 px-3 py-2 text-sm text-white/80">
                                    {/* <span className="inline-flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-blue-300" />
                                        {cityInput ? cityInput : 'All Cities'}
                                    </span> */}
                                    <div className="flex items-center gap-2">
                                        <button type="button" className="text-muted-foreground hover:text-white" onClick={() => { setMaxDistance('0'); toast.success('Distance cleared'); import("@/lib/storage").then((m) => m.addLog({ id: `log-${Date.now()}`, timestamp: new Date().toLocaleString(), level: "info", type: "event", user: "admin@awaaz.com", action: "Distance Cleared", details: `Cleared distance filter` })); }}>
                                            Clear Distance
                                        </button>
                                    </div>
                                </div>

                                <Label className="text-xs uppercase text-muted-foreground">Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="bg-card/80">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase text-muted-foreground">Category</Label>
                                {!fixedCategory ? (
                                    <Select value={category} onValueChange={setCategory} disabled={isLoadingCategories}>
                                        <SelectTrigger className="bg-card/80">
                                            <SelectValue placeholder={isLoadingCategories ? "Loading..." : "All"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {isLoadingCategories ? (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</div>
                                            ) : categoriesData.length === 0 ? (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories</div>
                                            ) : (
                                                categoriesData.map((cat) => (
                                                    <SelectItem key={cat._id} value={cat.reactionName.toLowerCase()}>
                                                        <div className="flex items-center gap-2">
                                                            {cat.reactionIcon && (
                                                                <img src={cat.reactionIcon} alt="" className="h-4 w-4 object-contain" />
                                                            )}
                                                            <span>{cat.reactionName}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="inline-flex items-center rounded-md bg-white/5 px-3 py-2 text-sm font-medium text-white/80">{fixedCategory.charAt(0).toUpperCase() + fixedCategory.slice(1)}</div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase text-muted-foreground">Max distance (KM)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={maxDistance}
                                    onChange={(e) => setMaxDistance(e.target.value)}
                                    className="bg-card/80"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase text-muted-foreground">Search</Label>
                                <Input
                                    placeholder="Search by keyword"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="bg-card/80"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase text-muted-foreground">Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal bg-card/80",
                                                !dateFilter && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateFilter ? format(dateFilter, "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={dateFilter}
                                            onSelect={setDateFilter}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="pt-2 flex gap-2">
                                <Button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"><Filter className="mr-2 h-4 w-4" /> Apply</Button>
                                <Button variant="outline" className="flex-1" onClick={() => { setStatus("all"); setCategory("all"); setMaxDistance("5"); setSearch(""); setDateFilter(undefined); }}>
                                    Reset
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Create Event Dialog */}
            <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a1f] border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-white">Create Event</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        {/* Upload Areas */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Video/Image Upload */}
                            <div className="relative">
                                {videoImagePreview ? (
                                    <div className="relative h-32 rounded-xl border border-white/20 overflow-hidden group">
                                        {newEvent.videoImage?.type.startsWith('video/') ? (
                                            <video
                                                src={videoImagePreview}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <img
                                                src={videoImagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <label className="cursor-pointer p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                                                <Upload className="h-4 w-4 text-white" />
                                                <input
                                                    type="file"
                                                    accept="video/*,image/*"
                                                    className="hidden"
                                                    onChange={handleVideoImageChange}
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={removeVideoImage}
                                                className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
                                            >
                                                <X className="h-4 w-4 text-white" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                            <span className="text-xs text-white truncate block">{newEvent.videoImage?.name}</span>
                                        </div>
                                        {newEvent.videoImage?.type.startsWith('video/') && (
                                            <div className="absolute top-2 left-2">
                                                <Play className="h-5 w-5 text-white drop-shadow-lg" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 transition-colors hover:border-white/40 hover:bg-white/10">
                                        <Upload className="mb-2 h-6 w-6 text-white/60" />
                                        <span className="text-sm text-white/60">Attach Video/Image</span>
                                        <input
                                            type="file"
                                            accept="video/*,image/*"
                                            className="hidden"
                                            onChange={handleVideoImageChange}
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Thumbnail Upload */}
                            <div className="relative">
                                {thumbnailPreview ? (
                                    <div className="relative h-32 rounded-xl border border-white/20 overflow-hidden group">
                                        <img
                                            src={thumbnailPreview}
                                            alt="Thumbnail Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <label className="cursor-pointer p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                                                <Upload className="h-4 w-4 text-white" />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleThumbnailChange}
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={removeThumbnail}
                                                className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
                                            >
                                                <X className="h-4 w-4 text-white" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                            <span className="text-xs text-white truncate block">{newEvent.thumbnail?.name}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 transition-colors hover:border-white/40 hover:bg-white/10">
                                        <Image className="mb-2 h-6 w-6 text-white/60" />
                                        <span className="text-sm text-white/60">Attach Custom Thumbnail</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleThumbnailChange}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Post Category & Start Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-white">Post Category</Label>
                                {!fixedCategory ? (
                                    <Select value={newEvent.postCategory} onValueChange={(val) => setNewEvent({ ...newEvent, postCategory: val })} disabled={isLoadingCategories}>
                                        <SelectTrigger className="h-11 bg-white/5 border-white/10 text-white">
                                            <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select Category"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {isLoadingCategories ? (
                                                <div className="px-2 py-3 text-sm text-muted-foreground text-center">Loading categories...</div>
                                            ) : categoriesData.length === 0 ? (
                                                <div className="px-2 py-3 text-sm text-muted-foreground text-center">No categories available</div>
                                            ) : (
                                                categoriesData.map((cat) => (
                                                    <SelectItem key={cat._id} value={cat._id}>
                                                        <div className="flex items-center gap-2">
                                                            {cat.reactionIcon && (
                                                                <img src={cat.reactionIcon} alt="" className="h-5 w-5 object-contain" />
                                                            )}
                                                            <span>{cat.reactionName}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="inline-flex items-center rounded-md bg-white/5 px-3 py-2 text-sm font-medium text-white/80">{fixedCategory.charAt(0).toUpperCase() + fixedCategory.slice(1)}</div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-white">Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="h-11 w-full justify-start bg-white/5 border-white/10 text-white hover:bg-white/10"
                                        >
                                            <Clock className="mr-2 h-4 w-4" />
                                            {format(newEvent.startDate, "MM/dd/yyyy hh:mm a")}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={newEvent.startDate}
                                            onSelect={(date) => date && setNewEvent({ ...newEvent, startDate: date })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <Label className="text-white">Title</Label>
                            <Input
                                placeholder="Enter Title"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label className="text-white">Description</Label>
                            <Textarea
                                placeholder="Enter Description"
                                value={newEvent.description}
                                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
                            />
                        </div>

                        {/* Latitude & Longitude */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-white">Latitude</Label>
                                <Input
                                    placeholder="Enter Latitude"
                                    value={newEvent.latitude}
                                    onChange={(e) => setNewEvent({ ...newEvent, latitude: e.target.value })}
                                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-white">Longitude</Label>
                                <Input
                                    placeholder="Enter Longitude"
                                    value={newEvent.longitude}
                                    onChange={(e) => setNewEvent({ ...newEvent, longitude: e.target.value })}
                                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <Label className="text-white">Address</Label>
                            <Input
                                placeholder="Enter Address"
                                value={newEvent.address}
                                onChange={(e) => setNewEvent({ ...newEvent, address: e.target.value })}
                                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                            />
                        </div>

                        {/* Hashtag */}
                        <div className="space-y-2">
                            <Label className="text-white">Hashtag</Label>
                            <Input
                                placeholder="Enter #Hashtags Separated by Space"
                                value={newEvent.hashtag}
                                onChange={(e) => setNewEvent({ ...newEvent, hashtag: e.target.value })}
                                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                            />
                        </div>

                        {/* Sensitive Content */}
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="sensitiveContent"
                                checked={newEvent.sensitiveContent}
                                onCheckedChange={(checked) => setNewEvent({ ...newEvent, sensitiveContent: checked === true })}
                                className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                            />
                            <Label htmlFor="sensitiveContent" className="text-white cursor-pointer">
                                Sensitive Content
                            </Label>
                        </div>

                        {/* Post Button */}
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={handleSaveDraft}
                                disabled={isSubmitting}
                                className="h-11 px-8"
                            >
                                Save as Draft
                            </Button>
                            <Button
                                onClick={handleCreateEvent}
                                disabled={isSubmitting}
                                className="h-11 px-8 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                            >
                                {isSubmitting ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                ) : (
                                    "Post"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Temporarily commented out Escalations Dialog
            <Dialog open={false} onOpenChange={() => { }}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-[#1a1a1f] border-white/10">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-white">
                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                            Escalations
                            <Badge variant="destructive" className="ml-2">
                                {escalationsData.filter(e => e.status !== "Resolved").length} Active
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {escalationsData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Check className="h-12 w-12 text-emerald-400 mb-4" />
                                <p className="text-lg font-medium text-white">No Escalations</p>
                                <p className="text-sm text-muted-foreground">All escalations have been resolved.</p>
                            </div>
                        ) : (
                            escalationsData.map((escalation) => (
                                <Card key={escalation.id} className={cn(
                                    "border-white/10 bg-card/90",
                                    escalation.priority === "Critical" && "border-l-4 border-l-red-500",
                                    escalation.priority === "High" && "border-l-4 border-l-amber-500",
                                    escalation.priority === "Medium" && "border-l-4 border-l-blue-500"
                                )}>
                                    <CardContent className="p-4">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "border-0 text-xs font-medium",
                                                            escalation.priority === "Critical" && "bg-red-500/20 text-red-400",
                                                            escalation.priority === "High" && "bg-amber-500/20 text-amber-400",
                                                            escalation.priority === "Medium" && "bg-blue-500/20 text-blue-400"
                                                        )}
                                                    >
                                                        {escalation.priority}
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "border-0 text-xs font-medium",
                                                            escalation.status === "Open" && "bg-red-500/20 text-red-400",
                                                            escalation.status === "In Progress" && "bg-amber-500/20 text-amber-400",
                                                            escalation.status === "Resolved" && "bg-emerald-500/20 text-emerald-400"
                                                        )}
                                                    >
                                                        {escalation.status}
                                                    </Badge>
                                                </div>
                                                <h4 className="font-semibold text-white">{escalation.eventTitle}</h4>
                                                <p className="text-sm text-muted-foreground">{escalation.reason}</p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span>Escalated by: <span className="text-white">{escalation.user}</span></span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {escalation.escalatedAt}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-white/20 text-white hover:bg-white/10"
                                                    onClick={() => handleViewEvent(escalation.eventTitle)}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>
                                                {escalation.status !== "Resolved" && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                                        onClick={() => { }}
                                                    >
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Resolve
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            */}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmation.isOpen} onOpenChange={(open) => !open && cancelDelete()}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Confirm Deletion
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground mb-4">
                            Are you sure you want to delete this {deleteConfirmation.isDraft ? 'draft' : 'post'}? This action cannot be undone.
                        </p>
                        <div className="bg-muted/50 p-3 rounded-md">
                            <p className="font-medium text-sm">{deleteConfirmation.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Type: {deleteConfirmation.isDraft ? 'Draft' : 'Published Post'}
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={cancelDelete}
                            disabled={deleteDraftMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleteDraftMutation.isPending}
                        >
                            {deleteDraftMutation.isPending ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash className="h-4 w-4 mr-2" />
                                    Delete {deleteConfirmation.isDraft ? 'Draft' : 'Post'}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
