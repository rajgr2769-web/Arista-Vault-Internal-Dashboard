"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Briefcase, Shield, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoError, setLogoError] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/brand-logo.png");
  const router = useRouter();
  const logo = (
    <div className="fixed left-6 top-6 z-10 w-16 h-16 rounded-2xl bg-white/5 border border-white/10 backdrop-blur flex items-center justify-center shadow-lg">
      {!logoError ? (
        <Image
          src={logoSrc}
          alt="Brand logo"
          width={56}
          height={56}
          className="w-14 h-14 object-contain"
          unoptimized
          onError={() => {
            if (logoSrc === "/brand-logo.png") {
              setLogoSrc("/brand-logo.png.png");
              return;
            }
            setLogoError(true);
          }}
          priority
        />
      ) : (
        <Shield className="w-8 h-8 text-white/80" />
      )}
    </div>
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Fetch user role from users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user?.id)
        .maybeSingle();

      if (userError || !userData) {
        await supabase.auth.signOut(); // Log out the user if their profile is missing
        throw userError || new Error("Your user profile was not found. Please contact an administrator.");
      }

      const role = userData.role;

      if (role === "admin") router.push("/admin/dashboard");
      else if (role === "manager") router.push("/manager/dashboard");
      else if (role === "employee") router.push("/employee/dashboard");
      else throw new Error("Unauthorized role");
    } catch (err: any) {
      setError(err.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  const portals = [
    {
      id: "employee",
      title: "Employee Login",
      description: "Access your dashboard to view tasks, announcements, and update work logs.",
      icon: <User className="w-10 h-10 text-blue-400" />,
      color: "border-blue-500/50 hover:border-blue-500",
      btnColor: "bg-blue-600 hover:bg-blue-700",
    },
    {
      id: "manager",
      title: "Manager Login",
      description: "Reporting Officer access to manage team, assign tasks, and monitor progress.",
      icon: <Briefcase className="w-10 h-10 text-emerald-400" />,
      color: "border-emerald-500/50 hover:border-emerald-500",
      btnColor: "bg-emerald-600 hover:bg-emerald-700",
    },
    {
      id: "admin",
      title: "Admin Login",
      description: "Administrator access to manage users, system settings, and analytics.",
      icon: <Shield className="w-10 h-10 text-rose-400" />,
      color: "border-rose-500/50 hover:border-rose-500",
      btnColor: "bg-rose-600 hover:bg-rose-700",
    },
  ];

  if (selectedRole) {
    const portal = portals.find((p) => p.id === selectedRole);
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black text-white">
        {logo}
        <div className="w-full max-w-md p-8 rounded-2xl border border-slate-800 bg-slate-900/50 shadow-2xl">
          <button
            onClick={() => setSelectedRole(null)}
            className="flex items-center text-sm text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portals
          </button>

          <div className="text-center mb-8">
            <div className="inline-block p-3 rounded-xl bg-slate-800 mb-4">
              {portal?.icon}
            </div>
            <h1 className="text-2xl font-bold text-white">{portal?.title}</h1>
            <p className="text-slate-400 mt-2 text-sm">Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white"
                placeholder="name@aristians.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-rose-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all transform active:scale-[0.98] ${
                portal?.btnColor
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? "Authenticating..." : "Login to Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white">
      {logo}
      <div className="mb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight welcome-animate">
          Welcome Aristians
        </h1>
        <p className="text-slate-400 mt-3 text-base md:text-lg welcome-animate-delay">
          Sign in to continue
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {portals.map((portal) => (
          <div
            key={portal.id}
            onClick={() => setSelectedRole(portal.id)}
            className={`group cursor-pointer p-8 rounded-3xl border-2 bg-slate-900/40 backdrop-blur-sm transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl ${portal.color}`}
          >
            <div className="mb-6 p-4 rounded-2xl bg-slate-800 w-fit group-hover:scale-110 transition-transform duration-300">
              {portal.icon}
            </div>
            <h2 className="text-2xl font-bold mb-3">{portal.title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">{portal.description}</p>
            <button
              className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${portal.btnColor} shadow-lg shadow-black/20`}
            >
              Access Portal
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-16 text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} All rights reserved.
      </div>
    </div>
  );
}
