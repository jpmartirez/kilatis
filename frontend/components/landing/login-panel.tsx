/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert, LogIn, Lock, Eye, EyeOff, UserPlus, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { loginUser, seedInitialAdmin } from "@/lib/api";

export const LoginPanel = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [seedUser, setSeedUser] = useState("");
  const [seedPass, setSeedPass] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const data = await loginUser(username, password);
      // Store token and user metadata in localStorage & cookies for middleware route protection
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      document.cookie = `auth_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `user_role=${data.user.role}; path=/; max-age=86400; SameSite=Lax`;

      setSuccessMsg(`Welcome, ${data.user.username}! Redirecting...`);
      
      setTimeout(() => {
        if (data.user.role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/main");
        }
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      await seedInitialAdmin(seedUser, seedPass);
      setSuccessMsg(`Admin account "${seedUser}" created successfully! You can now log in.`);
      setUsername(seedUser);
      setPassword(seedPass);
      setShowSeedModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create seed admin");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-[#e4ebf3] rounded-[2rem] p-5 sm:p-6 lg:p-6 flex flex-col justify-between shadow-xl border border-slate-200/50 h-full lg:min-h-0 lg:overflow-hidden gap-4 lg:gap-3">
      {/* 1. Authorized Personnel Warning Banner */}
      <div className="bg-[#ab2b23] text-white rounded-xl py-3 sm:py-3.5 lg:py-2.5 px-4 text-center font-extrabold tracking-wider uppercase text-xs sm:text-sm lg:text-sm flex items-center justify-center gap-2 shadow-sm border border-red-700/20 shrink-0">
        <TriangleAlert className="w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 text-white shrink-0" />
        <span>AUTHORIZED PERSONNEL ONLY</span>
      </div>

      {/* 2. Login Sub-header */}
      <div className="bg-[#dce4ee]/80 rounded-xl p-3.5 sm:p-4 lg:p-3 px-5 flex items-center justify-between border border-slate-200/60 shrink-0">
        <div className="flex items-center gap-3">
          <LogIn className="w-6 h-6 lg:w-5 lg:h-5 text-slate-900 shrink-0 stroke-[2.5]" />
          <h2 className="text-xl sm:text-2xl lg:text-2xl font-black text-slate-900 tracking-wider uppercase">
            LOGIN
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowSeedModal(!showSeedModal)}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-white/60 hover:bg-white px-2.5 py-1 rounded-lg border border-slate-300/60 transition-all cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Seed Admin</span>
        </button>
      </div>

      {/* Seed Admin Drawer / Inline Form */}
      {showSeedModal && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shrink-0 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase text-amber-900 tracking-wide">
              Initialize First Admin Account
            </h4>
            <button
              onClick={() => setShowSeedModal(false)}
              className="text-amber-700 text-xs font-bold"
            >
              Close
            </button>
          </div>
          <form onSubmit={handleSeedAdmin} className="space-y-2">
            <Input
              type="text"
              placeholder="Admin Username"
              value={seedUser}
              onChange={(e) => setSeedUser(e.target.value)}
              className="bg-white border-amber-300 h-9 text-xs"
              required
            />
            <Input
              type="password"
              placeholder="Admin Password"
              value={seedPass}
              onChange={(e) => setSeedPass(e.target.value)}
              className="bg-white border-amber-300 h-9 text-xs"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-800 hover:bg-amber-900 text-white rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              Create Root Admin
            </button>
          </form>
        </div>
      )}

      {/* 3. Main Login Credentials Box */}
      <div className="bg-[#ecf2f8] rounded-2xl p-5 sm:p-6 lg:p-6 border border-slate-200/90 shadow-sm flex-1 lg:min-h-0 flex flex-col justify-center">
        <p className="text-slate-700 font-medium text-sm lg:text-sm mb-3">
          Welcome, Enter your credentials here.
        </p>

        <div className="w-full h-px bg-slate-300/80 mb-5 lg:mb-4" />

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-medium mb-3 flex items-center gap-2">
            <TriangleAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-xs font-medium mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-3">
          {/* USERNAME Field */}
          <div>
            <label
              htmlFor="username"
              className="block text-xs sm:text-sm lg:text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5"
            >
              USERNAME
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="enter your username here"
              className="bg-white/90 border-slate-200 text-slate-900 placeholder:text-slate-400/90 shadow-2xs h-11 sm:h-12 lg:h-10 text-sm font-medium"
              required
            />
          </div>

          {/* PASSWORD Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs sm:text-sm lg:text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5"
            >
              PASSWORD
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="enter your password here"
                className="bg-white/90 border-slate-200 text-slate-900 placeholder:text-slate-400/90 shadow-2xs h-11 sm:h-12 lg:h-10 text-sm font-medium pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit LOGIN Button */}
          <div className="pt-3 lg:pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1b232b] hover:bg-[#2b3642] text-white rounded-full py-3.5 lg:py-3 px-5 font-extrabold tracking-widest text-sm lg:text-sm uppercase flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4 stroke-[2.5]" />
              <span>{isLoading ? "AUTHENTICATING..." : "LOGIN"}</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
