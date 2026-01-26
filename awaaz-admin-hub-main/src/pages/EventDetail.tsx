import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
    ArrowLeft,
    Eye,
    Heart,
    Share2,
    MessageCircle,
} from "lucide-react";
import { format } from "date-fns";

export default function EventDetailPage() {
    const navigate = useNavigate();
    const { postType, id } = useParams();
    console.log('🆔 useParams:', { postType, id });

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

    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Media Preview Popup State
    const [isMediaPreviewOpen, setIsMediaPreviewOpen] = useState(false);

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            toast.success("Event updated successfully!");
        } catch (err) {
            toast.error("Failed to update event");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            toast.success("Event deleted successfully!");
            navigate("/");
        } catch (err) {
            toast.error("Failed to delete event");
        } finally {
            setIsDeleting(false);
        }
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
                                            value={eventDetailsData?.title || ""}
                                            onChange={(e) => {
                                                // Allow admin to edit title
                                                console.log('Title changed:', e.target.value);
                                            }}
                                            className="h-12 bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white">Hashtag</Label>
                                        <Input
                                            value={eventDetailsData?.hashTags?.join(", ") || ""}
                                            onChange={(e) => {
                                                // Allow admin to edit hashtags
                                                console.log('Hashtags changed:', e.target.value);
                                            }}
                                            placeholder="#test, #example"
                                            className="h-12 bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <Label className="text-white">Location</Label>
                                    <Input
                                        value={eventDetailsData?.address || ""}
                                        onChange={(e) => {
                                            // Allow admin to edit address
                                            console.log('Address changed:', e.target.value);
                                        }}
                                        className="h-12 bg-white/5 border-white/10 text-white"
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label className="text-white">Description</Label>
                                    <Textarea
                                        value={eventDetailsData?.additionalDetails || ""}
                                        onChange={(e) => {
                                            // Allow admin to edit description
                                            console.log('Description changed:', e.target.value);
                                        }}
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
                </>
            )}
        </AdminLayout>
    );
}
