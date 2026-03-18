"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertCircle,
  X,
  ShieldAlert,
  Edit,
  Trash2,
  Mail,
  ChevronDown
} from "lucide-react";
import { format } from "date-fns";

export default function ManagerTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_employee: "",
    priority: "Medium",
    deadline: format(new Date(), "yyyy-MM-dd"),
    remarks: "",
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch tasks assigned by this manager
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select(`
        *,
        assigned_employee_data:assigned_employee (name, email)
      `)
      .eq("assigned_by", user.id)
      .order("created_at", { ascending: false });

    // Fetch employees reporting to this manager
    const { data: employeesData, error: employeesError } = await supabase
      .from("users")
      .select("*")
      .eq("reporting_officer", user.id);

    if (!tasksError) setTasks(tasksData);
    if (!employeesError) setEmployees(employeesData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase.from("tasks").insert({
        title: formData.title,
        description: formData.description,
        assigned_employee: formData.assigned_employee,
        assigned_by: user.id,
        priority: formData.priority,
        deadline: formData.deadline,
        remarks: formData.remarks,
        status: "Pending",
      });

      if (error) throw error;

      setMessage({ type: 'success', text: "Task assigned successfully!" });
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        assigned_employee: "",
        priority: "Medium",
        deadline: format(new Date(), "yyyy-MM-dd"),
        remarks: "",
      });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Failed to assign task" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) setMessage({ type: 'error', text: "Failed to delete task" });
    else {
      setMessage({ type: 'success', text: "Task deleted successfully" });
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Task Distribution</h2>
          <p className="text-slate-400 mt-1">Assign new tasks and manage workload across your reporting team.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? "Cancel" : "Assign New Task"}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top duration-300 ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-500" />
            New Task Assignment
          </h3>
          <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-400">Task Title</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all text-lg font-bold"
                placeholder="e.g. Design Marketing Campaign Assets"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-400">Description</label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all resize-none"
                placeholder="Detail out the task requirements..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Assign To Employee</label>
              <select
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all"
                value={formData.assigned_employee}
                onChange={(e) => setFormData({ ...formData, assigned_employee: e.target.value })}
              >
                <option value="">Select an employee</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Priority Level</label>
              <div className="grid grid-cols-3 gap-3">
                {['Low', 'Medium', 'High'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`py-2.5 rounded-xl border transition-all font-bold text-sm ${
                      formData.priority === p 
                        ? (p === 'High' ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' : 
                           p === 'Medium' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 
                           'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20')
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Deadline</label>
              <input
                type="date"
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Initial Remarks</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all"
                placeholder="Optional notes for the employee..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-4 mt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl font-medium transition-all"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all"
              >
                {loading ? "Assigning..." : "Assign Task"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title or employee name..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-medium transition-all">
              <Filter className="w-4 h-4" />
              Status
            </button>
            <div className="w-px h-6 bg-slate-800 mx-1"></div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-all">
              Latest Tasks
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Task Title</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Deadline</th>
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
                      <p className="font-medium">Fetching assigned tasks...</p>
                    </div>
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-600">
                        <ClipboardList className="w-8 h-8" />
                      </div>
                      <p className="text-slate-500 font-medium max-w-xs mx-auto">You haven't assigned any tasks yet. Click the button above to start.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{task.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-1 max-w-xs">{task.description}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-sm">
                          {task.assigned_employee_data?.name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{task.assigned_employee_data?.name}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 uppercase tracking-wider">
                            <Mail className="w-3 h-3" />
                            {task.assigned_employee_data?.email?.split('@')[0]}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        task.priority === 'High' ? 'bg-rose-500/10 text-rose-500' :
                        task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className={`text-sm flex items-center gap-1.5 font-medium ${
                        new Date(task.deadline) < new Date() && task.status !== 'Done' ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(task.deadline), "MMM d, yyyy")}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          task.status === 'Done' ? 'bg-emerald-500/10 text-emerald-500' :
                          task.status === 'Need Help' ? 'bg-rose-500/10 text-rose-500 animate-pulse' :
                          task.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-slate-800 text-slate-500'
                        }`}>
                          {task.status === 'Need Help' && <ShieldAlert className="w-3 h-3" />}
                          {task.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(task.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
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
