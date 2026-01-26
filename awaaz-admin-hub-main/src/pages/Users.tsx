import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Plus, Filter, Mail } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import api from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "moderator" | "user";
  status: "active" | "pending" | "inactive";
  joinedDate?: string; // fallback for demo data
  joinedAt?: string; // real data from storage
  blockedBy?: "admin" | "auto";
  blockedAt?: string;
}

const fallbackUsers: User[] = [
  {
    id: "1",
    name: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    role: "admin",
    status: "active",
    joinedDate: "Jan 5, 2026",
  },
  {
    id: "2",
    name: "Priya Patel",
    email: "priya.patel@example.com",
    role: "moderator",
    status: "active",
    joinedDate: "Jan 4, 2026",
  },
  {
    id: "3",
    name: "Amit Singh",
    email: "amit.singh@example.com",
    role: "user",
    status: "pending",
    joinedDate: "Jan 3, 2026",
  },
  {
    id: "4",
    name: "Neha Gupta",
    email: "neha.gupta@example.com",
    role: "user",
    status: "active",
    joinedDate: "Jan 2, 2026",
  },
  {
    id: "5",
    name: "Vikram Kumar",
    email: "vikram.kumar@example.com",
    role: "user",
    status: "inactive",
    joinedDate: "Jan 1, 2026",
  },
  {
    id: "6",
    name: "Anita Desai",
    email: "anita.desai@example.com",
    role: "moderator",
    status: "active",
    joinedDate: "Dec 28, 2025",
  },
  {
    id: "7",
    name: "Rajesh Mehta",
    email: "rajesh.mehta@example.com",
    role: "user",
    status: "active",
    joinedDate: "Dec 25, 2025",
  },
  {
    id: "8",
    name: "Sonia Kapoor",
    email: "sonia.kapoor@example.com",
    role: "user",
    status: "pending",
    joinedDate: "Dec 22, 2025",
  },
];

const statusStyles = {
  active: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  inactive: "bg-muted text-muted-foreground border-muted",
};

const roleStyles = {
  admin: "bg-primary/10 text-primary border-primary/20",
  moderator: "bg-accent/10 text-accent border-accent/20",
  user: "bg-secondary text-secondary-foreground border-border",
};

