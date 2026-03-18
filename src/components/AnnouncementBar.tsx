'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Megaphone, X } from "lucide-react";

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        const dismissed = localStorage.getItem(`announcement_${data.id}_dismissed`);
        if (!dismissed) {
          setAnnouncement(data);
          setVisible(true);
        }
      }
    };

    fetchAnnouncement();
  }, []);

  const handleDismiss = () => {
    if (announcement) {
      localStorage.setItem(`announcement_${announcement.id}_dismissed`, "true");
    }
    setVisible(false);
  };

  if (!visible || !announcement) return null;

  return (
    <div className="bg-blue-600 text-white p-3 flex items-center justify-center text-sm font-medium relative">
      <Megaphone className="w-4 h-4 mr-2" />
      <span>{announcement.title}: {announcement.message}</span>
      <button onClick={handleDismiss} className="absolute right-4 top-1/2 -translate-y-1/2">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
