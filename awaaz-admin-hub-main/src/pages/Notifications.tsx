import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { motion } from "framer-motion";
import { Bell, Check, MessageSquare, UserPlus, AlertCircle, Send, MapPin, Wifi, Trash, RefreshCw, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
interface AdminNotification {
  _id: string;
  title: string;
  message: string;
  type: 'INFO' | 'ALERT' | 'WARNING' | 'PROMOTION';
  imageUrl?: string | null;
  deepLink?: string | null;
  sentBy: {
    _id: string;
    name: string;
    email: string;
  };
  sentAt: string;
  status: 'PENDING' | 'SENT' | 'PARTIAL_FAILED' | 'FAILED';
  totalUsers: number;
  deliveredUsers: number;
  failedUsers: number;
  deliveryCompletedAt?: string;
}

interface NotificationStats {
  total: number;
  sent: number;
  partialFailed: number;
  failed: number;
  pending: number;
  totalUsers: number;
  totalDelivered: number;
}

const iconMap = {
  INFO: Bell,
  ALERT: AlertCircle,
  WARNING: AlertCircle,
  PROMOTION: Send,
} as const;

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SENT: 'bg-green-100 text-green-800',
  PARTIAL_FAILED: 'bg-orange-100 text-orange-800',
  FAILED: 'bg-red-100 text-red-800',
} as const;

const Notifications = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<'INFO' | 'ALERT' | 'WARNING' | 'PROMOTION'>('INFO');
  const [imageUrl, setImageUrl] = useState("");
  const [deepLink, setDeepLink] = useState("");
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('adminToken');
  };

  // Fetch notifications list
  const { data: notificationsData, isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery({
    queryKey: ['admin-notifications', page, statusFilter, typeFilter],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error('No auth token found');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: statusFilter,
        type: typeFilter,
      });

      const response = await fetch(`http://localhost:5000/admin/v1/notification/list?${params}`, {
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

  // Fetch notification statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error('No auth token found');

      const response = await fetch('http://localhost:5000/admin/v1/notification/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      return data.data as NotificationStats;
    },
    enabled: !!getAuthToken(),
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (notificationData: {
      title: string;
      message: string;
      type: string;
      imageUrl?: string;
      deepLink?: string;
    }) => {
      const token = getAuthToken();
      if (!token) throw new Error('No auth token found');

      const response = await fetch('http://localhost:5000/admin/v1/notification/send-global', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send notification');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Notification sent successfully to ${data.data.totalUsers} users`);
      setTitle("");
      setMessage("");
      setImageUrl("");
      setDeepLink("");
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send notification: ${error.message}`);
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const token = getAuthToken();
      if (!token) throw new Error('No auth token found');

      const response = await fetch(`http://localhost:5000/admin/v1/notification/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Notification deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete notification: ${error.message}`);
    },
  });

  const handleSend = () => {
    if (!title || !message) {
      toast.error("Please provide title and message");
      return;
    }

    sendNotificationMutation.mutate({
      title,
      message,
      type,
      imageUrl: imageUrl || null,
      deepLink: deepLink || null,
    });
  };

  const deleteNotification = (id: string) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      deleteNotificationMutation.mutate(id);
    }
  };

  return (
    <AdminLayout title="Notifications">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">Global notifications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successfully Delivered</CardTitle>
              <Check className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.sent || 0}</div>
              <p className="text-xs text-muted-foreground">{stats?.totalDelivered || 0} users reached</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partial Failed</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats?.partialFailed || 0}</div>
              <p className="text-xs text-muted-foreground">Some deliveries failed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Active users</p>
            </CardContent>
          </Card>
        </div>

        {/* Send New Notification */}
        <Card>
          <CardHeader>
            <CardTitle>Send Global Notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter notification title"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={type} onValueChange={(value: any) => setType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="ALERT">Alert</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="PROMOTION">Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter notification message"
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Image URL (Optional)</label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Deep Link (Optional)</label>
                <Input
                  value={deepLink}
                  onChange={(e) => setDeepLink(e.target.value)}
                  placeholder="notifications/123"
                />
              </div>
            </div>

            <Button 
              onClick={handleSend}
              disabled={sendNotificationMutation.isPending || !title || !message}
              className="w-full"
            >
              {sendNotificationMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Global Notification
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Notification History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label className="text-sm font-medium">Status Filter</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="PARTIAL_FAILED">Partial Failed</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">Type Filter</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="ALERT">Alert</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="PROMOTION">Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => refetchNotifications()}
                  disabled={notificationsLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${notificationsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
              {notificationsLoading ? (
                <div className="text-center py-8">Loading notifications...</div>
              ) : notificationsData?.notifications?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No notifications found
                </div>
              ) : (
                notificationsData?.notifications?.map((notification: AdminNotification) => {
                  const Icon = iconMap[notification.type];
                  return (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-xl border bg-card p-4 shadow-card transition-all hover:shadow-elevated"
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
                              <h3 className="font-semibold">{notification.title}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[notification.status]}`}>
                                {notification.status}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Type: {notification.type}</span>
                              <span>Sent by: {notification.sentBy?.name}</span>
                              <span>{formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true })}</span>
                            </div>
                            {notification.totalUsers > 0 && (
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                <span>Users: {notification.totalUsers}</span>
                                <span className="text-green-600">Delivered: {notification.deliveredUsers}</span>
                                {notification.failedUsers > 0 && (
                                  <span className="text-red-600">Failed: {notification.failedUsers}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification._id)}
                          disabled={deleteNotificationMutation.isPending}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
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
    </AdminLayout>
  );
};

export default Notifications;
