/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

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
      <div className="min-h-screen w-full bg-white flex items-center justify-center font-sans text-neutral-600">
        <div className="flex items-center gap-2.5 px-4 py-2 border border-neutral-200 rounded">
          <Loader2 className="w-4 h-4 animate-spin text-neutral-800" />
          <span className="text-xs font-medium uppercase tracking-wider">Verifying Authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-800">
      {/* Simple Minimalist Navbar */}
      <header className="relative bg-white border-b border-neutral-200 px-6 py-3.5 flex items-center justify-between">
        <div className="text-xs text-neutral-500 font-medium">
          {user?.username ? `User: ${user.username}` : ""}
        </div>

        {/* Center Text */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-wide text-neutral-900">
          Main Page
        </h1>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300 rounded transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white p-8 border border-neutral-200 rounded-lg max-w-md w-full text-center">
          <h2 className="text-lg font-semibold text-neutral-900 mb-1">Main Page</h2>
          <p className="text-xs text-neutral-500">
            Investigator Portal
          </p>
        </div>
      </main>
    </div>
  );
}
