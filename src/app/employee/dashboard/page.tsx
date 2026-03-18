'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Megaphone, 
  Calendar,
  ArrowRight,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { format } from "date-fns";

export default function EmployeeDashboard() {
  const [stats, setStats] = useState({
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    announcements: 0,
  });
  const [tasks, setTasks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count: pending } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assigned_employee", user.id).eq("status", "Pending");
      const { count: inProgress } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assigned_employee", user.id).eq("status", "In Progress");
      const { count: completed } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assigned_employee", user.id).eq("status", "Done");
      const { count: announcementsCount } = await supabase.from("announcements").select("*", { count: "exact", head: true });

      const { data: tasksData } = await supabase
        .from("tasks")
        .select(`*, assigned_by_data:assigned_by (name)`)
        .eq("assigned_employee", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      const { data: announcementsData } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2);

      setStats({
        pendingTasks: pending || 0,
        inProgressTasks: inProgress || 0,
        completedTasks: completed || 0,
        announcements: announcementsCount || 0,
      });
      setTasks(tasksData || []);
      setAnnouncements(announcementsData || []);
      setLoading(false);
    };

    fetchStats();

    // Set up real-time subscription
    const channel = supabase
      .channel('employee-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statCards = [
    { title: "Pending Tasks", value: stats.pendingTasks, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "In Progress", value: stats.inProgressTasks, icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Completed", value: stats.completedTasks, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Announcements", value: stats.announcements, icon: Megaphone, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Personal Workspace</h2>
          <p className="text-slate-400 mt-1">Track your progress and stay updated with team announcements.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300">
          <UserCheck className="w-4 h-4" />
          <span className="text-sm font-medium">Shift Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl group transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <span className="flex items-center text-xs font-medium text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 mr-1" />
                Live
              </span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">{card.title}</h3>
            <p className="text-3xl font-bold text-white tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-8 rounded-3xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white">Your Recent Tasks</h3>
              <button className="text-sm text-blue-400 font-medium hover:underline flex items-center gap-1">
                View Work Log <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No tasks assigned to you yet.</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="p-5 bg-slate-950/50 border border-slate-800/50 rounded-2xl hover:bg-slate-800/50 transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shrink-0 ${
                          task.status === 'Done' ? 'bg-emerald-500/20 text-emerald-500' :
                          task.status === 'Need Help' ? 'bg-rose-500/20 text-rose-500' :
                          'bg-blue-500/20 text-blue-500'
                        }`}>
                          <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{task.title}</h4>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-4">
                            <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Due {format(new Date(task.deadline), "MMM d")}</span>
                            <span className="flex items-center gap-1.5 font-semibold text-slate-400"><AlertCircle className="w-3 h-3" /> {task.priority} Priority</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 justify-between md:justify-end">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          task.status === 'Done' ? 'bg-emerald-500/10 text-emerald-500' :
                          task.status === 'Need Help' ? 'bg-rose-500/10 text-rose-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {task.status}
                        </span>
                        <button className="p-2 text-slate-500 hover:text-white transition-colors">
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-rose-500" />
              Recent Updates
            </h3>
            <div className="space-y-6">
              {announcements.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No announcements yet.</p>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="group cursor-default">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded">Announcement</span>
                      <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{format(new Date(ann.created_at), "MMM d")}</span>
                    </div>
                    <h4 className="font-bold text-white group-hover:text-rose-400 transition-colors line-clamp-1">{ann.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{ann.message}</p>
                  </div>
                ))
              )}
            </div>
            <button className="w-full mt-8 py-3 rounded-xl border border-slate-800 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
              See All Announcements
            </button>
          </div>
          
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-xl shadow-blue-600/20 text-white overflow-hidden relative group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <h4 className="text-xl font-bold mb-2">Need Assistance?</h4>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">If you're stuck on a task, update your status to "Need Help" and your manager will be notified immediately.</p>
            <button className="px-6 py-2.5 bg-white text-blue-600 rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-all active:scale-95">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
