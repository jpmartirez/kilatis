/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, UserPlus, Users, Key, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createInvestigator, getMyInvestigators, User } from "@/lib/api";

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");
  const [investigators, setInvestigators] = useState<User[]>([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Form state for creating investigator
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken || !storedUser) {
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.replace("/");
      return;
    }

    try {
      const userObj: User = JSON.parse(storedUser);
      if (userObj.role !== "admin") {
        router.replace("/main");
        return;
      }
      setCurrentUser(userObj);
      setToken(storedToken);
      loadInvestigators(storedToken);
      setIsCheckingAuth(false);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.replace("/");
    }
  }, [router]);

  const loadInvestigators = async (authToken: string) => {
    try {
      const data = await getMyInvestigators(authToken);
      setInvestigators(data);
    } catch (err) {
      console.error("Error loading investigators", err);
    }
  };

  const handleCreateInvestigator = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const created = await createInvestigator(token, newUsername, newPassword);
      setSuccess(`Investigator account "${created.username}" created successfully!`);
      setNewUsername("");
      setNewPassword("");
      await loadInvestigators(token);
    } catch (err: any) {
      setError(err.message || "Failed to create investigator account.");
    } finally {
      setLoading(false);
    }
  };

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
          <span className="text-sm font-bold tracking-wide uppercase">Verifying Admin Access...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edf2f7] p-4 sm:p-6 font-sans flex flex-col justify-between">
      <div className="max-w-5xl w-full mx-auto space-y-6">
        {/* Admin Header */}
        <header className="bg-slate-900 text-white rounded-2xl p-5 px-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-lg uppercase tracking-wider">
                ADMIN CONTROL PANEL
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Logged in as <span className="text-amber-400 font-bold">{currentUser?.username}</span> (Team Admin)
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </header>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Create Investigator Form */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <UserPlus className="w-5 h-5 text-slate-800" />
                <h3 className="font-extrabold text-slate-900 uppercase tracking-wide text-sm">
                  Create Investigator Account
                </h3>
              </div>

              <p className="text-xs text-slate-500 mb-4 font-medium">
                As an Admin, create investigator accounts for your team. You will be recorded as the creator.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-medium mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs font-medium mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleCreateInvestigator} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1">
                    Investigator Username
                  </label>
                  <Input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. inv_john"
                    className="bg-slate-50 border-slate-200 text-sm font-medium h-10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1">
                    Initial Password
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password"
                    className="bg-slate-50 border-slate-200 text-sm font-medium h-10"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50 mt-2"
                >
                  <Key className="w-4 h-4" />
                  <span>{loading ? "Creating..." : "Create Account"}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: List of Investigators */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-800" />
                <h3 className="font-extrabold text-slate-900 uppercase tracking-wide text-sm">
                  Team Investigators ({investigators.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold uppercase">
                Created Accounts History
              </span>
            </div>

            {investigators.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">
                  No investigator accounts created yet.
                </p>
                <p className="text-[11px] text-slate-400">
                  Use the form on the left to add team investigators.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-95 overflow-y-auto pr-1">
                {investigators.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between hover:bg-slate-100/80 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {inv.username}
                        </span>
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                          {inv.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ID: {inv.id}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 font-medium block">
                        Created
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="text-center text-xs font-semibold text-slate-400 py-4 mt-6">
        Kilatis System • Admin Portal
      </footer>
    </div>
  );
}
