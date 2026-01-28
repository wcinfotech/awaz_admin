import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
    ArrowLeft,
    Eye,
    Heart,
    Share2,
    MessageCircle,
    Trash,
} from "lucide-react";
import { format } from "date-fns";

export default function EventDetailPage() {
    const navigate = useNavigate();
    const { postType, id } = useParams();
    console.log('🆔 useParams:', { postType, id });

    // State for editable fields
    const [editableData, setEditableData] = useState({
        title: "",
        additionalDetails: "",
        hashTags: "",
        address: ""
    });

    // State for delete confirmation dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isMediaPreviewOpen, setIsMediaPreviewOpen] = useState(false);

    // Get queryClient for cache invalidation
    const queryClient = useQueryClient();

    // Fetch event details from API
    const { data: eventDetailsData, isLoading: isLoadingEvent } = useQuery({
        queryKey: ['event-detail', postType, id],
        queryFn: async () => {
            console.log('🚦 Query function running, id:', id, 'postType:', postType);
            if (!id || !postType) {
                console.log('❌ No ID or postType provided, returning null');
                return null;
            }

            try {
                const response = await api.get(`/admin/v1/event-post/${postType}/${id}`);
                console.log('🔍 Full API Response:', response);
                console.log('🔍 Response.data:', response.data);
                console.log('🔍 Response.data type:', typeof response.data);
                console.log('🔍 Response.data keys:', response.data ? Object.keys(response.data) : 'No keys');

                // Handle different response structures
                if (!response.data) {
                    console.log('❌ No response.data, returning null');
                    return null;
                }

                // Check if response.data has the expected structure
                if (response.data.status === true && response.data.body) {
                    console.log('✅ Found status: true with body field');
                    const eventData = response.data.body;
                    console.log('✅ Event data extracted:', eventData);
                    console.log('🔍 Event attachment:', eventData.attachment);
                    console.log('🔍 Event attachmentFileType:', eventData.attachmentFileType);
                    console.log('🔍 Event thumbnail:', eventData.thumbnail);
                    console.log('🔍 Event createdAt:', eventData.createdAt);
                    console.log('🔍 Event eventTime:', eventData.eventTime);
                    console.log('👤 User Data Debug:', {
                        userId: eventData?.userId,
                        name: eventData?.name,
                        username: eventData?.username,
                        profilePicture: eventData?.profilePicture,
                        userIdName: eventData?.userId?.name,
                        userIdUsername: eventData?.userId?.username,
                        userIdProfilePicture: eventData?.userId?.profilePicture
                    });
                    console.log('🔍 Event all fields:', Object.keys(eventData));
                    return eventData;
                }

                // Check if data is directly in response.data (no nested body field)
                if (response.data.title || response.data._id) {
                    console.log('✅ Found event data directly in response.data');
                    console.log('✅ Event data:', response.data);
                    // Update editable data when event data loads
                    if (response.data) {
                        const eventData = response.data.data || response.data;
                        setEditableData({
                            title: eventData?.title || "",
                            additionalDetails: eventData?.additionalDetails || "",
                            hashTags: eventData?.hashTags?.join(", ") || "",
                            address: eventData?.address || ""
                        });
                    }

                    return response.data;
                }

                // Check if there's a body field but it's empty/null
                if (response.data.body === null || response.data.body === undefined) {
                    console.log('❌ response.data.body is null/undefined - Event not found');
                    return null;
                }

                // Log the entire structure for debugging
                console.log('❌ Unexpected response structure. Full response:', JSON.stringify(response.data, null, 2));
                return null;
            } catch (error) {
                console.error('❌ API call failed:', error);
                return null;
            }
        },
        enabled: !!id && !!postType,
        staleTime: 30000,
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (eventId: string) => {
            const response = await api.delete(`/admin/v1/event-post/${eventId}`);
            return response.data;
        },
        onSuccess: () => {
            toast.success("Event deleted successfully");
            navigate('/'); // Redirect to home page (Event list)
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to delete event");
        }
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (updateData: any) => {
            const response = await api.put('/admin/v1/event-post/update-text', updateData);
            return response.data;
        },
        onSuccess: (data, variables) => {
            toast.success("Event updated successfully");
            // Refetch event details to get updated data
            queryClient.invalidateQueries({ queryKey: ['event-detail', postType, id] });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to update event");
        }
    });

    const handleUpdate = async () => {
        if (!id) {
            toast.error("No event ID found");
            return;
        }

        setIsUpdating(true);
        try {
            const updatePayload = {
                eventPostId: id,
                title: editableData.title,
                additionalDetails: editableData.additionalDetails,
                hashTags: editableData.hashTags.split(',').map(tag => tag.trim()).filter(tag => tag),
                address: editableData.address
            };

            await updateMutation.mutateAsync(updatePayload);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!id) {
            toast.error("No event ID found");
            return;
        }

        setIsDeleting(true);
        try {
            await deleteMutation.mutateAsync(id);
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const cancelDelete = () => {
        setIsDeleteDialogOpen(false);
    };

    // Handle event not found
    if (!isLoadingEvent && !eventDetailsData) {
        return (
            <AdminLayout title="Event Detail">
                <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white mb-4">Event Not Found</h1>
                        <p className="text-white/60">The event you're looking for doesn't exist.</p>
                        <Button
                            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={() => navigate("/")}
                        >
                            Back to Events
                        </Button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Event Detail">
            {isLoadingEvent ? (
                <div className="flex items-center justify-center py-24">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                </div>
            ) : (
                <>
                    <div className="space-y-6 text-foreground">
                        {/* Header */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 rounded-full border-white/20"
                                    onClick={() => navigate("/")}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Event Detail</h1>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>Event</span>
                                        <span>›</span>
                                        <span className="text-emerald-400">
                                            {eventDetailsData?.title || "Loading..."}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <Card className="border-white/10 bg-card">
                            <CardContent className="space-y-6 p-6">
                                {/* User Info */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={eventDetailsData?.userId?.profilePicture || eventDetailsData?.profilePicture} alt={eventDetailsData?.userId?.name || eventDetailsData?.userId?.username || eventDetailsData?.name || eventDetailsData?.username} />
                                            <AvatarFallback className="bg-blue-600 text-white text-sm">
                                                {(eventDetailsData?.userId?.name || eventDetailsData?.userId?.username || eventDetailsData?.name || eventDetailsData?.username || "Unknown User").slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-white">
                                            {eventDetailsData?.userId?.name || eventDetailsData?.userId?.username || eventDetailsData?.name || eventDetailsData?.username || "Unknown User"}
                                        </span>
                                    </div>
                                    {eventDetailsData?.adminCreatedPostId && (
                                        <div className="text-white text-sm">
                                            <b>Admin Created Post ID:</b> {eventDetailsData.adminCreatedPostId}
                                        </div>
                                    )}
                                    {eventDetailsData?.attachmentId && (
                                        <div className="text-white text-sm">
                                            <b>Attachment ID:</b> {eventDetailsData.attachmentId}
                                        </div>
                                    )}
                                </div>

                                {/* Media Display */}
                                {(() => {
                                    console.log('🎬 Media Display Check:');
                                    console.log('  - eventDetailsData:', eventDetailsData);
                                    console.log('  - attachment:', eventDetailsData?.attachment);
                                    console.log('  - attachmentFileType:', eventDetailsData?.attachmentFileType);
                                    console.log('  - thumbnail:', eventDetailsData?.thumbnail);

                                    if (!eventDetailsData?.attachment) {
                                        console.log('❌ No attachment found');
                                        return null;
                                    }

                                    console.log('✅ Attachment found, type:', eventDetailsData.attachmentFileType);

                                    return (
                                        <div className="space-y-2">
                                            <Label className="text-white">Attached Media</Label>
                                            <div className="relative inline-block">
                                                <div className="relative rounded-xl bg-gray-900 border border-white/10 overflow-hidden group">
                                                    {/* Display media based on attachmentFileType or file extension */}
                                                    {(eventDetailsData.attachmentFileType?.includes("video") ||
                                                        eventDetailsData.attachment?.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)(\?.*)?$/i)) ? (
                                                        <>
                                                            {console.log('🎥 Rendering video')}
                                                            <video
                                                                src={eventDetailsData.attachment}
                                                                className="max-w-md max-h-64 object-contain cursor-pointer"
                                                                poster={eventDetailsData.thumbnail}
                                                                controls
                                                                onClick={() => setIsMediaPreviewOpen(true)}
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            {console.log('🖼️ Rendering image')}
                                                            <img
                                                                src={eventDetailsData.attachment}
                                                                alt="Event media"
                                                                className="max-w-md max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                                                onClick={() => setIsMediaPreviewOpen(true)}
                                                            />
                                                        </>
                                                    )}
                                                    {/* Overlay actions on hover */}
                                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setIsMediaPreviewOpen(true)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                                                            title="View full size"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* File info */}
                                                <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
                                                    <span>Click to view full size</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Post Category (READ-ONLY) */}
                                <div className="space-y-2">
                                    <Label className="text-white">Post Category</Label>
                                    <Input
                                        value={eventDetailsData?.postCategoryId?.eventName || ""}
                                        readOnly
                                        className="h-12 bg-white/5 border-white/10 text-white"
                                    />
                                </div>

                                {/* Event Timestamp */}
                                {(eventDetailsData?.createdAt || eventDetailsData?.eventTime) && (
                                    <div className="space-y-2">
                                        <Label className="text-white">Event Time</Label>
                                        <Input
                                            value={eventDetailsData?.createdAt || eventDetailsData?.eventTime ?
                                                format(new Date(eventDetailsData.createdAt || eventDetailsData.eventTime), "dd/MM/yyyy hh:mm a") :
                                                ""
                                            }
                                            disabled
                                            className="h-12 bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                )}

                                {/* Title & Hashtag */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-white">Title</Label>
                                        <Input
                                            value={editableData.title}
                                            onChange={(e) => setEditableData(prev => ({ ...prev, title: e.target.value }))}
                                            className="h-12 bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white">Hashtag</Label>
                                        <Input
                                            value={editableData.hashTags}
                                            onChange={(e) => setEditableData(prev => ({ ...prev, hashTags: e.target.value }))}
                                            placeholder="#test, #example"
                                            className="h-12 bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <Label className="text-white">Location</Label>
                                    <Input
                                        value={editableData.address}
                                        onChange={(e) => setEditableData(prev => ({ ...prev, address: e.target.value }))}
                                        className="h-12 bg-white/5 border-white/10 text-white"
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label className="text-white">Description</Label>
                                    <Textarea
                                        value={editableData.additionalDetails}
                                        onChange={(e) => setEditableData(prev => ({ ...prev, additionalDetails: e.target.value }))}
                                        className="min-h-[100px] bg-white/5 border-white/10 text-white resize-none"
                                    />
                                </div>

                                {/* Latitude & Longitude (READ-ONLY) */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-white">Latitude</Label>
                                        <Input
                                            value={eventDetailsData?.latitude || ""}
                                            readOnly
                                            className="h-12 bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white">Longitude</Label>
                                        <Input
                                            value={eventDetailsData?.longitude || ""}
                                            readOnly
                                            className="h-12 bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                </div>

                                {/* Stats - Read Only */}
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label className="text-white flex items-center gap-2">
                                            <Heart className="h-4 w-4" /> Like
                                        </Label>
                                        <Input
                                            value={eventDetailsData?.reactionCounts || 0}
                                            readOnly
                                            className="h-12 bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white flex items-center gap-2">
                                            <Share2 className="h-4 w-4" /> Share
                                        </Label>
                                        <Input
                                            value={eventDetailsData?.sharedCount || 0}
                                            readOnly
                                            className="h-12 bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white flex items-center gap-2">
                                            <Eye className="h-4 w-4" /> View
                                        </Label>
                                        <Input
                                            value={eventDetailsData?.viewCounts || 0}
                                            readOnly
                                            className="h-12 bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white flex items-center gap-2">
                                            <MessageCircle className="h-4 w-4" /> Comment
                                        </Label>
                                        <Input
                                            value={eventDetailsData?.commentCounts || 0}
                                            readOnly
                                            className="h-12 bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Footer Actions */}
                        <div className="flex justify-end gap-4 pb-6">
                            <Button
                                variant="destructive"
                                className="h-12 px-8 bg-red-500 hover:bg-red-600"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                ) : (
                                    "Delete"
                                )}
                            </Button>
                            <Button
                                className="h-12 px-8 bg-gray-600 hover:bg-gray-500"
                                onClick={handleUpdate}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                ) : (
                                    "Update"
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Media Preview Popup */}
                    <Dialog open={isMediaPreviewOpen} onOpenChange={setIsMediaPreviewOpen}>
                        <DialogContent className="max-w-lg p-6 bg-[#1a1a1f] border-white/10">
                            <DialogHeader>
                                <DialogTitle className="text-white">Media Preview</DialogTitle>
                            </DialogHeader>
                            <div className="relative">
                                {/* Media content */}
                                {eventDetailsData?.attachment && (
                                    <div className="rounded-xl bg-gray-900 border border-white/10 overflow-hidden">
                                        {(eventDetailsData.attachmentFileType?.includes("video") ||
                                            eventDetailsData.attachment?.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)(\?.*)?$/i)) ? (
                                            <video
                                                src={eventDetailsData.attachment}
                                                className="max-w-md max-h-64 object-contain w-full"
                                                controls
                                                autoPlay
                                                poster={eventDetailsData.thumbnail}
                                            />
                                        ) : (
                                            <img
                                                src={eventDetailsData.attachment}
                                                alt="Event media"
                                                className="max-w-md max-h-64 object-contain w-full"
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Media info */}
                                <div className="mt-4 space-y-1">
                                    <p className="text-white font-medium">{eventDetailsData?.title}</p>
                                    <p className="text-white/60 text-sm">
                                        Uploaded by {
                                            eventDetailsData?.userId?.name ||
                                            eventDetailsData?.userId?.username ||
                                            eventDetailsData?.name ||
                                            eventDetailsData?.username ||
                                            "Unknown User"
                                        }
                                    </p>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogContent className="max-w-md p-6 bg-[#1a1a1f] border-white/10">
                            <DialogHeader>
                                <DialogTitle className="text-white flex items-center gap-2">
                                    <Trash className="h-5 w-5 text-red-500" />
                                    Confirm Deletion
                                </DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <p className="text-white/80 mb-4">
                                    Are you sure you want to delete this event? This action cannot be undone.
                                </p>
                                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-md">
                                    <p className="text-white font-medium">{eventDetailsData?.title}</p>
                                    <p className="text-white/60 text-sm mt-1">
                                        Type: {postType?.charAt(0).toUpperCase() + postType?.slice(1)}
                                    </p>
                                </div>
                            </div>
                            <DialogFooter className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={cancelDelete}
                                    disabled={isDeleting}
                                    className="border-white/20 text-white hover:bg-white/10"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="bg-red-500 hover:bg-red-600"
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white mr-2" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash className="h-4 w-4 mr-2" />
                                            Delete Event
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </AdminLayout>
    );
}
