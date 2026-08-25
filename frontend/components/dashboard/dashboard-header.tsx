"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogOut, User as UserIcon, History } from "lucide-react";

interface DashboardHeaderProps {
  investigatorName: string;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  investigatorName,
  onLogout,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full">
      {/* Left Title with Kilatis Logo */}
      <div className="flex items-center gap-3">
        <Image
          src="/kilatisLogo.png"
          alt="KILATIS Logo"
          width={40}
          height={40}
          className="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0 drop-shadow-xs"
          priority
        />

        <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-wide text-slate-900 uppercase">
          INITIALIZE IMAGE EVIDENCE
        </h1>
      </div>

      {/* Right: Active Session Badge */}
      <div className="relative self-start sm:self-auto">
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          className="bg-[#203140] hover:bg-[#1a2834] text-white pl-4 pr-3 py-2 sm:py-2.5 rounded-full flex items-center gap-2.5 sm:gap-3 transition-all shadow-sm cursor-pointer group"
          title="Active Session Details"
        >
          {/* Green Status Indicator */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>

          {/* Active Session Text */}
          <span className="text-xs sm:text-xs font-black tracking-wider uppercase whitespace-nowrap text-slate-100">
            ACTIVE SESSION:{" "}
            <span className="text-white font-extrabold">
              {investigatorName || "INVESTIGATOR"}
            </span>
          </span>

          {/* User Avatar Circle */}
          <div className="w-6 h-6 rounded-full bg-slate-700/80 text-white flex items-center justify-center shrink-0 border border-slate-600 group-hover:bg-slate-600 transition-colors">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Dropdown for Session & Logout */}
        {showMenu && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3.5 py-2 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-900 truncate">
                {investigatorName}
              </p>
            </div>

            <Link
              href="/history"
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer border-b border-slate-100"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>History Sessions</span>
            </Link>

            <button
              type="button"
              onClick={onLogout}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout Active Session</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
