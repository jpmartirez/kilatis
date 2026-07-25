"use client";

import React, { useState } from "react";
import { TriangleAlert, LogIn, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

export const LoginPanel = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Logging in with", { userId, password });
  };

  return (
    <section className="bg-[#e4ebf3] rounded-[2rem] p-5 sm:p-6 lg:p-6 flex flex-col justify-between shadow-xl border border-slate-200/50 h-full lg:min-h-0 lg:overflow-hidden gap-4 lg:gap-3">
      {/* 1. Authorized Personnel Warning Banner */}
      <div className="bg-[#ab2b23] text-white rounded-xl py-3 sm:py-3.5 lg:py-2.5 px-4 text-center font-extrabold tracking-wider uppercase text-xs sm:text-sm lg:text-sm flex items-center justify-center gap-2 shadow-sm border border-red-700/20 shrink-0">
        <TriangleAlert className="w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 text-white shrink-0" />
        <span>AUTHORIZED PERSONNEL ONLY</span>
      </div>

      {/* 2. Login Sub-header */}
      <div className="bg-[#dce4ee]/80 rounded-xl p-3.5 sm:p-4 lg:p-3 px-5 flex items-center gap-3 border border-slate-200/60 shrink-0">
        <LogIn className="w-6 h-6 lg:w-5 lg:h-5 text-slate-900 shrink-0 stroke-[2.5]" />
        <h2 className="text-xl sm:text-2xl lg:text-2xl font-black text-slate-900 tracking-wider uppercase">
          LOGIN
        </h2>
      </div>

      {/* 3. Main Login Credentials Box */}
      <div className="bg-[#ecf2f8] rounded-2xl p-5 sm:p-6 lg:p-6 border border-slate-200/90 shadow-sm flex-1 lg:min-h-0 flex flex-col justify-center">
        <p className="text-slate-700 font-medium text-sm lg:text-sm mb-3">
          Welcome, Enter your credentials here.
        </p>

        <div className="w-full h-px bg-slate-300/80 mb-5 lg:mb-4" />

        <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-3">
          {/* USER ID Field */}
          <div>
            <label
              htmlFor="userId"
              className="block text-xs sm:text-sm lg:text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5"
            >
              USER ID
            </label>
            <Input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="enter your user id here e.g. KLT-9043"
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

            {/* Forgot Password Link */}
            <div className="text-right mt-2 lg:mt-1.5">
              <a
                href="#forgot-password"
                className="text-slate-600 hover:text-slate-900 text-xs sm:text-sm lg:text-xs font-bold transition-colors inline-block"
              >
                Forgot password?
              </a>
            </div>
          </div>

          {/* Submit LOGIN Button */}
          <div className="pt-3 lg:pt-2">
            <button
              type="submit"
              className="w-full bg-[#1b232b] hover:bg-[#2b3642] text-white rounded-full py-3.5 lg:py-3 px-5 font-extrabold tracking-widest text-sm lg:text-sm uppercase flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] cursor-pointer"
            >
              <Lock className="w-4 h-4 stroke-[2.5]" />
              <span>LOGIN</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
