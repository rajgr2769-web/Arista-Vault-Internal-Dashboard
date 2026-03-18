"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Calendar, Plus, Send, CheckCircle2, AlertCircle, Clock, X } from "lucide-react";
import { format } from "date-fns";

export default function EmployeeLeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    reason: "",
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("leaves")
      .select("*")
      .eq("employee_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setLeaves(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase.from("leaves").insert({
        employee_id: user.id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: "Leave request submitted successfully!" });
      setShowForm(false);
      setFormData({ start_date: "", end_date: "", reason: "" });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Failed to submit leave request" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Leave Management</h2>
          <p className="text-slate-400 mt-1">Apply for leave and track your requests.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? "Cancel" : "Apply for Leave"}
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
            <Calendar className="w-6 h-6 text-blue-500" />
            New Leave Application
          </h3>
          <form onSubmit={handleApplyLeave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Start Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">End Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Reason for Leave</label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all resize-none"
                placeholder="Explain the reason for your leave..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-4">
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
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Your Leave History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">
                        {format(new Date(leave.start_date), "MMM d")} - {format(new Date(leave.end_date), "MMM d, yyyy")}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-400 max-w-md truncate">{leave.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        leave.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' :
                        leave.status === 'Denied' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          leave.status === 'Approved' ? 'bg-emerald-500' :
                          leave.status === 'Denied' ? 'bg-rose-500' :
                          'bg-amber-500'
                        }`}></span>
                        {leave.status}
                      </span>
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
