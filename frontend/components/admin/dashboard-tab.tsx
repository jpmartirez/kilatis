"use client";

import React, { useState } from "react";
import { User, MonthlyStatsResponse } from "@/lib/api";
import { VerdictStatsChart } from "./verdict-stats-chart";
import { AccountHistoryTable } from "./account-history-table";
import { cn } from "@/lib/utils";

interface DashboardTabProps {
  statsData: MonthlyStatsResponse | null;
  loadingStats: boolean;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onRefreshStats: () => void;
  investigators: User[];
  loadingInvestigators: boolean;
  onNavigateToAccounts: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  statsData,
  loadingStats,
  selectedMonth,
  onSelectMonth,
  onRefreshStats,
  investigators,
  loadingInvestigators,
  onNavigateToAccounts,
}) => {
  const [subTab, setSubTab] = useState<"verdicts" | "accounts">("verdicts");

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* DASHBOARD HEADER & SUB-TABS                                   */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase font-sans">
            FORENSIC DASHBOARD
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            System-wide verdict analytics, monthly forensic volume, and investigator audit logs.
          </p>
        </div>

        {/* Sub-tab Switcher (Verdict Analytics vs Account History) */}
        <div className="inline-flex bg-slate-200/80 p-1 rounded-xl border border-slate-300/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSubTab("verdicts")}
            className={cn(
              "px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer",
              subTab === "verdicts"
                ? "bg-white text-slate-900 shadow-2xs font-black"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Verdict Analytics
          </button>
          <button
            type="button"
            onClick={() => setSubTab("accounts")}
            className={cn(
              "px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer",
              subTab === "accounts"
                ? "bg-white text-slate-900 shadow-2xs font-black"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Account History ({investigators.length})
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: VERDICT ANALYTICS & MONTHLY GRAPHS                 */}
      {/* ============================================================== */}
      {subTab === "verdicts" && (
        <VerdictStatsChart
          data={statsData}
          loading={loadingStats}
          selectedMonth={selectedMonth}
          onSelectMonth={onSelectMonth}
          onRefresh={onRefreshStats}
        />
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: ACCOUNT CREATION HISTORY                           */}
      {/* ============================================================== */}
      {subTab === "accounts" && (
        <AccountHistoryTable
          investigators={investigators}
          loading={loadingInvestigators}
          onNavigateToCreate={onNavigateToAccounts}
        />
      )}
    </div>
  );
};
