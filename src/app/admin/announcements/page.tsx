"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  LayoutGrid,
  List,
  Search,
  Filter,
  MoreVertical,
  X
} from "lucide-react";
import { format } from "date-fns";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [formData, setFormData] = useState({
    title: "",
    message: "",
  });

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

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase.from("announcements").insert({
        title: formData.title,
        message: formData.message,
        created_by: user.id,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: "Announcement posted successfully! Everyone can see it now." });
      setShowForm(false);
      setFormData({ title: "", message: "" });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Failed to post announcement" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) {
      setMessage({ type: 'error', text: "Failed to delete announcement" });
    } else {
      setMessage({ type: 'success', text: "Announcement deleted" });
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">System Announcements</h2>
          <p className="text-slate-400 mt-1">Broadcast important updates and news to the entire organization.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-rose-600/20 active:scale-95"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? "Cancel" : "Create Announcement"}
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
            <Megaphone className="w-6 h-6 text-rose-500" />
            Post New Announcement
          </h3>
          <form onSubmit={handleCreateAnnouncement} className="space-y-6 max-w-2xl">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Announcement Title</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-rose-500/50 outline-none text-white transition-all text-lg font-semibold"
                placeholder="e.g. Quarterly Review Meeting"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Message Content</label>
              <textarea
                required
                rows={4}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-rose-500/50 outline-none text-white transition-all resize-none"
                placeholder="Type your detailed announcement here..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-4 pt-2">
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
                className="px-8 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-all"
              >
                {loading ? "Posting..." : "Post Announcement"}
              </button>
            </div>
          </form>
        </div>
      )}

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
          <button className="hidden md:flex items-center gap-2 px-4 py-2 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-medium transition-all">
            <Filter className="w-4 h-4" />
            Filter
          </button>
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
          <p className="font-medium animate-pulse">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl p-24 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Megaphone className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No announcements yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto">Click the button above to broadcast your first announcement to the team.</p>
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
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-500 hover:text-white transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(ann.id)}
                        className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3 line-clamp-2">{ann.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-1 line-clamp-4">{ann.message}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-auto">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <User className="w-3.5 h-3.5" />
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
                        <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> {ann.creator?.name || "Admin"}</span>
                        <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {format(new Date(ann.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-slate-400 text-sm line-clamp-1 max-w-md hidden lg:block">{ann.message}</p>
                    <button 
                      onClick={() => handleDelete(ann.id)}
                      className="p-2.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
