"use client";
export const dynamic = 'force-dynamic'
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, Send, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  created_at: string;
};

export default function EmployeeChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitOther = searchParams.get("user");

  const [meId, setMeId] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(explicitOther);
  const [otherUser, setOtherUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const listRef = useRef<HTMLDivElement | null>(null);

  const threadKey = useMemo(() => {
    if (!meId || !otherUserId) return null;
    return [meId, otherUserId].sort().join(":");
  }, [meId, otherUserId]);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setLoading(true);
      setError("");

      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        if (!cancelled) {
          setLoading(false);
          setError("You must be logged in to use chat.");
        }
        return;
      }

      if (!cancelled) setMeId(user.id);

      if (!otherUserId) {
        const { data: myProfile } = await supabase.from("users").select("reporting_officer").eq("id", user.id).maybeSingle();
        if (!myProfile?.reporting_officer) {
          if (!cancelled) {
            setLoading(false);
            setError("No reporting officer found for your account.");
          }
          return;
        }
        if (!cancelled) setOtherUserId(myProfile.reporting_officer);
        return;
      }

      const { data: other, error: otherErr } = await supabase
        .from("users")
        .select("id,name,role")
        .eq("id", otherUserId)
        .maybeSingle();

      if (otherErr || !other) {
        if (!cancelled) {
          setLoading(false);
          setError("Unable to load this user.");
        }
        return;
      }

      if (!cancelled) setOtherUser(other);

      const { data: msgs, error: msgErr } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (msgErr) {
        if (!cancelled) {
          setLoading(false);
          setError(msgErr.message || "Unable to load messages.");
        }
        return;
      }

      if (!cancelled) {
        setMessages((msgs as any) || []);
        setLoading(false);
      }
    };

    void boot();

    return () => {
      cancelled = true;
    };
  }, [otherUserId]);

  useEffect(() => {
    if (!threadKey) return;

    const channel = supabase
      .channel(`chat-${threadKey}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as any as MessageRow;
        if (!meId || !otherUserId) return;
        const matches =
          (m.sender_id === meId && m.receiver_id === otherUserId) || (m.sender_id === otherUserId && m.receiver_id === meId);
        if (!matches) return;
        setMessages((prev) => {
          if (prev.some((x) => x.id === m.id)) return prev;
          return [...prev, m].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadKey, meId, otherUserId]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const handleSend = async () => {
    if (!meId || !otherUserId) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    setText("");
    setError("");

    const { error: insertErr } = await supabase.from("messages").insert({
      sender_id: meId,
      receiver_id: otherUserId,
      body: trimmed,
    });

    if (insertErr) {
      setError(insertErr.message || "Failed to send message.");
      setText(trimmed);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/employee/dashboard")}
            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{otherUser?.name || "Chat"}</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest">{otherUser?.role || ""}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl flex items-center gap-3 bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <ShieldAlert className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div ref={listRef} className="h-[420px] overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-slate-500">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="text-slate-500">No messages yet. Say hi.</div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender_id === meId;
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 border ${
                    isMe
                      ? "bg-blue-600/20 border-blue-500/30 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-200"
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.body}</p>
                    <p className="mt-2 text-[10px] text-slate-400">
                      {format(new Date(m.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Type a message…"
              className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 inline-flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

