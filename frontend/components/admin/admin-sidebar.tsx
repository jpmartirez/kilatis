"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type AdminTab = "dashboard" | "accounts";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  adminUsername?: string;
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  adminUsername = "ADMIN",
  onLogout,
}) => {
  return (
    <>
      {/* ============================================================== */}
      {/* MOBILE / TABLET TOP NAVIGATION BAR (< lg)                     */}
      {/* ============================================================== */}
      <div className="lg:hidden w-full bg-[#181f2a] text-white border-b border-slate-800 px-4 py-3.5 sticky top-0 z-40">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <Image
              src="/kilatisLogo.png"
              alt="KILATIS"
              width={28}
              height={28}
              className="w-7 h-7 object-contain shrink-0"
              priority
            />
            <div>
              <div className="text-xs font-black tracking-wider uppercase">KILATIS</div>
              <div className="text-[10px] text-slate-400 font-mono tracking-tight">ADMIN CONSOLE</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
              {adminUsername.toUpperCase()}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1 rounded-full border border-slate-700 transition-colors"
            >
              LOGOUT
            </button>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => onTabChange("dashboard")}
            className={cn(
              "py-2 px-3 text-xs font-bold rounded-lg transition-all text-center tracking-wider uppercase",
              activeTab === "dashboard"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => onTabChange("accounts")}
            className={cn(
              "py-2 px-3 text-xs font-bold rounded-lg transition-all text-center tracking-wider uppercase",
              activeTab === "accounts"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Account Creation
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* DESKTOP SIDEBAR (>= lg)                                        */}
      {/* ============================================================== */}
      <aside className="hidden lg:flex w-64 shrink-0 min-h-screen bg-[#181f2a] text-slate-100 border-r border-slate-800 flex-col justify-between p-6 sticky top-0 h-screen">
        <div className="space-y-8">
          {/* Brand Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/kilatisLogo.png"
                alt="KILATIS"
                width={36}
                height={36}
                className="w-9 h-9 object-contain shrink-0"
                priority
              />
              <div>
                <h1 className="text-base font-black tracking-tight uppercase text-white font-sans">
                  KILATIS
                </h1>
                <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  FORENSIC PORTAL
                </p>
              </div>
            </div>

            {/* Active User Status */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                ACTIVE ADMIN
              </div>
              <div className="text-xs font-bold text-white tracking-wide truncate">
                {adminUsername}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 px-3 pb-1">
              NAVIGATION
            </div>

            <button
              type="button"
              onClick={() => onTabChange("dashboard")}
              className={cn(
                "w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-between cursor-pointer",
                activeTab === "dashboard"
                  ? "bg-white text-slate-950 font-black shadow-xs"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              )}
            >
              <span>Dashboard</span>
              {activeTab === "dashboard" && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onTabChange("accounts")}
              className={cn(
                "w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-between cursor-pointer",
                activeTab === "accounts"
                  ? "bg-white text-slate-950 font-black shadow-xs"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              )}
            >
              <span>Account Creation</span>
              {activeTab === "accounts" && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
              )}
            </button>
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-red-950/60 hover:text-red-300 hover:border-red-900/60 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center"
          >
            LOGOUT
          </button>
          <p className="text-[10px] text-center font-mono text-slate-500">
            KILATIS v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
};
