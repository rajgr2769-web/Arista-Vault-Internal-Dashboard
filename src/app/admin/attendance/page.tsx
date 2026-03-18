"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Calendar, Clock, User, Edit, Save, X } from "lucide-react";
import { format } from "date-fns";

export default function AdminAttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("attendance")
      .select(`
        *,
        employee:employee_id (name, department)
      `)
      .order("date", { ascending: false });

    if (!error) setAttendance(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdate = async () => {
    if (!editingRecord) return;

    setLoading(true);
    try {
      // Create a full ISO string for the update
      const dateStr = format(new Date(editingRecord.date), "yyyy-MM-dd");
      const checkInISO = editingRecord.check_in_time ? `${dateStr}T${editingRecord.check_in_time}:00Z` : null;
      const checkOutISO = editingRecord.check_out_time ? `${dateStr}T${editingRecord.check_out_time}:00Z` : null;

      const { error } = await supabase
        .from("attendance")
        .update({
          check_in: checkInISO,
          check_out: checkOutISO,
        })
        .eq("id", editingRecord.id);

      if (error) throw error;
      
      setEditingRecord(null);
      fetchData();
    } catch (err: any) {
      alert("Failed to update attendance: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from("attendance").delete().eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert("Failed to delete record: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (record: any) => {
    setEditingRecord({
      ...record,
      check_in_time: record.check_in ? format(new Date(record.check_in), "HH:mm") : "",
      check_out_time: record.check_out ? format(new Date(record.check_out), "HH:mm") : "",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Attendance Records</h2>
          <p className="text-slate-400 mt-1">View and manage attendance for all employees across the organization.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">{format(new Date(), "MMMM d, yyyy")}</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Global Attendance Log
          </h3>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{attendance.length} Records Found</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                attendance.map(record => (
                  <tr key={record.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                          {record.employee?.name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{record.employee?.name}</p>
                          <p className="text-xs text-slate-500">{record.employee?.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {format(new Date(record.date), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      {editingRecord?.id === record.id ? (
                        <input 
                          type="time" 
                          className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none" 
                          value={editingRecord.check_in_time} 
                          onChange={(e) => setEditingRecord({...editingRecord, check_in_time: e.target.value})} 
                        />
                      ) : (
                        <span className="text-sm font-mono text-slate-400">
                          {record.check_in ? format(new Date(record.check_in), "hh:mm a") : "--:--"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingRecord?.id === record.id ? (
                        <input 
                          type="time" 
                          className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none" 
                          value={editingRecord.check_out_time} 
                          onChange={(e) => setEditingRecord({...editingRecord, check_out_time: e.target.value})} 
                        />
                      ) : (
                        <span className="text-sm font-mono text-slate-400">
                          {record.check_out ? format(new Date(record.check_out), "hh:mm a") : "--:--"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingRecord?.id === record.id ? (
                        <div className="flex gap-2 justify-end">
                          <button onClick={handleUpdate} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all" title="Save">
                            <Save className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingRecord(null)} className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-all" title="Cancel">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditing(record)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(record.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all" title="Delete">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
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
