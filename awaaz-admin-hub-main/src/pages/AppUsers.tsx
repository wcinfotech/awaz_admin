import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Shield, Eye, Ban, UserCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AppUser {
    _id: string;
    name?: string;
    username?: string;
    profilePicture?: string;
    isBlocked: boolean;
    // Add other fields that might be in the database
    email?: string;
    mobile?: string;
    role?: string;
    createdAt?: string;
}

const AppUsers: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'video' | 'image'; thumbnail?: string } | null>(null);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

    // Fetch all app users
    const { data: users = [], isLoading, refetch } = useQuery({
        queryKey: ["app-users"],
        queryFn: async () => {
            try {
                // Get all users (both blocked and unblocked)
                const response = await api.get("/admin/v1/user/app-users/all?limit=1000");
                console.log('🔍 App users response:', response.data);

                // Safely access the response data - the actual users are in response.data.body.data
                let usersData = response.data?.body?.data || response.data?.data?.data || response.data?.data || [];

                // Ensure we always return an array
                if (!Array.isArray(usersData)) {
                    console.warn('⚠️ API response is not an array, using empty array:', usersData);
                    usersData = [];
                }

                console.log('🔍 Users array:', usersData);
                console.log('🔍 Users array length:', usersData.length);
                console.log('🔍 Sample user:', usersData[0]);

                return usersData;
            } catch (error) {
                console.error('❌ Error fetching app users:', error);
                toast.error("Failed to fetch users");
                return []; // Always return an array
            }
        },
    });

    // Block/unblock user mutation
    const blockUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            console.log('🔍 Toggling block status for user:', userId);
            const response = await api.put(`/admin/v1/user/block-app-user/${userId}`);
            return response.data;
        },
        onSuccess: (data, variables) => {
            const user = users.find((u: AppUser) => u._id === variables);
            const action = user?.isBlocked ? "unblocked" : "blocked";
            toast.success(`User ${action} successfully`);
            refetch();
        },
        onError: (error: any) => {
            console.error('❌ Block/unblock error:', error);
            toast.error(error.response?.data?.message || "Failed to update user status");
        },
    });

    // Get user profile
    const { data: userProfile } = useQuery({
        queryKey: ["user-profile", selectedUser?._id],
        queryFn: async () => {
            if (!selectedUser?._id) return null;
            try {
                const response = await api.get(`/admin/v1/user/user-profile/${selectedUser._id}`);
                console.log('🔍 User profile response:', response.data);
                return response.data?.body || response.data?.data || response.data;
            } catch (error) {
                console.error('❌ Error fetching user profile:', error);
                toast.error("Failed to fetch user profile");
                return null;
            }
        },
        enabled: !!selectedUser?._id,
    });

    // Filter users based on search term
    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;

        return users.filter((user: AppUser) =>
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.mobile?.includes(searchTerm)
        );
    }, [users, searchTerm]);

    // Calculate statistics
    const stats = useMemo(() => ({
        total: users.length,
        blocked: users.filter((user: AppUser) => user.isBlocked).length,
        active: users.filter((user: AppUser) => !user.isBlocked).length,
    }), [users]);

    const handleBlockUnblock = (user: AppUser) => {
        const action = user.isBlocked ? "unblock" : "block";
        if (window.confirm(`Are you sure you want to ${action} this user?`)) {
            blockUserMutation.mutate(user._id);
        }
    };

    const handleViewProfile = (user: AppUser) => {
        setSelectedUser(user);
        setIsProfileModalOpen(true);
    };

    const handleViewMedia = (attachment: string, thumbnail?: string) => {
        const isVideo = attachment.includes('.mp4') || attachment.includes('.mov') || attachment.includes('.avi');
        setSelectedMedia({
            url: attachment,
            type: isVideo ? 'video' : 'image',
            thumbnail
        });
        setIsMediaModalOpen(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <AdminLayout title="User Management">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white">App Users</h1>
                    <p className="text-white/60 mt-2">Manage application users and their access</p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-card/50 border-border/50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">Total Users</p>
                                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 border-border/50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <UserCheck className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">Active Users</p>
                                    <p className="text-2xl font-bold text-white">{stats.active}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 border-border/50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/20 rounded-lg">
                                    <Ban className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">Blocked Users</p>
                                    <p className="text-2xl font-bold text-white">{stats.blocked}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search Bar */}
                <Card className="bg-card/50 border-border/50">
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                            <Input
                                placeholder="Search by name, email, or mobile..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-background/50 border-border/50 text-white placeholder:text-white/40"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                        <CardTitle className="text-white">All Users ({filteredUsers.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                <p className="text-white/60">
                                    {searchTerm ? "No users found matching your search" : "No users found"}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border/50">
                                            <th className="text-left py-3 px-4 text-white/60 font-medium">User</th>
                                            <th className="text-left py-3 px-4 text-white/60 font-medium">Role</th>
                                            <th className="text-left py-3 px-4 text-white/60 font-medium">Status</th>
                                            <th className="text-left py-3 px-4 text-white/60 font-medium">Joined Date</th>
                                            <th className="text-right py-3 px-4 text-white/60 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user: AppUser) => (
                                            <tr key={user._id} className="border-b border-border/30 hover:bg-background/30 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-8 h-8">
                                                            <AvatarImage src={user.profilePicture} alt={user.name} />
                                                            <AvatarFallback>
                                                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-white font-medium">{user.name || 'Unknown User'}</p>
                                                            {user.email && (
                                                                <p className="text-white/60 text-sm">{user.email}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                        {user.role || 'App User'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge className={user.isBlocked ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}>
                                                        {user.isBlocked ? 'Blocked' : 'Active'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="text-white/60 text-sm">
                                                        {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewProfile(user)}
                                                            className="text-blue-400 hover:text-blue-300"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleBlockUnblock(user)}
                                                            disabled={blockUserMutation.isPending}
                                                            className={user.isBlocked ? "text-green-400 hover:text-green-300" : "text-orange-400 hover:text-orange-300"}
                                                        >
                                                            {blockUserMutation.isPending && blockUserMutation.variables === user._id ? (
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                                            ) : user.isBlocked ? (
                                                                <><UserCheck className="w-4 h-4" /></>
                                                            ) : (
                                                                <><Ban className="w-4 h-4" /></>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* User Profile Modal */}
                <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
                    <DialogContent className="bg-card border-border/50 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>User Profile</DialogTitle>
                        </DialogHeader>
                        {userProfile && (
                            <div className="space-y-6">
                                {/* User Basic Info */}
                                <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg">
                                    <Avatar className="w-20 h-20">
                                        <AvatarImage src={userProfile.profilePicture || selectedUser?.profilePicture} />
                                        <AvatarFallback className="text-xl">
                                            {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-semibold">{userProfile.name || selectedUser?.name || 'Unknown User'}</h3>
                                        <p className="text-white/60">@{userProfile.username || selectedUser?.username || 'N/A'}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge className={userProfile.isBlocked ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}>
                                                {userProfile.isBlocked ? 'Blocked' : 'Active'}
                                            </Badge>
                                            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                App User
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* User Statistics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card className="bg-background/50 border-border/50">
                                        <CardContent className="p-4 text-center">
                                            <p className="text-2xl font-bold text-blue-400">{userProfile.allBroadcastCounts || '0'}</p>
                                            <p className="text-sm text-white/60">Total Posts</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-background/50 border-border/50">
                                        <CardContent className="p-4 text-center">
                                            <p className="text-2xl font-bold text-green-400">{userProfile.totalApprovedEventViews || '0'}</p>
                                            <p className="text-sm text-white/60">Approved Views</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-background/50 border-border/50">
                                        <CardContent className="p-4 text-center">
                                            <p className="text-2xl font-bold text-purple-400">{userProfile.verifiedEventCounts || '0'}</p>
                                            <p className="text-sm text-white/60">Verified Events</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-background/50 border-border/50">
                                        <CardContent className="p-4 text-center">
                                            <p className="text-2xl font-bold text-orange-400">{userProfile.allBroadcasts?.length || '0'}</p>
                                            <p className="text-sm text-white/60">Broadcast Posts</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* User Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <h4 className="text-lg font-semibold text-white">User Information</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-white/60">User ID:</span>
                                                <span className="text-white font-mono text-sm">{userProfile._id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Username:</span>
                                                <span className="text-white">{userProfile.username || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Status:</span>
                                                <Badge className={userProfile.isBlocked ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}>
                                                    {userProfile.isBlocked ? 'Blocked' : 'Active'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-lg font-semibold text-white">Account Details</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Profile Picture:</span>
                                                <span className="text-white">{userProfile.profilePicture ? 'Available' : 'Not Available'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* User Posts */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-white">User Posts ({userProfile.allBroadcasts?.length || 0})</h4>
                                    {userProfile.allBroadcasts && userProfile.allBroadcasts.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {userProfile.allBroadcasts.map((post: any) => (
                                                <Card key={post._id} className="bg-background/50 border-border/50">
                                                    <CardContent className="p-4">
                                                        <div className="space-y-3">
                                                            {/* Post Thumbnail/Video */}
                                                            {post.thumbnail && (
                                                                <div
                                                                    className="relative rounded-lg overflow-hidden cursor-pointer group"
                                                                    onClick={() => handleViewMedia(post.attachment, post.thumbnail)}
                                                                >
                                                                    <img
                                                                        src={post.thumbnail}
                                                                        alt="Post thumbnail"
                                                                        className="w-full h-40 object-cover transition-transform group-hover:scale-105"
                                                                    />
                                                                    {post.attachment && post.attachment.includes('.mp4') && (
                                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                                                                            <div className="w-12 h-12 bg-white/90 group-hover:bg-white rounded-full flex items-center justify-center transition-all">
                                                                                <span className="text-black font-bold text-lg">▶</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <div className="absolute bottom-2 left-2 text-white text-xs">
                                                                            Click to {post.attachment?.includes('.mp4') ? 'play video' : 'view image'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Post Info */}
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center">
                                                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                                                        {post.status}
                                                                    </Badge>
                                                                    <span className="text-xs text-white/40">ID: {post._id.slice(-8)}</span>
                                                                </div>
                                                                {post.attachment && (
                                                                    <div>
                                                                        <p className="text-sm text-white/60">Attachment:</p>
                                                                        <a
                                                                            href={post.attachment}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-blue-400 hover:text-blue-300 text-sm break-all"
                                                                        >
                                                                            View Media
                                                                        </a>
                                                                    </div>
                                                                )}
                                                                {post.adminCreatedPostId && (
                                                                    <div>
                                                                        <p className="text-sm text-white/60">Admin Post ID:</p>
                                                                        <span className="text-xs text-white/40 font-mono">{post.adminCreatedPostId}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 bg-background/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="text-2xl">📸</span>
                                            </div>
                                            <p className="text-white/60">No posts found</p>
                                        </div>
                                    )}
                                </div>

                                {/* Verified Events */}
                                {userProfile.verifiedEventPosts && userProfile.verifiedEventPosts.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-white">Verified Events ({userProfile.verifiedEventPosts.length})</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {userProfile.verifiedEventPosts.map((event: any) => (
                                                <Card key={event._id} className="bg-background/50 border-border/50">
                                                    <CardContent className="p-4">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                                                    Verified Event
                                                                </Badge>
                                                                <span className="text-xs text-white/40">ID: {event._id.slice(-8)}</span>
                                                            </div>
                                                            {/* Add event details here based on the actual structure */}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Media Viewer Modal */}
                <Dialog open={isMediaModalOpen} onOpenChange={setIsMediaModalOpen}>
                    <DialogContent className="bg-card border-border/50 text-white max-w-6xl max-h-[90vh] overflow-hidden p-0">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Media Viewer</DialogTitle>
                        </DialogHeader>
                        <div className="relative w-full h-full min-h-[500px]">
                            {/* Close Button */}
                            <button
                                onClick={() => setIsMediaModalOpen(false)}
                                className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                            >
                                <span className="text-xl">×</span>
                            </button>

                            {/* Media Content */}
                            {selectedMedia && (
                                <div className="w-full h-full flex items-center justify-center bg-black">
                                    {selectedMedia.type === 'video' ? (
                                        <video
                                            src={selectedMedia.url}
                                            controls
                                            autoPlay
                                            className="max-w-full max-h-[80vh] rounded-lg"
                                            style={{ maxHeight: '70vh' }}
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <img
                                            src={selectedMedia.url}
                                            alt="Media content"
                                            className="max-w-full max-h-[80vh] object-contain rounded-lg"
                                            style={{ maxHeight: '70vh' }}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Media Info Bar */}
                            {selectedMedia && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-white">
                                            <p className="text-sm font-medium">
                                                {selectedMedia.type === 'video' ? 'Video' : 'Image'}
                                            </p>
                                            <p className="text-xs text-white/60 truncate max-w-md">
                                                {selectedMedia.url}
                                            </p>
                                        </div>
                                        <a
                                            href={selectedMedia.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                                        >
                                            Open in New Tab
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
};

export default AppUsers;
