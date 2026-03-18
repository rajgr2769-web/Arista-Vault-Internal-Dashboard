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
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  ShieldAlert
} from "lucide-react";
import { format } from "date-fns";

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        assigned_employee_data:assigned_employee (name, email),
        assigned_by_data:assigned_by (name)
      `)
      .order("created_at", { ascending: false });

    if (!error) setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    task.assigned_employee_data?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Global Task Monitor</h2>
          <p className="text-slate-400 mt-1">View and monitor all tasks across the entire organization.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300">
            <ClipboardList className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">{tasks.length} Total Tasks</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by task title or employee..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-medium transition-all">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Task Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned By</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading && tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="font-medium">Loading all tasks...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No tasks found.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{task.title}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3 h-3" />
                        Due {format(new Date(task.deadline), "MMM d, yyyy")}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                          {task.assigned_employee_data?.name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{task.assigned_employee_data?.name}</p>
                          <p className="text-[10px] text-slate-500">{task.assigned_employee_data?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-300">{task.assigned_by_data?.name || 'System'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        task.priority === 'High' ? 'bg-rose-500/10 text-rose-500' :
                        task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit ${
                        task.status === 'Done' ? 'bg-emerald-500/10 text-emerald-500' :
                        task.status === 'Need Help' ? 'bg-rose-500/10 text-rose-500' :
                        task.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-slate-800 text-slate-500'
                      }`}>
                        {task.status === 'Need Help' && <ShieldAlert className="w-3 h-3" />}
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
