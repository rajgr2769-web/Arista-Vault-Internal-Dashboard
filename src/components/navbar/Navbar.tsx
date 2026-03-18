"use client";

import { Bell, Search, User } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface NavbarProps {
  title: string;
}

export default function Navbar({ title }: NavbarProps) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        setUser(data);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10 transition-colors duration-300">
      <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search anything..."
            className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none transition-all w-64"
          />
        </div>

        <div className="flex items-center gap-4 border-l border-border pl-6">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
          </button>
          
          <div className="flex items-center gap-3 ml-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-foreground leading-none">{user?.name || "User Name"}</p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">{user?.role || "Role"}</p>
            </div>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
              {user?.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
