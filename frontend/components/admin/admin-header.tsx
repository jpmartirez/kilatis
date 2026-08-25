"use client";

import React from "react";
import { User as UserIcon, LogOut } from "lucide-react";

interface AdminHeaderProps {
  adminUsername?: string;
  onLogout: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  adminUsername = "ADMIN",
  onLogout,
}) => {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 pb-2">
      {/* Left: Icon + Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-xs">
          <UserIcon className="w-4 h-4 fill-white" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase font-sans">
          ADMIN PAGE
        </h1>
      </div>

      {/* Right: Active Admin Capsule & Logout */}
      <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
        <div className="bg-[#243346] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full flex items-center gap-2.5 text-xs font-mono shadow-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-bold text-white tracking-wider text-[11px] sm:text-xs">
            ACTIVE: {adminUsername.toUpperCase()}
          </span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-300 rounded-full transition-all shadow-2xs cursor-pointer tracking-wider"
          title="Logout"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">LOGOUT</span>
        </button>
      </div>
    </header>
  );
};
