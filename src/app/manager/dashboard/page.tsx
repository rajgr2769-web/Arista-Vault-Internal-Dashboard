'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Users, 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  Activity,
  ArrowRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

export default function ManagerDashboard() {
  const [stats, setStats] = useState({
    teamSize: 0,
    activeTasks: 0,
    completedTasks: 0,
    needHelp: 0,
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count: teamSize } = await supabase.from("users").select("*", { count: "exact", head: true }).eq("reporting_officer", user.id);
      const { count: activeTasks } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assigned_by", user.id).neq("status", "Done");
      const { count: completedTasks } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assigned_by", user.id).eq("status", "Done");
      const { count: needHelp } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assigned_by", user.id).eq("status", "Need Help");

      const { data: tasks } = await supabase
        .from("tasks")
        .select(`*, assigned_employee_data:assigned_employee (name)`)
        .eq("assigned_by", user.id)
        .order("updated_at", { ascending: false })
        .limit(5);

      setStats({
        teamSize: teamSize || 0,
        activeTasks: activeTasks || 0,
        completedTasks: completedTasks || 0,
        needHelp: needHelp || 0,
      });
      setRecentTasks(tasks || []);
    };

    fetchStats();

    // Set up real-time subscription
    const channel = supabase
      .channel('manager-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statCards = [
    { title: "Team Members", value: stats.teamSize, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Active Tasks", value: stats.activeTasks, icon: ClipboardList, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Completed", value: stats.completedTasks, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Need Help", value: stats.needHelp, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10", highlight: stats.needHelp > 0 },
  ];

  const chartData = [
    { name: "Done", value: stats.completedTasks, color: "#10b981" },
    { name: "In Progress", value: stats.activeTasks - stats.needHelp, color: "#3b82f6" },
    { name: "Need Help", value: stats.needHelp, color: "#f43f5e" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Manager Dashboard</h2>
          <p className="text-muted-foreground mt-1">Monitor your team's performance and manage task distribution.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-card border border-border rounded-xl text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className={`bg-card border ${card.highlight ? 'border-rose-500/50 shadow-lg shadow-rose-500/10' : 'border-border'} p-6 rounded-2xl group transition-all`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <span className="flex items-center text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 mr-1" />
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
          <h3 className="text-xl font-bold text-foreground mb-8">Recent Task Updates</h3>
          <div className="space-y-4">
            {recentTasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No tasks assigned yet.</p>
            ) : (
              recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-5 bg-background border border-border rounded-2xl hover:bg-muted/50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${
                      task.status === 'Done' ? 'bg-emerald-500/20 text-emerald-500' :
                      task.status === 'Need Help' ? 'bg-rose-500/20 text-rose-500 animate-pulse' :
                      'bg-blue-500/20 text-blue-500'
                    }`}>
                      {task.assigned_employee_data?.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{task.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        Assigned to {task.assigned_employee_data?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div className="hidden md:block">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Status</p>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        task.status === 'Done' ? 'bg-emerald-500/10 text-emerald-500' :
                        task.status === 'Need Help' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-8 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
            View All Team Tasks
          </button>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-8 rounded-3xl flex flex-col">
          <h3 className="text-xl font-bold text-white mb-2">Team Task Load</h3>
          <p className="text-sm text-slate-400 mb-8">Overall distribution of tasks by status</p>
          <div className="h-[250px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-8">
            {chartData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-400 font-medium">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
