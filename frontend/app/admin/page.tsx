/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
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
      <div className="min-h-screen w-full bg-white flex items-center justify-center font-sans text-neutral-600">
        <div className="flex items-center gap-2.5 px-4 py-2 border border-neutral-200 rounded">
          <Loader2 className="w-4 h-4 animate-spin text-neutral-800" />
          <span className="text-xs font-medium uppercase tracking-wider">Verifying Admin Access...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-800">
      {/* Simple Minimalist Navbar */}
      <header className="relative bg-white border-b border-neutral-200 px-6 py-3.5 flex items-center justify-between">
        <div className="text-xs text-neutral-500 font-medium">
          {currentUser?.username ? `Admin: ${currentUser.username}` : ""}
        </div>

        {/* Center Text */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-wide text-neutral-900">
          Admin Page
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
      <main className="flex-1 p-6 max-w-5xl w-full mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Create Investigator Form */}
          <div className="lg:col-span-5 bg-white rounded-lg p-6 border border-neutral-200 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900 text-sm mb-1">
                Create Investigator Account
              </h3>
              <p className="text-xs text-neutral-500 mb-4 font-normal">
                Create investigator accounts for team members.
              </p>

              {error && (
                <div className="bg-neutral-100 border border-neutral-300 text-neutral-800 p-3 rounded text-xs font-medium mb-4">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-neutral-100 border border-neutral-300 text-neutral-800 p-3 rounded text-xs font-medium mb-4">
                  {success}
                </div>
              )}

              <form onSubmit={handleCreateInvestigator} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Username
                  </label>
                  <Input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. inv_john"
                    className="bg-white border-neutral-200 text-xs h-9 rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password"
                    className="bg-white border-neutral-200 text-xs h-9 rounded"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded py-2 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: List of Investigators */}
          <div className="lg:col-span-7 bg-white rounded-lg p-6 border border-neutral-200 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-900 text-sm">
                Investigators ({investigators.length})
              </h3>
              <span className="text-xs text-neutral-400">
                Team Roster
              </span>
            </div>

            {investigators.length === 0 ? (
              <div className="text-center py-10 bg-neutral-50 rounded border border-neutral-200">
                <p className="text-xs text-neutral-500">
                  No investigator accounts found.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {investigators.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-neutral-50 border border-neutral-200 rounded p-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs text-neutral-900">
                          {inv.username}
                        </span>
                        <span className="bg-neutral-200 text-neutral-700 text-[10px] px-1.5 py-0.5 rounded font-mono">
                          {inv.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        ID: {inv.id}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-neutral-500 block">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
