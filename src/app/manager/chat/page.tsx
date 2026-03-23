"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, Send, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  created_at: string;
};

export default function ManagerChatPage() {
  return (
    <Suspense fallback={<div className="text-white p-6">Loading chat...</div>}>
      <ChatContent />
    </Suspense>
  );
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const otherUserId = searchParams.get("user");

  const [meId, setMeId] = useState<string | null>(null);
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
    if (!otherUserId) {
      setLoading(false);
      return;
    }

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
          (m.sender_id === meId && m.receiver_id === otherUserId) ||
          (m.sender_id === otherUserId && m.receiver_id === meId);

        if (!matches) return;

        setMessages((prev) => {
          if (prev.some((x) => x.id === m.id)) return prev;
          return [...prev, m].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
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
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/manager/team")}>
          <ArrowLeft />
        </button>
        <h2 className="text-white text-xl">{otherUser?.name || "Chat"}</h2>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="h-[400px] overflow-y-auto" ref={listRef}>
        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-slate-400">No messages yet</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={m.sender_id === meId ? "text-right" : "text-left"}>
              <p>{m.body}</p>
              <small>{format(new Date(m.created_at), "hh:mm a")}</small>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 p-2"
        />
        <button onClick={handleSend}>
          <Send />
        </button>
      </div>
    </div>
  );
}