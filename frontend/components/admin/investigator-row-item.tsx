"use client";

import React from "react";
import { User } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

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
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="bg-white hover:bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 transition-all">
      {/* Left Details */}
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-slate-900 tracking-tight">
            {investigator.username}
          </span>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {investigator.role || "INVESTIGATOR"}
          </Badge>
          <Badge variant="success" className="font-mono text-[10px]">
            ACTIVE
          </Badge>
        </div>
        <div className="text-[11px] font-mono text-slate-400 truncate">
          ID: {investigator.id}
        </div>
      </div>

      {/* Right Details & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        <span className="text-xs font-mono text-slate-500 font-medium">
          Created: {formatDate(investigator.created_at)}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onResetPassword(investigator)}
            className="text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-slate-200 uppercase tracking-wider"
          >
            Reset Password
          </button>

          <button
            type="button"
            onClick={() => onDelete(investigator)}
            className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-red-200 uppercase tracking-wider"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
