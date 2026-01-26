import { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentUsersTable } from "@/components/dashboard/RecentUsersTable";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { Users, Volume2, FileText, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const fallbackStats = [
  {
    title: "Total Users",
    value: "12,847",
    change: "+14% from last month",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Active Sessions",
    value: "3,421",
    change: "+8% from last week",
    changeType: "positive" as const,
    icon: Volume2,
  },
  {
    title: "Reports Generated",
    value: "1,294",
    change: "-3% from last month",
    changeType: "negative" as const,
    icon: FileText,
  },
  {
    title: "Engagement Rate",
    value: "89.2%",
    change: "Steady",
    changeType: "neutral" as const,
    icon: TrendingUp,
  },
];

const fallbackActivity = [
  { name: "Mon", value: 400 },
  { name: "Tue", value: 300 },
  { name: "Wed", value: 600 },
  { name: "Thu", value: 800 },
  { name: "Fri", value: 500 },
  { name: "Sat", value: 900 },
  { name: "Sun", value: 700 },
];

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  const base = import.meta.env.VITE_API_URL;
  if (!base) return fallback;
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  return res.json();
}

const Dashboard = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.loginSuccess) {
      toast.success("Login Successfully", {
        description: "Welcome back to Awaaz Operator Panel.",
      });
      // Optional: Replace history to remove state prevents toast on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const { data: stats = fallbackStats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => fetchJson("/dashboard/stats", fallbackStats),
    staleTime: 60_000,
  });

  const { data: activity = fallbackActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: () => fetchJson("/dashboard/activity", fallbackActivity),
    staleTime: 60_000,
  });

  const recentUsers = useMemo(
    () => [
      { id: "1", name: "Rahul Sharma", email: "rahul@example.com", status: "active", joinedDate: "Jan 5, 2026" },
      { id: "2", name: "Priya Patel", email: "priya@example.com", status: "active", joinedDate: "Jan 4, 2026" },
      { id: "3", name: "Amit Singh", email: "amit@example.com", status: "pending", joinedDate: "Jan 3, 2026" },
      { id: "4", name: "Neha Gupta", email: "neha@example.com", status: "active", joinedDate: "Jan 2, 2026" },
      { id: "5", name: "Vikram Kumar", email: "vikram@example.com", status: "inactive", joinedDate: "Jan 1, 2026" },
    ],
    []
  );

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statsLoading
            ? Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-28 w-full rounded-xl" />
            ))
            : stats.map((stat, index) => <StatsCard key={stat.title} {...stat} index={index} />)}
        </div>

        {/* Charts and Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentUsersTable users={recentUsers} />
          <ActivityChart data={activity} isLoading={activityLoading} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