const Users = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showBlockedOnly, setShowBlockedOnly] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [userReports, setUserReports] = useState<any[]>([]);

  const [users, setUsers] = useState<User[]>(fallbackUsers);

  // Read URL search params to support sidebar tabs like ?tab=block
  const [searchParams] = useSearchParams();
  const isBlockTab = searchParams.get("tab") === "block";
  const pageTitle = isBlockTab ? "Blocked Users" : "Users";

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/v1/user/app-users/all", { params: { limit: 200 } });
      const list = res?.data?.body?.data?.data || [];
      const mapped: User[] = list.map((u: any) => ({
        id: u._id,
        name: u.name || u.username || "User",
        email: u.username || u._id,
        role: "user",
        status: u.isBlocked ? "inactive" : "active",
        joinedAt: u.createdAt,
        blockedAt: u.isBlocked ? new Date().toISOString() : undefined,
        blockedBy: u.isBlocked ? "admin" : undefined,
      }));
      setUsers(mapped);
    } catch (err: any) {
      toast.error("Failed to load users", { description: err?.response?.data?.message || err?.message });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(
    () =>
      users
        .filter(
          (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter((u) => (isBlockTab ? !!u.blockedAt : showBlockedOnly ? !!u.blockedAt : true)),
    [users, searchQuery, showBlockedOnly, isBlockTab]
  );

  const handleAddUser = () => {
    toast.info("Add User", { description: "Hook this button to a create-user API." });
  };

  return (
    <AdminLayout title={pageTitle}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-muted-foreground">
              {isBlockTab ? 'Blocked user accounts' : 'Manage and monitor user accounts'}
            </p>
            {isBlockTab ? (
              <p className="text-sm text-destructive mt-1">Blocked users: {users.filter((u) => u.blockedAt).length}</p>
            ) : users.filter((u) => u.blockedAt).length ? (
              <p className="text-sm text-destructive mt-1">Blocked: {users.filter((u) => u.blockedAt).length}</p>
            ) : null}
          </div>
          <Button className="gap-2" onClick={handleAddUser}>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {!isBlockTab && (
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => setShowBlockedOnly((s) => !s)}>
                <Filter className="h-4 w-4" />
                {showBlockedOnly ? "Showing blocked" : "Filters"}
              </Button>
              {showBlockedOnly ? (
                <Button className="gap-2" onClick={() => setShowBlockedOnly(false)}>
                  Show all
                </Button>
              ) : null}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="border-b border-border transition-colors hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {user.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleStyles[user.role]}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={user.blockedAt ? 'bg-destructive/10 text-destructive border-destructive/20' : statusStyles[user.status]}>{user.blockedAt ? 'blocked' : user.status}</Badge>
                    {user.blockedAt ? <div className="text-xs text-destructive mt-1">Blocked {user.blockedBy ? `(${user.blockedBy})` : ''}</div> : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.joinedDate ?? (user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : "-")}
                    {user.blockedAt ? <div className="text-xs text-destructive mt-1">Blocked {user.blockedBy === "auto" ? "(auto)" : "(admin)"} on {new Date(user.blockedAt).toLocaleDateString()}</div> : null}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={async () => {
                          const m = await import("@/lib/storage");
                          const allPosts = m.loadPosts() || [];
                          const ev = m.loadEvents() || [];
                          const reports = m.loadReports() || [];
                          const postsFor = allPosts.filter((p: any) => (p.user && p.user.toLowerCase() === user.name.toLowerCase()) || (p.email && p.email.toLowerCase() === user.email.toLowerCase()));
                          const eventsFor = ev.filter((e: any) => (e.user && e.user.toLowerCase() === user.name.toLowerCase()) || (e.email && e.email.toLowerCase() === user.email.toLowerCase()));
                          const reportsFor = reports.filter((r: any) => r.targetUserEmail && r.targetUserEmail.toLowerCase() === user.email.toLowerCase());
                          setSelectedUser(user); setUserPosts(postsFor); setUserEvents(eventsFor); setUserReports(reportsFor); setUserModalOpen(true);
                        }}>View Profile</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Edit User")}>Edit User</DropdownMenuItem>
                        <DropdownMenuItem onClick={async () => {
                          try {
                            await api.put(`/admin/v1/user/block-app-user/${user.id}`);
                            toast.success(user.blockedAt ? "User unblocked" : "User blocked");
                            fetchUsers();
                          } catch (err: any) {
                            toast.error("Action failed", { description: err?.response?.data?.message || err?.message });
                          }
                        }}>{user.status === "inactive" || user.blockedAt ? "Unblock User" : "Block User"}</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => toast.info("Delete user")}>Delete User</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>


        {/* User Profile Sheet (user-facing, right side) */}
        <Sheet open={userModalOpen} onOpenChange={(open) => setUserModalOpen(open)}>
          <SheetContent side="right" className="w-full max-w-md md:max-w-[480px] h-full bg-[#1a1a1f] border-white/10 p-0">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-white/6 flex items-center justify-center relative">
                <div className="text-lg font-semibold">{selectedUser?.name || 'User Profile'}</div>
              </div>

              <div className="p-6 text-center">
                <Avatar className="mx-auto h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">{selectedUser ? selectedUser.name.split(" ").map((n) => n[0]).join("") : "U"}</AvatarFallback>
                </Avatar>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{userPosts.length + userEvents.length}</div>
                    <div className="text-xs text-muted-foreground mt-1">BROADCASTS</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{userPosts.filter((p: any) => p.verified).length}</div>
                    <div className="text-xs text-muted-foreground mt-1">VERIFIED</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{userPosts.reduce((s: number, p: any) => s + (p.views || 0), 0)}</div>
                    <div className="text-xs text-muted-foreground mt-1">VIEWS</div>
                  </div>
                </div>
              </div>

              <div className="px-4 flex-1 overflow-auto">
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="verified">Verified ({userPosts.filter((p: any) => p.verified).length})</TabsTrigger>
                    <TabsTrigger value="all">All Broadcasts ({userPosts.length + userEvents.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="verified">
                    {userPosts.filter((p: any) => p.verified).length === 0 ? (
                      <div className="h-48 flex items-center justify-center text-muted-foreground">No Data Found</div>
                    ) : (
                      <div className="space-y-2">
                        {userPosts.filter((p: any) => p.verified).map((p: any) => (
                          <div key={p.id} className="p-3 border border-border rounded">
                            <div className="font-medium">{p.title || p.summary || 'Post'}</div>
                            <div className="text-xs text-muted-foreground">{p.datetime ? format(new Date(p.datetime), 'MMM dd, yyyy') : ''}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="all">
                    {userEvents.length + userPosts.length === 0 ? (
                      <div className="h-48 flex items-center justify-center text-muted-foreground">No Data Found</div>
                    ) : (
                      <div className="space-y-2">
                        {userEvents.map((e: any) => (
                          <div key={e.id} className="p-3 border border-border rounded">
                            <div className="font-medium">{e.title || e.name || 'Event'}</div>
                            <div className="text-xs text-muted-foreground">{e.datetime ? format(new Date(e.datetime), 'MMM dd, yyyy') : ''}</div>
                          </div>
                        ))}
                        {userPosts.map((p: any) => (
                          <div key={p.id} className="p-3 border border-border rounded">
                            <div className="font-medium">{p.title || p.summary || 'Post'}</div>
                            <div className="text-xs text-muted-foreground">{p.datetime ? format(new Date(p.datetime), 'MMM dd, yyyy') : ''}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <div className="mt-auto p-4 border-t border-white/6 flex justify-center">
                <Button variant="ghost" onClick={async () => {
                  if (!selectedUser) return;
                  const m = await import("@/lib/storage");
                  m.addNotification({ id: `notif-${Date.now()}`, to: selectedUser.email, subject: 'Message', body: 'Message from user view', createdAt: new Date().toISOString() });
                  toast.success('Message (simulated) sent');
                }}>
                  <Mail className="mr-2 h-4 w-4" /> Message
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Pagination Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default Users;
