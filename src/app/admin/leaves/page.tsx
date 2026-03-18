"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Check, X, Clock, User, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function AdminLeavesPage() {
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leaves")
      .select(`
        *,
        employee:employee_id (name, department)
      `)
      .order("created_at", { ascending: false });

    if (!error) {
      setLeaveRequests(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("leaves")
      .update({ status: "Approved", approved_by: user.id })
      .eq("id", id);

    if (error) {
      setMessage({ type: 'error', text: "Failed to approve leave request" });
    } else {
      setMessage({ type: 'success', text: "Leave request approved" });
      fetchData();
    }
  };

  const handleDeny = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase
      .from("leaves")
      .update({ status: "Denied", approved_by: user.id })
      .eq("id", id);

    if (error) {
      setMessage({ type: 'error', text: "Failed to deny leave request" });
    } else {
      setMessage({ type: 'success', text: "Leave request denied" });
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Global Leave Management</h2>
          <p className="text-slate-400 mt-1">Review and manage all employee leave applications.</p>
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

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            All Leave Requests
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading && leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="font-medium">Loading requests...</p>
                    </div>
                  </td>
                </tr>
              ) : leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                leaveRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                          {req.employee?.name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{req.employee?.name}</p>
                          <p className="text-xs text-slate-500">{req.employee?.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-300">
                        {format(new Date(req.start_date), "MMM d")} - {format(new Date(req.end_date), "MMM d, yyyy")}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-400 max-w-xs truncate">{req.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' :
                        req.status === 'Denied' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleApprove(req.id)}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                            title="Approve"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeny(req.id)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Deny"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600 italic">Processed</span>
                      )}
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
