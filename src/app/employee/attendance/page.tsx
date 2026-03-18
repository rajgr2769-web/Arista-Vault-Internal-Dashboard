"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  CheckCircle2, 
  LogOut,
  LogIn,
  AlertCircle,
  TrendingUp,
  History
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";

export default function EmployeeAttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", user.id)
      .order("date", { ascending: false });

    if (!error) {
      setAttendance(data);
      const todayRecord = data.find(r => isSameDay(parseISO(r.date), new Date()));
      if (todayRecord && todayRecord.check_in && !todayRecord.check_out) {
        setCheckedIn(true);
        setCheckInTime(parseISO(todayRecord.check_in));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckInOut = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const now = new Date().toISOString();

      if (!checkedIn) {
        // Check in: Create a new record for today
        const { error } = await supabase.from("attendance").insert({
          employee_id: user.id,
          date: today,
          check_in: now,
        });
        if (error) throw error;
        
        setCheckedIn(true);
        setCheckInTime(new Date());
      } else {
        // Check out: Find today's record and update the check_out time
        const todayRecord = attendance.find(r => isSameDay(parseISO(r.date), new Date()));
        if (!todayRecord) throw new Error("No check-in record found for today");

        const { error } = await supabase
          .from("attendance")
          .update({ check_out: now })
          .eq("id", todayRecord.id);
        
        if (error) throw error;
        
        setCheckedIn(false);
        setCheckInTime(null);
      }
      
      await fetchData(); // Refresh data
    } catch (err: any) {
      alert("Attendance error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Attendance Tracking</h2>
          <p className="text-slate-400 mt-1">Log your daily work hours and view your historical attendance data.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCheckInOut}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${
              checkedIn 
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            {checkedIn ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            {checkedIn ? "Check Out Now" : "Check In Now"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl col-span-1 flex flex-col items-center text-center">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl ${
            checkedIn ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'
          }`}>
            <UserCheck className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{checkedIn ? "Shift Active" : "Shift Inactive"}</h3>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            {checkedIn 
              ? "You are currently logged in. Don't forget to check out at the end of your shift." 
              : "You haven't checked in yet today. Log in to start tracking your hours."}
          </p>
          <div className="w-full pt-8 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Current Time</span>
              <span className="text-sm font-bold text-white">{format(new Date(), "hh:mm a")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Working Since</span>
              <span className="text-sm font-bold text-white">{checkedIn ? "09:00 AM" : "--:--"}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl col-span-2 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" />
              Attendance History
            </h3>
            <button className="text-xs font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest">View Full Log</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Check In</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Check Out</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Hours</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-600 italic">No attendance records found.</td>
                  </tr>
                ) : (
                  attendance.slice(0, 5).map((record, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-white">{format(new Date(record.date), "EEE, MMM d")}</td>
                      <td className="px-6 py-4 text-sm text-slate-400 font-mono">{record.check_in ? format(new Date(record.check_in), "hh:mm a") : "--:--"}</td>
                      <td className="px-6 py-4 text-sm text-slate-400 font-mono">{record.check_out ? format(new Date(record.check_out), "hh:mm a") : "--:--"}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">8.5h</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold uppercase">Present</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
