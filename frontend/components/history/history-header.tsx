"use client";

import React from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";

interface HistoryHeaderProps {
  onBack: () => void;
}

export const HistoryHeader: React.FC<HistoryHeaderProps> = ({ onBack }) => {
  return (
    <div className="space-y-4">
      {/* Back Button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="bg-[#243342] hover:bg-[#1a2632] text-white px-5 py-2 rounded-full inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK</span>
        </button>
      </div>

      {/* Large Navy Title Banner */}
      <div className="bg-[#2a3c4d] text-white px-6 py-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-[#1d2b38] flex items-center justify-center shrink-0 border border-slate-600">
          <RotateCcw className="w-4 h-4 text-slate-100" />
        </div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-wide font-sans">
          HISTORY SESSIONS
        </h1>
      </div>
    </div>
  );
};
