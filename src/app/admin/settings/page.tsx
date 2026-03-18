"use client";

import { useState } from "react";
import { 
  Shield, 
  User, 
  Bell, 
  Lock, 
  Globe, 
  Mail, 
  Smartphone,
  CheckCircle2,
  Save,
  Trash2,
  ChevronRight
} from "lucide-react";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", name: "Profile Info", icon: User },
    { id: "security", name: "Security", icon: Lock },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "system", name: "System Config", icon: Globe },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">System Settings</h2>
        <p className="text-slate-400 mt-1">Manage your account preferences and global system configuration.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-72 space-y-2 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-5 py-3 rounded-xl transition-all font-medium ${
                activeTab === tab.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === tab.id ? 'rotate-90' : ''}`} />
            </button>
          ))}
        </div>

        <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
          <div className="space-y-8 max-w-2xl">
            {activeTab === "profile" && (
              <>
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3 pb-4 border-b border-slate-800">
                    <User className="w-6 h-6 text-blue-500" />
                    Public Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Full Name</label>
                      <input type="text" className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all" defaultValue="Administrator" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Email Address</label>
                      <input type="email" className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all" defaultValue="admin@aristians.in" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Job Title</label>
                      <input type="text" className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all" defaultValue="System Admin" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Department</label>
                      <input type="text" className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all" defaultValue="Operations" />
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-800 flex justify-end">
                  <button className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                </div>
              </>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3 pb-4 border-b border-slate-800">
                  <Shield className="w-6 h-6 text-rose-500" />
                  Security Settings
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Two-Factor Authentication</p>
                        <p className="text-xs text-slate-500">Add an extra layer of security to your account.</p>
                      </div>
                    </div>
                    <button className="px-4 py-1.5 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-lg text-xs font-bold hover:bg-blue-600/20 transition-all">Enable</button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Change Password</p>
                        <p className="text-xs text-slate-500">Last updated 3 months ago.</p>
                      </div>
                    </div>
                    <button className="px-4 py-1.5 border border-slate-800 text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all">Update</button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3 pb-4 border-b border-slate-800">
                  <Bell className="w-6 h-6 text-emerald-500" />
                  Preferences
                </h3>
                <div className="space-y-4">
                  {[
                    "New user registration alerts",
                    "Task deadline reminders",
                    "System update notifications",
                    "Weekly analytics summary"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                      <span className="text-sm text-slate-300 font-medium">{item}</span>
                      <div className="w-12 h-6 bg-emerald-500 rounded-full relative shadow-inner">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
