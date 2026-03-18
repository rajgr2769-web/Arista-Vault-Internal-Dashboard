"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Megaphone, 
  BarChart3, 
  Settings, 
  LogOut,
  Briefcase,
  UserCheck,
  Shield,
  History,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface SidebarProps {
  role: "admin" | "manager" | "employee";
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoError, setLogoError] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/brand-logo.png");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const menuItems = {
    admin: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { name: "Employees", href: "/admin/employees", icon: Users },
      { name: "Tasks", href: "/admin/tasks", icon: ClipboardList },
      { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
      { name: "Leaves", href: "/admin/leaves", icon: Calendar },
      { name: "Attendance", href: "/admin/attendance", icon: UserCheck },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
    manager: [
      { name: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
      { name: "Team Members", href: "/manager/team", icon: Users },
      { name: "Task Distribution", href: "/manager/tasks", icon: Briefcase },
      { name: "Announcements", href: "/manager/announcements", icon: Megaphone },
      { name: "Reports", href: "/manager/reports", icon: BarChart3 },
      { name: "Leaves", href: "/manager/leaves", icon: Calendar },
    ],
    employee: [
      { name: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
      { name: "Work Log", href: "/employee/worklog", icon: ClipboardList },
      { name: "Announcements", href: "/employee/announcements", icon: Megaphone },
      { name: "Attendance", href: "/employee/attendance", icon: UserCheck },
      { name: "Leaves", href: "/employee/leaves", icon: Calendar },
    ],
  };

  const items = menuItems[role] || [];

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-screen fixed left-0 top-0 transition-colors duration-300">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center">
            {!logoError ? (
              <Image
                src={logoSrc}
                alt="Brand logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
                onError={() => {
                  if (logoSrc === "/brand-logo.png") setLogoSrc("/brand-logo.png.png");
                  else setLogoError(true);
                }}
                priority
              />
            ) : (
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Shield className="text-primary-foreground w-6 h-6" />
              </div>
            )}
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">Aristians</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "group-hover:scale-110 transition-transform")} />
              {item.name}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all group"
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          Sign Out
        </button>
        <div className="mt-3 text-[11px] leading-4 text-muted-foreground text-center">
          Arista Vault Internal Dashboard<br />v1.0 | by Pranav
        </div>
      </div>
    </div>
  );
}
