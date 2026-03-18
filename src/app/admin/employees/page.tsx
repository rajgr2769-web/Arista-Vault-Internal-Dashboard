"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  UserPlus, 
  Search, 
  MoreVertical, 
  Trash2, 
  Edit, 
  Mail, 
  Briefcase, 
  Calendar, 
  ShieldCheck,
  Filter,
  Download,
  X,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "employee",
    department: "",
    reporting_officer: "",
    joining_date: format(new Date(), "yyyy-MM-dd"),
    password: "",
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select(`
        *,
        reporting_officer_data:reporting_officer (name)
      `)
      .order("created_at", { ascending: false });

    if (!usersError) {
      setEmployees(usersData);
      setManagers(usersData.filter((u: any) => u.role === "manager" || u.role === "admin"));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create user');

      setMessage({ type: 'success', text: "User created successfully! The directory has been updated." });
      setShowForm(false);
      setFormData({
        name: "",
        email: "",
        role: "employee",
        department: "",
        reporting_officer: "",
        joining_date: format(new Date(), "yyyy-MM-dd"),
        password: "",
      });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Failed to create user" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this employee? This action cannot be undone.")) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete user');

      setMessage({ type: 'success', text: "Employee removed successfully." });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Failed to remove employee" });
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Employee Directory</h2>
          <p className="text-slate-400 mt-1">Manage your team members and their roles across the organization.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          {showForm ? <X className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          {showForm ? "Cancel" : "Add New Employee"}
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
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            New User Registration
          </h3>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all"
                placeholder="john@aristians.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Temporary Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Department</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all"
                placeholder="e.g. Engineering"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Role</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Reporting Officer</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all"
                value={formData.reporting_officer}
                onChange={(e) => setFormData({ ...formData, reporting_officer: e.target.value })}
              >
                <option value="">None (Top Level)</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-3 flex justify-end gap-4 mt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl font-medium transition-all"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all"
              >
                {loading ? "Creating..." : "Save User"}
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
              placeholder="Search by name, email or department..."
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
            <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-medium transition-all">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role & Dept</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reporting To</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joining Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading && employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="font-medium">Loading employee records...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No employees found matching your search.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold border border-slate-700 shadow-sm">
                          {emp.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{emp.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {emp.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`w-fit px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                          emp.role === 'admin' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                          emp.role === 'manager' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                          'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}>
                          {emp.role}
                        </span>
                        <span className="text-sm text-slate-400 flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-600" />
                          {emp.department || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-300 font-medium">
                        {emp.reporting_officer_data?.name || (
                          <span className="text-slate-600 italic">No Officer</span>
                        )}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        {format(new Date(emp.joining_date), "MMM d, yyyy")}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(emp.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
                          <MoreVertical className="w-4 h-4" />
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
