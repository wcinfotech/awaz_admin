import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "../ui/skeleton";

type ActivityPoint = { name: string; value: number };

interface ActivityChartProps {
  data?: ActivityPoint[];
  isLoading?: boolean;
}

export function ActivityChart({ data = [], isLoading = false }: ActivityChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      className="rounded-xl border border-border bg-card shadow-card"
    >
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Weekly Activity
            </h3>
            <p className="text-sm text-muted-foreground">
              User engagement over time
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-1.5">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-success">+12.5%</span>
          </div>
        </div>
      </div>
      <div className="p-6">
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0 0% 10%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0 0% 10%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(0 0% 45%)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(0 0% 45%)", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0 0% 100%)",
                  border: "1px solid hsl(0 0% 90%)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(0 0% 10%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
