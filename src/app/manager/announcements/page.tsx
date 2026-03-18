"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Megaphone, 
  Search, 
  Filter, 
  Clock, 
  Calendar, 
  User, 
  LayoutGrid,
  List,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { format } from "date-fns";

export default function ManagerAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select(`
        *,
        creator:created_by (name)
      `)
      .order("created_at", { ascending: false });

    if (!error) setAnnouncements(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Organization News</h2>
          <p className="text-slate-400 mt-1">Stay updated with the latest announcements from the administration.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm">
            <Megaphone className="w-4 h-4" />
            <span className="font-bold">{announcements.length} Total</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search announcements..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/50 outline-none transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 border-l border-slate-800 pl-4 ml-4">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading && announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-4">
          <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium animate-pulse">Loading updates...</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {announcements.map((ann) => (
            <div 
              key={ann.id} 
              className={`bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all group overflow-hidden ${
                viewMode === 'grid' ? 'rounded-3xl flex flex-col p-8' : 'rounded-2xl flex items-center p-6'
              }`}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform">
                      <Megaphone className="w-6 h-6" />
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3 line-clamp-2">{ann.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-1 line-clamp-4">{ann.message}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-auto">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                      {ann.creator?.name || "Admin"}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(ann.created_at), "MMM d, yyyy")}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-6">
                    <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">{ann.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-blue-500" /> {ann.creator?.name || "Admin"}</span>
                        <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {format(new Date(ann.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-slate-400 text-sm line-clamp-1 max-w-md hidden lg:block">{ann.message}</p>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
