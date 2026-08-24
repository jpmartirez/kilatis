"use client";

import React from "react";
import { HistorySessionItem } from "@/lib/api";

interface HistoryRowItemProps {
  item: HistorySessionItem;
}

export const HistoryRowItem: React.FC<HistoryRowItemProps> = ({ item }) => {
  // Format UTC to PST / readable timestamp
  const formatTimestamp = (isoStr: string): string => {
    try {
      const date = new Date(isoStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes} PST`;
    } catch {
      return isoStr;
    }
  };

  // Verdict pill color resolver
  const getVerdictStyle = (v: string) => {
    const vUpper = v.toUpperCase();
    if (vUpper.includes("SPLICE")) {
      return "text-red-700 bg-red-50 border border-red-200";
    }
    if (vUpper.includes("AI") || vUpper.includes("DEEPFAKE")) {
      return "text-[#7c2d12] bg-[#7c2d12]/10 border border-[#7c2d12]/20";
    }
    if (vUpper.includes("AUTHENTIC")) {
      return "text-emerald-700 bg-emerald-50 border border-emerald-200";
    }
    return "text-slate-700 bg-slate-100 border border-slate-200";
  };

  const getVerdictLabel = (v: string) => {
    const vUpper = v.toUpperCase();
    if (vUpper.includes("AI") || vUpper.includes("DEEPFAKE")) {
      return "AI / DEEPFAKE";
    }
    return vUpper;
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center bg-white hover:bg-slate-50/90 rounded-2xl px-4 py-3 border border-slate-200/80 shadow-2xs transition-all duration-150">
      {/* Case Number */}
      <div className="col-span-3 font-mono font-black text-xs text-slate-900 truncate">
        {item.case_number}
      </div>

      {/* Case Title */}
      <div className="col-span-4 font-bold text-xs text-slate-800 uppercase tracking-tight truncate">
        {item.case_title}
      </div>

      {/* Timestamp */}
      <div className="col-span-3 text-[11px] font-semibold text-slate-600 font-mono">
        {formatTimestamp(item.created_at)}
      </div>

      {/* Verdicts */}
      <div className="col-span-2 flex flex-wrap gap-1 items-center justify-start">
        {item.verdicts && item.verdicts.length > 0 ? (
          item.verdicts.map((v, vIdx) => (
            <span
              key={vIdx}
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${getVerdictStyle(
                v
              )}`}
            >
              {getVerdictLabel(v)}
            </span>
          ))
        ) : (
          <span className="text-[10px] font-bold text-slate-400">N/A</span>
        )}
      </div>
    </div>
  );
};
