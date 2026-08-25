"use client";

import React from "react";
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface CreateInvestigatorCardProps {
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  success: string | null;
}

export const CreateInvestigatorCard: React.FC<CreateInvestigatorCardProps> = ({
  username,
  setUsername,
  password,
  setPassword,
  onSubmit,
  loading,
  error,
  success,
}) => {
  return (
    <section className="bg-[#e4ebf3] rounded-3xl sm:rounded-[2.2rem] p-5 sm:p-8 border border-slate-300/80 shadow-sm space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-slate-900 flex items-center justify-center shrink-0" />
          <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-wide uppercase font-sans">
            CREATE INVESTIGATOR ACCOUNT
          </h2>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-500 font-medium pl-7 sm:pl-0">
          Create investigator accounts for team members.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Form Body */}
      <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
        {/* Username Field */}
        <div>
          <label
            htmlFor="username"
            className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2"
          >
            USERNAME
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="enter your user id here e.g. KLT-9043"
            className="w-full bg-[#edf2f7] hover:bg-[#e7eff6] focus:bg-white text-slate-900 placeholder:text-slate-400 placeholder:text-xs text-xs sm:text-sm font-medium rounded-full h-11 sm:h-12 px-5 border border-transparent focus:border-slate-300 focus:outline-hidden transition-all shadow-2xs"
            required
          />
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2"
          >
            PASSWORD
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="enter your password here"
            className="w-full bg-[#edf2f7] hover:bg-[#e7eff6] focus:bg-white text-slate-900 placeholder:text-slate-400 placeholder:text-xs text-xs sm:text-sm font-medium rounded-full h-11 sm:h-12 px-5 border border-transparent focus:border-slate-300 focus:outline-hidden transition-all shadow-2xs"
            required
          />
        </div>

        {/* Submit Button */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full bg-[#1b232b] hover:bg-[#2b3744] text-white rounded-full py-3.5 sm:py-4 px-6 font-black tracking-widest text-xs sm:text-sm uppercase flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.99] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>CREATING ACCOUNT...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
                <span>CREATE ACCOUNT</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
