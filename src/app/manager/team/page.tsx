"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Search, 
  Mail, 
  Briefcase, 
  Calendar, 
  CheckCircle2, 
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";
import { format } from "date-fns";

export default function ManagerTeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("reporting_officer", user.id)
      .order("name");

    if (!error) setTeam(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTeam = team.filter((emp) => {
    const name = (emp?.name || "").toLowerCase();
    const email = (emp?.email || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Your Direct Reports</h2>
          <p className="text-slate-400 mt-1">Manage and support the employees reporting directly to you.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-sm">
            <Users className="w-4 h-4" />
            <span className="font-bold">{team.length} Team Members</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-all">
          <Activity className="w-4 h-4" />
          Activity Log
        </button>
      </div>

      {loading && team.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium animate-pulse">Loading team members...</p>
        </div>
      ) : filteredTeam.length === 0 ? (
        <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl p-24 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No team members found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">Either you have no direct reports or your search yielded no results.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeam.map((emp) => (
            <div key={emp.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all group overflow-hidden relative shadow-lg shadow-black/10">
              <div className="absolute top-0 right-0 p-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'
                }`}>
                  {emp.status}
                </span>
              </div>
              
              <div className="flex flex-col items-center text-center mt-4">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-3xl mb-6 shadow-xl border-4 border-slate-900 group-hover:scale-105 transition-transform duration-500 relative">
                  {emp.name[0]}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-900 rounded-full"></div>
                </div>
                <h4 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{emp.name}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium uppercase tracking-widest mb-6">
                  <Briefcase className="w-3.5 h-3.5" />
                  {emp.department || 'N/A'}
                </p>
                
                <div className="w-full grid grid-cols-2 gap-3 mb-8">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1">Joined</p>
                    <p className="text-xs font-bold text-slate-300">{format(new Date(emp.joining_date), "MMM yyyy")}</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1">Performance</p>
                    <p className="text-xs font-bold text-emerald-500 flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Good
                    </p>
                  </div>
                </div>

                <div className="w-full flex items-center gap-3">
                  {emp.email ? (
                    <a
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emp.email)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex-1 py-3 bg-slate-800/50 text-slate-500 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => router.push(`/manager/chat?user=${emp.id}`)}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
