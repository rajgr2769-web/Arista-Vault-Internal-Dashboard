'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Users, 
  UserPlus, 
  ClipboardCheck, 
  Bell, 
  Activity, 
  Clock
} from "lucide-react";
import { format, formatDistanceToNowStrict, parseISO, subDays } from "date-fns";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts";

type TimeRange = "7d" | "30d";

type ActivityItem = {
  id: string;
  type: "user" | "task" | "announcement";
  title: string;
  timestamp: string;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalManagers: 0,
    activeTasks: 0,
    announcements: 0,
  });
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [chartData, setChartData] = useState<Array<{ name: string; created: number; done: number }>>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const fetchDashboardData = async () => {
      setLoading(true);

      const rangeDays = timeRange === "7d" ? 7 : 30;
      const fromDate = subDays(new Date(), rangeDays - 1);

      const [
        employeesRes,
        managersRes,
        activeTasksRes,
        announcementsCountRes,
        tasksTimelineRes,
        recentTasksRes,
        recentUsersRes,
        recentAnnouncementsRes,
      ] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "employee"),
        supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "manager"),
        supabase.from("tasks").select("*", { count: "exact", head: true }).neq("status", "Done"),
        supabase.from("announcements").select("*", { count: "exact", head: true }),
        supabase
          .from("tasks")
          .select("created_at,status")
          .gte("created_at", fromDate.toISOString()),
        supabase
          .from("tasks")
          .select("id,title,status,updated_at")
          .order("updated_at", { ascending: false })
          .limit(6),
        supabase
          .from("users")
          .select("id,name,created_at")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("announcements")
          .select("id,title,created_at")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      if (cancelled) return;

      setStats({
        totalEmployees: employeesRes.count || 0,
        totalManagers: managersRes.count || 0,
        activeTasks: activeTasksRes.count || 0,
        announcements: announcementsCountRes.count || 0,
      });

      const dayKey = (iso: string) => format(parseISO(iso), "yyyy-MM-dd");
      const labelForKey = (key: string) => format(parseISO(`${key}T00:00:00.000Z`), rangeDays <= 7 ? "EEE" : "MMM d");

      const createdMap = new Map<string, number>();
      const doneMap = new Map<string, number>();

      for (let i = rangeDays - 1; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const key = format(d, "yyyy-MM-dd");
        createdMap.set(key, 0);
        doneMap.set(key, 0);
      }

      (tasksTimelineRes.data || []).forEach((t: any) => {
        const key = dayKey(t.created_at);
        if (createdMap.has(key)) createdMap.set(key, (createdMap.get(key) || 0) + 1);
        if (t.status === "Done" && doneMap.has(key)) doneMap.set(key, (doneMap.get(key) || 0) + 1);
      });

      setChartData(
        Array.from(createdMap.keys()).map((key) => ({
          name: labelForKey(key),
          created: createdMap.get(key) || 0,
          done: doneMap.get(key) || 0,
        }))
      );

      const items: ActivityItem[] = [];

      (recentUsersRes.data || []).forEach((u: any) => {
        items.push({
          id: `user:${u.id}`,
          type: "user",
          title: `New user: ${u.name || "Unnamed"}`,
          timestamp: u.created_at,
        });
      });

      (recentAnnouncementsRes.data || []).forEach((a: any) => {
        items.push({
          id: `announcement:${a.id}`,
          type: "announcement",
          title: `Announcement: ${a.title}`,
          timestamp: a.created_at,
        });
      });

      (recentTasksRes.data || []).forEach((t: any) => {
        items.push({
          id: `task:${t.id}`,
          type: "task",
          title: `Task ${t.status === "Done" ? "completed" : "updated"}: ${t.title}`,
          timestamp: t.updated_at,
        });
      });

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(items.slice(0, 6));

      setLastUpdatedAt(new Date());
      setLoading(false);
    };

    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => void fetchDashboardData(), 300);
    };

    void fetchDashboardData();

    const channel = supabase
      .channel("admin-dashboard-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, scheduleRefresh)
      .subscribe();

    return () => {
      cancelled = true;
      if (refreshTimer) clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [timeRange]);

  const statCards = [
    { title: "Total Employees", value: stats.totalEmployees, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Total Managers", value: stats.totalManagers, icon: UserPlus, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Active Tasks", value: stats.activeTasks, icon: ClipboardCheck, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Announcements", value: stats.announcements, icon: Bell, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Overview Dashboard</h2>
          <p className="text-muted-foreground mt-1">Welcome back, Administrator. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-card border border-border rounded-xl text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className="bg-card border border-border p-6 rounded-2xl group hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-black/5">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <span className="flex items-center text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                Live
              </span>
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">{card.title}</h3>
            <p className="text-3xl font-bold text-foreground tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-border p-8 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-foreground">Task Activity</h3>
              <p className="text-sm text-muted-foreground">
                {timeRange === "7d" ? "Last 7 days" : "Last 30 days"}{lastUpdatedAt ? ` · Updated ${formatDistanceToNowStrict(lastUpdatedAt)} ago` : ""}
              </p>
            </div>
            <select
              className="bg-background border border-border text-xs text-muted-foreground px-3 py-1.5 rounded-lg outline-none"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.22}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Area type="monotone" dataKey="created" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorCreated)" />
                <Area type="monotone" dataKey="done" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorDone)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border p-8 rounded-3xl shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading activity…</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent activity yet.</div>
            ) : (
              recentActivity.map((item, i) => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-all">
                      {item.type === "user" ? (
                        <Users className="w-5 h-5" />
                      ) : item.type === "announcement" ? (
                        <Bell className="w-5 h-5" />
                      ) : (
                        <Activity className="w-5 h-5" />
                      )}
                    </div>
                    {i < recentActivity.length - 1 && <div className="absolute top-10 left-5 w-px h-6 bg-border" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNowStrict(parseISO(item.timestamp))} ago
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-8 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
}
