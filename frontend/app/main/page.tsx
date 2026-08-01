"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldAlert, UserCheck, Loader2 } from "lucide-react";

export default function MainPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !storedUser) {
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.replace("/");
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setIsCheckingAuth(false);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.replace("/");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.replace("/");
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full bg-[#edf2f7] flex flex-col items-center justify-center font-sans text-slate-700">
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-lg border border-slate-200">
          <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
          <span className="text-sm font-bold tracking-wide uppercase">Verifying Authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edf2f7] flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Header Bar */}
      <header className="max-w-6xl w-full mx-auto bg-slate-900 text-white rounded-2xl p-4 px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <UserCheck className="w-6 h-6 text-emerald-400" />
          <div>
            <h2 className="font-extrabold text-sm uppercase tracking-wider">
              {user ? user.username : "Investigator"}
            </h2>
            <span className="text-xs text-slate-400 font-semibold uppercase">
              Role: {user?.role || "investigator"}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </header>

      {/* Centered Main Page Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-12 sm:p-16 border border-slate-200/80 shadow-xl max-w-lg w-full">
          <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">
            Main Page
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-2">
            Investigator Dashboard & Investigation Tools
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs font-semibold text-slate-400 py-2">
        Kilatis System • Investigator Session
      </footer>
    </div>
  );
}
