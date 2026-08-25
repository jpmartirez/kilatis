"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface ResultsHeaderProps {
  filename: string;
  investigatorName: string;
  formattedDate: string;
  onNewAnalysis: () => void;
}

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  filename,
  investigatorName,
  formattedDate,
  onNewAnalysis,
}) => {
  return (
    <header className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
      {/* Logo Pill */}
      <div className="bg-white rounded-full px-5 py-2.5 shadow-xs border border-slate-200/80 flex items-center justify-between md:justify-start gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Image
            src="/kilatisLogo.png"
            alt="KILATIS Logo"
            width={24}
            height={24}
            className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0"
            priority
          />
          <span className="font-black text-sm tracking-widest text-slate-800 uppercase">
            KILATIS
          </span>
        </div>
        <button
          type="button"
          onClick={onNewAnalysis}
          className="text-[11px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer md:hidden"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      {/* Dark Information Capsule */}
      <div className="flex-1 bg-[#1e293b] text-white rounded-full px-5 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4 text-[10px] sm:text-[11px] font-medium tracking-wide">
        <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-1">
          <span className="truncate max-w-50 sm:max-w-xs font-mono uppercase font-bold text-slate-100">
            <strong className="text-slate-400 font-medium">FILE:</strong> {filename}
          </span>
          <span className="hidden sm:inline text-slate-200">
            <strong className="text-slate-400 font-medium">MODEL:</strong> KILATIS DUAL-BRANCH V1.0
          </span>
          <span className="text-slate-200">
            <strong className="text-slate-400 font-medium">UPLOADED BY:</strong> {investigatorName || "INVESTIGATOR"}
          </span>
          <span className="hidden lg:inline text-slate-300 font-mono">
            <strong className="text-slate-400 font-medium">ANALYZED:</strong> {formattedDate}
          </span>
        </div>

        <button
          type="button"
          onClick={onNewAnalysis}
          className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
          title="Clear stored results and return to evidence initialization"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>New Analysis</span>
        </button>
      </div>
    </header>
  );
};
