"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Clock, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertCircle,
  X,
  ShieldAlert,
  ChevronDown,
  MoreVertical,
  Edit2,
  Mail,
  ChevronRight,
  ShieldQuestion
} from "lucide-react";
import { format } from "date-fns";

export default function EmployeeWorkLogPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        assigned_by_data:assigned_by (name)
      `)
      .eq("assigned_employee", user.id)
      .order("created_at", { ascending: false });

    if (!error) setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus, updated_at: new Date() })
      .eq("id", taskId);

    if (error) {
      setMessage({ type: 'error', text: "Failed to update task status" });
    } else {
      setMessage({ type: 'success', text: `Task status updated to ${newStatus}` });
      fetchData();
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Need Help': return 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse';
      case 'In Progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-800 text-slate-500 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Personal Work Log</h2>
          <p className="text-slate-400 mt-1">Manage and track your assigned tasks. Only you can update your task status.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-sm">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">{format(new Date(), "MMM d, yyyy")}</span>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top duration-300 ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {loading && tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium animate-pulse">Loading your work log...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl p-24 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ClipboardList className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No tasks assigned yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Once your manager assigns you a task, it will appear here in your work log.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all group overflow-hidden relative shadow-lg shadow-black/10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                        task.priority === 'High' ? 'bg-rose-500/10 text-rose-500' :
                        task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {task.priority} Priority
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        Due {format(new Date(task.deadline), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2">{task.title}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">{task.description}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Assigned By</p>
                          <p className="text-xs font-semibold text-slate-300">{task.assigned_by_data?.name || "Manager"}</p>
                        </div>
                      </div>
                      {task.remarks && (
                        <div className="flex items-center gap-2 border-l border-slate-800 pl-6">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                            <Edit2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Manager Remarks</p>
                            <p className="text-xs font-semibold text-slate-300 line-clamp-1">{task.remarks}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:w-72 space-y-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Update Status</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {['Pending', 'In Progress', 'Done', 'Need Help'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(task.id, status)}
                          className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            task.status === status 
                              ? (status === 'Done' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                                 status === 'Need Help' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' :
                                 status === 'In Progress' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' :
                                 'bg-slate-700 text-white shadow-lg shadow-slate-700/20')
                              : 'bg-slate-900 text-slate-500 hover:text-white border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {status === 'Need Help' && <ShieldQuestion className="w-3 h-3" />}
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
