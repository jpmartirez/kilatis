"use client";

import React from "react";
import { User } from "@/lib/api";
import { KeyRound, Trash2 } from "lucide-react";

interface InvestigatorRowItemProps {
  investigator: User;
  onResetPassword: (user: User) => void;
  onDelete: (user: User) => void;
}

export const InvestigatorRowItem: React.FC<InvestigatorRowItemProps> = ({
  investigator,
  onResetPassword,
  onDelete,
}) => {
  const formatDate = (isoStr: string): string => {
    try {
      const d = new Date(isoStr);
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const yr = d.getFullYear();
      return `${m}/${day}/${yr}`;
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="bg-white hover:bg-slate-50/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 transition-all duration-150">
      {/* Left Details */}
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-black text-xs sm:text-sm text-slate-900 tracking-tight">
            {investigator.username}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
            {investigator.role || "INVESTIGATOR"}
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 truncate">
          ID: {investigator.id}
        </div>
      </div>

      {/* Right Details & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        <span className="text-xs font-semibold text-slate-600 font-mono">
          {formatDate(investigator.created_at)}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onResetPassword(investigator)}
            title="Reset Password"
            className="p-2 text-slate-500 hover:text-[#243346] bg-slate-100 hover:bg-[#243346]/10 rounded-full transition-colors cursor-pointer border border-transparent hover:border-[#243346]/20"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(investigator)}
            title="Delete Account"
            className="p-2 text-slate-500 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded-full transition-colors cursor-pointer border border-transparent hover:border-red-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
