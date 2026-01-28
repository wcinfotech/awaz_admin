import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { motion } from "framer-motion";
import { Bell, Check, MessageSquare, UserPlus, AlertCircle, Send, MapPin, Wifi, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { NotificationRecord } from "@/lib/storage";

const iconMap = {
  user: UserPlus,
  system: Bell,
  feedback: MessageSquare,
  alert: AlertCircle,
};

const Notifications = () => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [title, setTitle] = useState("");
  const [radius, setRadius] = useState<number | string>(5);
  const [lat, setLat] = useState<number | string>(0);
  const [lon, setLon] = useState<number | string>(0);
  const [message, setMessage] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [adminToken, setAdminToken] = useState<string | null>(null);

  useEffect(() => {
    let m: any;
    import("@/lib/storage").then((mod) => {
      m = mod;
      const load = () => setNotifications(m.loadNotifications() || []);
      load();
      setAdminToken(m.loadAdminFcmToken());
      const handler = () => load();
      window.addEventListener("awaaz-notifications-changed", handler);
      window.addEventListener("awaaz-admin-fcm-changed", () => setAdminToken(m.loadAdminFcmToken()));
      return () => {
        window.removeEventListener("awaaz-notifications-changed", handler);
      };
    });
  }, []);

  const handleSend = async () => {
    if (!title || !message) return toast.error("Please provide title and message");
    const m = await import("@/lib/storage");
    const notif: NotificationRecord = {
      id: `notif-${Date.now()}`,
      to: "all",
      subject: title,
      body: message,
      createdAt: new Date().toISOString(),
      seen: false,
    };
    m.addNotification(notif);
    toast.success("Notification sent (simulated)");
    setTitle("");
    setMessage("");
  };

  const handleUpdateToken = async () => {
    if (!tokenInput) return toast.error("Paste a token first");
    const m = await import("@/lib/storage");
    m.saveAdminFcmToken(tokenInput);
    setAdminToken(tokenInput);
    setTokenInput("");
    toast.success("FCM token saved (demo)");
  };

  const handleMarkAllRead = async () => {
    const m = await import("@/lib/storage");
    m.markAllNotificationsRead();
    toast.success("All notifications marked read");
  };

  const markAsRead = async (id: string) => {
    const m = await import("@/lib/storage");
    m.updateNotification(id, { seen: true });
  };

  const deleteNotif = async (id: string) => {
    const m = await import("@/lib/storage");
    m.deleteNotification(id);
    toast.success("Notification deleted");
  };

  const health = { registered: !!adminToken, updatedAt: adminToken ? new Date().toLocaleDateString() : undefined } as const;

  return (
    <AdminLayout title="Notifications">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Geo-based Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Input placeholder="Title" value={title} onChange={(e) => setTitle((e.target as HTMLInputElement).value)} />
                <Input placeholder="Target radius (km)" value={String(radius)} onChange={(e) => setRadius(Number((e.target as HTMLInputElement).value))} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input placeholder="Latitude" value={String(lat)} onChange={(e) => setLat(Number((e.target as HTMLInputElement).value))} />
                <Input placeholder="Longitude" value={String(lon)} onChange={(e) => setLon(Number((e.target as HTMLInputElement).value))} />
              </div>
              <Textarea rows={4} placeholder="Message body" value={message} onChange={(e) => setMessage((e.target as HTMLTextAreaElement).value)} />
              <div className="flex gap-2">
                <Button className="gap-2" onClick={handleSend}>
                  <Send className="h-4 w-4" />
                  Send Notification
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => toast.info("Attach media")}>
                  <MapPin className="h-4 w-4" />
                  Attach Region
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin FCM Token</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                Status: {health?.registered ? "Registered" : "Not registered"}
                {health?.updatedAt && <div className="text-xs">Updated: {health.updatedAt}</div>}
              </div>
              <Input placeholder="Paste FCM token" value={tokenInput} onChange={(e) => setTokenInput((e.target as HTMLInputElement).value)} />
              <Button variant="secondary" className="gap-2" onClick={handleUpdateToken}>
                <Wifi className="h-4 w-4" />
                Update Token
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Recent activity notifications</p>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAllRead}>
            <Check className="h-4 w-4" />
            Mark all read
          </Button>
        </div>

        <div className="space-y-3">
          {notifications.map((notification, index) => {
            const Icon = iconMap[(notification as any).type as keyof typeof iconMap] || Bell;
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`rounded-xl border bg-card p-4 shadow-card transition-all hover:shadow-elevated ${!notification.seen ? "border-primary/30 bg-primary/5" : "border-border"}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${!notification.seen ? "bg-primary/20" : "bg-muted"}`}>
                  <Icon className={`h-5 w-5 ${!notification.seen ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">{notification.subject}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                    </div>

                    <div className="flex items-start gap-2">
                      {!notification.seen && (
                        <button onClick={() => markAsRead(notification.id)} className="h-2 w-2 rounded-full bg-primary" aria-label="Mark read" />
                      )}
                      <button onClick={() => deleteNotif(notification.id)} className="text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default Notifications;
