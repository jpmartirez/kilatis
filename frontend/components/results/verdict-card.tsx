"use client";

import React from "react";
import { VerdictCardData } from "@/types/results";

interface VerdictCardProps {
  verdictData: VerdictCardData;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({ verdictData }) => {
  return (
    <div className="bg-[#e4ebf3] rounded-3xl p-4 sm:p-5 border border-slate-300/80 shadow-xs space-y-2">
      <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 text-center block">
        VERDICT
      </span>
      <div className={`${verdictData.bg} rounded-2xl p-4 sm:p-5 text-center space-y-1 shadow-md`}>
        <span className="text-[10px] font-black uppercase tracking-widest block opacity-85">
          {verdictData.subtitle}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
          {verdictData.title}
        </h2>
        <span className="text-[11px] font-mono font-bold tracking-wide block pt-1 opacity-90">
          CONFIDENCE: {verdictData.conf}
        </span>
      </div>
    </div>
  );
};
