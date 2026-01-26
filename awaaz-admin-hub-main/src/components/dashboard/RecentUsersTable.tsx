import { motion } from "framer-motion";
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
import { Skeleton } from "@/components/ui/skeleton";

export interface RecentUser {
  id: string;
  name: string;
  email: string;
  status: "active" | "pending" | "inactive";
  joinedDate: string;
}

const statusStyles = {
  active: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  inactive: "bg-muted text-muted-foreground border-muted",
};

interface RecentUsersTableProps {
  users: RecentUser[];
  isLoading?: boolean;
}

export function RecentUsersTable({ users, isLoading = false }: RecentUsersTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="rounded-xl border border-border bg-card shadow-card"
    >
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Users</h3>
        <p className="text-sm text-muted-foreground">
          Latest user registrations
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, idx) => (
              <TableRow key={idx}>
                <TableCell colSpan={3}>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            ))
            : users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusStyles[user.status]}
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.joinedDate}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </motion.div>
  );
}
