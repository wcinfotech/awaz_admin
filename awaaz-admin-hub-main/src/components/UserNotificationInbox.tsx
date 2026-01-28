import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check, X, ExternalLink, RefreshCw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
interface UserNotification {
  _id: string;
  userId: string;
  notificationId: string;
  title: string;
  message: string;
  type: 'INFO' | 'ALERT' | 'WARNING' | 'PROMOTION';
  isRead: boolean;
  deliveredAt: string | null;
  pushStatus: 'PENDING' | 'DELIVERED' | 'FAILED';
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface UnreadCount {
  unread: number;
  total: number;
}

const iconMap = {
  INFO: Bell,
  ALERT: X,
  WARNING: X,
  PROMOTION: Bell,
} as const;

const typeColors = {
  INFO: 'bg-blue-100 text-blue-800',
  ALERT: 'bg-red-100 text-red-800',
  WARNING: 'bg-orange-100 text-orange-800',
  PROMOTION: 'bg-purple-100 text-purple-800',
} as const;

const UserNotificationInbox = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('userToken');
  };

  // Fetch user notifications
  const { data: notificationsData, isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery({
    queryKey: ['user-notifications', page, filter],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error('No auth token found');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        filter,
      });

      const response = await fetch(`http://localhost:5000/api/v1/user/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!getAuthToken(),
  });

  // Fetch unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error('No auth token found');

      const response = await fetch('http://localhost:5000/api/v1/user/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const data = await response.json();
      return data.data as UnreadCount;
    },
    enabled: !!getAuthToken(),
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const token = getAuthToken();
      if (!token) throw new Error('No auth token found');

      const response = await fetch(`http://localhost:5000/api/v1/user/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark as read: ${error.message}`);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error('No auth token found');

      const response = await fetch('http://localhost:5000/api/v1/user/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Marked ${data.data.markedCount} notifications as read`);
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark all as read: ${error.message}`);
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount?.unread > 0) {
      markAllAsReadMutation.mutate();
    }
  };

  const handleNotificationClick = (notification: UserNotification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    // Handle deep link navigation if needed
    if (notification.notificationId) {
      // Navigate to notification details or deep link
      console.log('Navigate to:', notification.notificationId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                  {unreadCount?.unread > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {unreadCount.unread} unread
                    </span>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {unreadCount?.total || 0} total notifications
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount?.unread > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    disabled={markAllAsReadMutation.isPending}
                  >
                    {markAllAsReadMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Marking...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Mark All Read
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchNotifications()}
                  disabled={notificationsLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${notificationsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filter:</span>
              </div>
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
              {notificationsLoading ? (
                <div className="text-center py-8">Loading notifications...</div>
              ) : notificationsData?.notifications?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications found'}
                </div>
              ) : (
                notificationsData?.notifications?.map((notification: UserNotification) => {
                  const Icon = iconMap[notification.type];
                  return (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`rounded-xl border bg-card p-4 shadow-card transition-all hover:shadow-elevated cursor-pointer ${
                        !notification.isRead ? 'border-primary/30 bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${
                            notification.type === 'INFO' ? 'bg-blue-100' :
                            notification.type === 'ALERT' ? 'bg-red-100' :
                            notification.type === 'WARNING' ? 'bg-orange-100' :
                            'bg-purple-100'
                          }`}>
                            <Icon className={`h-5 w-5 ${
                              notification.type === 'INFO' ? 'text-blue-600' :
                              notification.type === 'ALERT' ? 'text-red-600' :
                              notification.type === 'WARNING' ? 'text-orange-600' :
                              'text-purple-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-semibold ${!notification.isRead ? 'text-primary' : ''}`}>
                                {notification.title}
                              </h3>
                              {!notification.isRead && (
                                <span className="w-2 h-2 bg-primary rounded-full"></span>
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[notification.type]}`}>
                                {notification.type}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                              {notification.deliveredAt && (
                                <span className="text-green-600">Delivered</span>
                              )}
                              {notification.pushStatus === 'FAILED' && (
                                <span className="text-red-600">Delivery failed</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification._id);
                              }}
                              disabled={markAsReadMutation.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {notificationsData?.pagination && notificationsData.pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {notificationsData.pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(notificationsData.pagination.pages, p + 1))}
                  disabled={page === notificationsData.pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UserNotificationInbox;
