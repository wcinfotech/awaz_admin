import { AdminLayout } from "@/components/layout/AdminLayout";
import { FileText, UserX, MessageCircleWarning, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// Debug: Check if mock mode is enabled
const useMock = (import.meta.env.VITE_USE_MOCK_API || "false").toLowerCase() === "true";
console.log('🔧 Mock Mode Enabled:', useMock);
console.log('🔧 API URL:', import.meta.env.VITE_API_URL || "http://localhost:5000");

// Check authentication
const stored = localStorage.getItem("awaaz-admin-auth");
console.log('🔐 Stored Auth:', stored ? 'Present' : 'Missing');
if (stored) {
  try {
    const parsed = JSON.parse(stored);
    console.log('🔐 Token Present:', !!parsed.token);
  } catch (e) {
    console.log('🔐 Auth Parse Error');
  }
}

interface ReportRow {
  id: string;
  type: "POST" | "COMMENT" | "USER";
  reason: string;
  status: "OPEN" | "RESOLVED";
  createdAt: string;
  targetId?: string;
  targetUserEmail?: string;
  remarks?: any[];
  warnings?: any[];
  resolvedBy?: "user" | "admin";
  resolvedAt?: string;
  reportedCounts?: number;
  postImage?: string;
  thumbnail?: string;
  reports?: any[];
  // Comment-specific fields
  comment?: string;
  commentedUserName?: string;
  commentedUserImage?: string;
  postId?: string;
  reportCount?: number;
  reportedUsers?: any[];
  // Report ID for deletion (different from display ID for comments)
  reportId?: string;
  // Comment reply ID for validation (required for deletion)
  commentReplyId?: string;
  // User-specific fields
  reportedUserName?: string;
  reportedUserProfilePicture?: string;
  isBlocked?: boolean;
}

const statusStyles = {
  OPEN: "bg-warning/10 text-warning border-warning/30",
  RESOLVED: "bg-success/10 text-success border-success/30",
  DISMISSED: "bg-muted text-muted-foreground border-muted",
};

const iconMap = {
  POST: FileText,
  USER: UserX,
  COMMENT: MessageCircleWarning,
};

const Reports = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab state
  const mapQueryToTab = (q?: string) => {
    if (!q) return "ALL" as const;
    const v = q.toLowerCase();
    if (v === "post") return "POST" as const;
    if (v === "comment") return "COMMENT" as const;
    if (v === "profile" || v === "user") return "USER" as const;
    if (v === "resolved") return "RESOLVED" as const;
    return "ALL" as const;
  };

  const [tab, setTab] = useState<"ALL" | "POST" | "COMMENT" | "USER" | "RESOLVED">(() => {
    try {
      return mapQueryToTab(new URLSearchParams(window.location.search).get("tab") || undefined);
    } catch {
      return "ALL";
    }
  });

  // Modal state
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // React Query hooks for fetching reports
  const { data: postReports = [], isLoading: isLoadingPostReports } = useQuery({
    queryKey: ["reports", "post"],
    queryFn: async () => {
      try {
        console.log('🔍 Making API call to: /admin/v1/report/post-list');
        const response = await api.get("/admin/v1/report/post-list");
        console.log('🔍 Post reports response:', response.data);
        console.log('🔍 Post reports body:', response.data?.body);
        console.log('🔍 Post reports data:', response.data?.data);

        // Backend returns data in 'body' field, not 'data' field
        const reports = response.data?.body || response.data?.data || [];
        console.log('🔍 Raw reports array:', reports);
        console.log('🔍 Reports array length:', reports.length);

        const transformed = reports.map((report: any) => ({
          id: report.postId,
          type: "POST" as const,
          reason: report.latestReportedReason || "No reason provided",
          status: "OPEN",
          createdAt: new Date().toISOString(),
          targetId: report.postId,
          reportedCounts: report.reportedCounts || 0,
          postImage: report.postImage,
          thumbnail: report.thumbnail,
          reports: report.reports || [],
        }));
        console.log('🔍 Transformed post reports:', transformed);
        console.log('🔍 Transformed post reports length:', transformed.length);
        return transformed;
      } catch (error) {
        console.error('❌ Error fetching post reports:', error);
        console.error('❌ Error details:', error.response?.data || error.message);
        return [];
      }
    },
  });

  const { data: commentReports = [], isLoading: isLoadingCommentReports } = useQuery({
    queryKey: ["reports", "comment"],
    queryFn: async () => {
      try {
        console.log('🔍 Making API call to: /admin/v1/report/comment-list');
        const response = await api.get("/admin/v1/report/comment-list");
        console.log('🔍 Comment reports response:', response.data);
        console.log('🔍 Comment reports body:', response.data?.body);
        console.log('🔍 Comment reports data:', response.data?.data);

        // Comment API returns posts with reported comments, not individual comments
        let postsWithReportedComments = [];
        if (response.data?.body?.data) {
          postsWithReportedComments = response.data.body.data; // Posts with reported comments
        } else if (response.data?.body) {
          postsWithReportedComments = response.data.body;
        } else if (response.data?.data) {
          postsWithReportedComments = response.data.data;
        }

        console.log('🔍 Posts with reported comments:', postsWithReportedComments);
        console.log('🔍 Posts count:', postsWithReportedComments.length);

        // Transform each reported comment into a report row
        const transformed = postsWithReportedComments.flatMap((post: any) => {
          return post.reports.map((commentReport: any) => ({
            id: commentReport.commentId, // Use commentId for display
            type: "COMMENT" as const,
            reason: commentReport.reason || "No reason provided",
            status: "OPEN",
            createdAt: commentReport.timestamp || new Date().toISOString(),
            targetId: commentReport.commentId,
            // Additional comment-specific data
            comment: commentReport.comment,
            commentedUserName: commentReport.commentedUserName,
            commentedUserImage: commentReport.commentedUserImage,
            postId: post.postId,
            postImage: post.postImage,
            thumbnail: post.thumbnail,
            reportCount: commentReport.reportCount,
            reportedUsers: commentReport.reportedUsers || [],
            // Store the actual report ID for deletion
            reportId: commentReport.reportId, // This is the actual report ID from the database
            // Store commentReplyId for validation
            commentReplyId: commentReport.commentReplyId, // This determines if we can delete
          }));
        });

        console.log('🔍 Transformed comment reports:', transformed);
        console.log('🔍 Transformed comment reports length:', transformed.length);
        return transformed;
      } catch (error) {
        console.error('❌ Error fetching comment reports:', error);
        console.error('❌ Error details:', error.response?.data || error.message);
        return [];
      }
    },
  });

  const { data: userReports = [], isLoading: isLoadingUserReports } = useQuery({
    queryKey: ["reports", "user"],
    queryFn: async () => {
      try {
        console.log('🔍 Making API call to: /admin/v1/report/user-list');
        const response = await api.get("/admin/v1/report/user-list");
        console.log('🔍 User reports response:', response.data);
        console.log('🔍 User reports body:', response.data?.body);
        console.log('🔍 User reports data:', response.data?.data);

        // Backend returns data in 'body' field, not 'data' field
        const reports = response.data?.body || response.data?.data || [];
        console.log('🔍 Raw user reports array:', reports);
        console.log('🔍 User reports array length:', reports.length);

        // Transform each reported user into a report row
        const transformed = reports.map((report: any) => ({
          id: report.reportedUserId,
          type: "USER" as const,
          reason: report.reports?.[0]?.reason || "No reason provided",
          status: "OPEN",
          createdAt: new Date().toISOString(),
          targetId: report.reportedUserId,
          targetUserEmail: report.reportedUserEmail,
          reports: report.reports || [],
          // User-specific data
          reportedUserName: report.reportedUserName,
          reportedUserProfilePicture: report.reportedUserProfilePicture,
          isBlocked: report.isBlocked, // User block status
          reportedCounts: report.reportedCounts,
        }));
        console.log('🔍 Transformed user reports:', transformed);
        console.log('🔍 Transformed user reports length:', transformed.length);
        return transformed;
      } catch (error) {
        console.error('❌ Error fetching user reports:', error);
        console.error('❌ Error details:', error.response?.data || error.message);
        return [];
      }
    },
  });

  // Mutation for updating report status
  const updateReportStatusMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      const response = await api.put(`/admin/v1/report/status/${status}/${reportId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Report status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update report status");
    },
  });

  // Mutation for deleting comment
  const deleteCommentMutation = useMutation({
    mutationFn: async (report: ReportRow) => {
      // For comments, use the actual reportId from the database
      const actualReportId = report.type === "COMMENT" ? report.reportId : report.id;

      // Determine if this is a parent comment or comment reply
      const isCommentReply = !!report.commentReplyId;

      console.log('🔍 Deleting comment with data:', {
        reportType: isCommentReply ? "comment-reply" : "comment",
        reportId: actualReportId,
        postId: report.postId,
        commentId: report.id,
        commentReplyId: isCommentReply ? report.commentReplyId : undefined
      });

      const response = await api.delete("/admin/v1/report/delete-comment", {
        data: {
          reportType: isCommentReply ? "comment-reply" : "comment",
          reportId: actualReportId,
          postId: report.postId || "",
          commentId: report.id,
          commentReplyId: isCommentReply ? report.commentReplyId : undefined
        }
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Comment deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: any) => {
      console.error('❌ Delete comment error:', error.response?.data);
      toast.error(error.response?.data?.message || "Failed to delete comment");
    },
  });

  // Mutation for deleting post
  const deletePostMutation = useMutation({
    mutationFn: async (report: ReportRow) => {
      console.log('🔍 Deleting post with ID:', report.targetId);
      console.log('🔍 Full report data:', report);

      try {
        // Use the correct event-post delete endpoint
        const response = await api.delete(`/admin/v1/event-post/${report.targetId}`);
        console.log('✅ Delete post response:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Delete post API error:', error);
        console.error('❌ Error response:', error.response);
        console.error('❌ Error status:', error.response?.status);
        console.error('❌ Error data:', error.response?.data);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('✅ Delete post success:', data);
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: any) => {
      console.error('❌ Delete post mutation error:', error);
      console.error('❌ Full error object:', error);
      console.error('❌ Error response data:', error.response?.data);

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to delete post";

      toast.error(errorMessage);
    },
  });

  // Mutation for blocking/unblocking user
  const blockUserMutation = useMutation({
    mutationFn: async (report: ReportRow) => {
      console.log('🔍 Toggling user block status for user ID:', report.targetId);
      console.log('🔍 Full report data:', report);

      try {
        // Use the block-app-user endpoint
        const response = await api.put(`/admin/v1/user/block-app-user/${report.targetId}`);
        console.log('✅ Block/unblock user response:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Block/unblock user API error:', error);
        console.error('❌ Error response:', error.response);
        console.error('❌ Error status:', error.response?.status);
        console.error('❌ Error data:', error.response?.data);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('✅ Block/unblock user success:', data);
      const message = data.message || "User status updated successfully";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: any) => {
      console.error('❌ Block/unblock user mutation error:', error);
      console.error('❌ Full error object:', error);
      console.error('❌ Error response data:', error.response?.data);

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to update user status";

      toast.error(errorMessage);
    },
  });

  // Combine all reports
  const allReports = useMemo(() => {
    const combined = [...postReports, ...commentReports, ...userReports];
    console.log('🔍 Combined all reports:', combined);
    console.log('🔍 Post reports count:', postReports.length);
    console.log('🔍 Comment reports count:', commentReports.length);
    console.log('🔍 User reports count:', userReports.length);
    return combined;
  }, [postReports, commentReports, userReports]);

  // Filter reports based on selected tab
  const filteredReports = useMemo(() => {
    console.log('🔍 Current tab:', tab);
    console.log('🔍 All reports before filtering:', allReports);

    let filtered = [];
    if (tab === "ALL") {
      filtered = allReports;
    } else if (tab === "RESOLVED") {
      filtered = allReports.filter(r => r.status === "RESOLVED");
    } else {
      filtered = allReports.filter(r => r.type === tab);
    }

    console.log('🔍 Filtered reports:', filtered);
    console.log('🔍 Filtered reports count:', filtered.length);
    return filtered;
  }, [allReports, tab]);

  const isLoading = isLoadingPostReports || isLoadingCommentReports || isLoadingUserReports;

  // URL sync
  const updateTabInUrl = (t: "ALL" | "POST" | "COMMENT" | "USER" | "RESOLVED") => {
    const params = new URLSearchParams(location.search);
    if (t === "ALL") {
      params.delete("tab");
    } else if (t === "POST") {
      params.set("tab", "post");
    } else if (t === "COMMENT") {
      params.set("tab", "comment");
    } else if (t === "USER") {
      params.set("tab", "profile");
    } else if (t === "RESOLVED") {
      params.set("tab", "resolved");
    }
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : "" }, { replace: true });
  };

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("tab") || undefined;
    const mapped = mapQueryToTab(q);
    setTab(mapped);
  }, [location.search]);

  useEffect(() => {
    updateTabInUrl(tab);
  }, [tab]);

  // Action handlers
  const handleResolve = (reportId: string) => {
    updateReportStatusMutation.mutate({ reportId, status: "approved" });
  };

  const handleDismiss = (reportId: string) => {
    updateReportStatusMutation.mutate({ reportId, status: "rejected" });
  };

  const handleUserResolved = (reportId: string) => {
    updateReportStatusMutation.mutate({ reportId, status: "approved" });
  };

  const handleDeletePost = (report: ReportRow) => {
    if (window.confirm(`Are you sure you want to delete this post? This action cannot be undone.`)) {
      deletePostMutation.mutate(report);
    }
  };

  const handleDeleteComment = (report: ReportRow) => {
    // For parent comments (commentReplyId is null), we can delete with reportType: "comment"
    // For comment replies (commentReplyId exists), we need reportType: "comment-reply"

    if (window.confirm(`Are you sure you want to delete this ${report.commentReplyId ? 'comment reply' : 'comment'}? This action cannot be undone.`)) {
      deleteCommentMutation.mutate(report);
    }
  };

  const handleBlockUser = (report: ReportRow) => {
    const action = report.isBlocked ? "unblock" : "block";
    if (window.confirm(`Are you sure you want to ${action} this user? This action can be reversed later.`)) {
      blockUserMutation.mutate(report);
    }
  };

  const openReportModal = (row: ReportRow) => {
    setSelectedReport(row);
    setIsModalOpen(true);
  };

  const closeReportModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  return (
    <AdminLayout title="Reports">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports</h1>
          <p className="text-white/60 mt-2">Manage reported content and user profiles</p>
        </div>

        {/* Debug Info */}
        {/* <div className="bg-muted/10 p-3 rounded-lg text-xs text-white/60">
          <p>🔍 Debug Info:</p>
          <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
          <p>Current Tab: {tab}</p>
          <p>All Reports Count: {allReports.length}</p>
          <p>Filtered Reports Count: {filteredReports.length}</p>
          <p>Post Reports: {postReports.length}</p>
          <p>Comment Reports: {commentReports.length}</p>
          <p>User Reports: {userReports.length}</p>
        </div> */}

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted/10 p-1 rounded-lg w-fit">
          {(["ALL", "POST", "COMMENT", "USER", "RESOLVED"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
            >
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card border border-white/10 rounded-xl">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-white">Type</TableHead>
                <TableHead className="text-white">Reason</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Created</TableHead>
                <TableHead className="text-white text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-white/60 py-8">
                    Loading reports...
                  </TableCell>
                </TableRow>
              ) : filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-white/60 py-8">
                    No reports found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((row, index) => {
                  const Icon = iconMap[row.type];
                  // Ensure unique key by combining id and index as fallback
                  const uniqueKey = row.id ? `${row.id}-${row.type}` : `${row.type}-${index}`;
                  return (
                    <TableRow key={uniqueKey} className="border-white/10">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-white/60" />
                          <span className="text-white">{row.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/80 max-w-xs truncate">
                        {row.reason}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusStyles[row.status]}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white/60">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openReportModal(row)}
                            className="text-white/60 hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {row.status === "OPEN" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResolve(row.id)}
                                className="text-green-400 hover:text-green-300"
                              >
                                Resolve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDismiss(row.id)}
                                className="text-orange-400 hover:text-orange-300"
                              >
                                Dismiss
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUserResolved(row.id)}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                User Resolved
                              </Button>
                              {row.type === "POST" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePost(row)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  Delete Post
                                </Button>
                              )}
                              {row.type === "COMMENT" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteComment(row)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  Delete Comment
                                </Button>
                              )}
                              {row.type === "USER" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleBlockUser(row)}
                                  className={row.isBlocked ? "text-green-400 hover:text-green-300" : "text-orange-400 hover:text-orange-300"}
                                >
                                  {row.isBlocked ? "Unblock User" : "Block User"}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Report Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl bg-card border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Report Details</DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60">Type</label>
                    <p className="text-white font-medium">{selectedReport.type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Status</label>
                    <Badge className={statusStyles[selectedReport.status]}>
                      {selectedReport.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Reason</label>
                    <p className="text-white">{selectedReport.reason}</p>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Created</label>
                    <p className="text-white">{new Date(selectedReport.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedReport.postImage && (
                  <div>
                    <label className="text-sm text-white/60">Reported Content</label>
                    <img
                      src={selectedReport.postImage}
                      alt="Reported content"
                      className="mt-2 rounded-lg max-w-full h-auto max-h-64 object-cover"
                    />
                  </div>
                )}

                {/* Comment-specific information */}
                {selectedReport.type === "COMMENT" && selectedReport.comment && (
                  <div>
                    <label className="text-sm text-white/60">Reported Comment</label>
                    <div className="mt-2 bg-muted/10 p-3 rounded-lg">
                      <p className="text-white/80">{selectedReport.comment}</p>
                      {selectedReport.commentedUserName && (
                        <p className="text-white/60 text-sm mt-2">
                          Comment by: {selectedReport.commentedUserName}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedReport.reports && selectedReport.reports.length > 0 && (
                  <div>
                    <label className="text-sm text-white/60">Report Details</label>
                    <div className="mt-2 space-y-2">
                      {selectedReport.reports.map((report: any, index: number) => (
                        <div key={`${selectedReport.id}-report-${index}`} className="bg-muted/10 p-3 rounded-lg">
                          <p className="text-white/80 text-sm">{report.reason}</p>
                          {report.name && (
                            <p className="text-white/60 text-xs mt-1">Reported by: {report.name}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* User-specific information */}
                {selectedReport.type === "USER" && (
                  <div>
                    <label className="text-sm text-white/60">User Information</label>
                    <div className="mt-2 bg-muted/10 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        {selectedReport.reportedUserProfilePicture && (
                          <img
                            src={selectedReport.reportedUserProfilePicture}
                            alt={selectedReport.reportedUserName || "User"}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="text-white font-medium">{selectedReport.reportedUserName || "Unknown User"}</p>
                          {selectedReport.targetUserEmail && (
                            <p className="text-white/60 text-sm">{selectedReport.targetUserEmail}</p>
                          )}
                          <div className="mt-1">
                            <Badge className={selectedReport.isBlocked ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}>
                              {selectedReport.isBlocked ? "Blocked" : "Active"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comment-specific reported users */}
                {selectedReport.type === "COMMENT" && selectedReport.reportedUsers && selectedReport.reportedUsers.length > 0 && (
                  <div>
                    <label className="text-sm text-white/60">Reported By Users</label>
                    <div className="mt-2 space-y-2">
                      {selectedReport.reportedUsers.map((user: any, index: number) => (
                        <div key={`${selectedReport.id}-user-${index}`} className="bg-muted/10 p-3 rounded-lg flex items-center gap-3">
                          {user.profilePicture && (
                            <img
                              src={user.profilePicture}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <p className="text-white/80 text-sm font-medium">{user.name}</p>
                            <p className="text-white/60 text-xs">{user.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Reports;