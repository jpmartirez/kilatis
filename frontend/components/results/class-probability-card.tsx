"use client";

import React from "react";
import { ProbBarItem } from "@/types/results";

interface ClassProbabilityCardProps {
  probBars: ProbBarItem[];
}

export const ClassProbabilityCard: React.FC<ClassProbabilityCardProps> = ({
  probBars,
}) => {
  return (
    <div className="bg-[#e4ebf3] rounded-3xl p-4 sm:p-5 border border-slate-300/80 shadow-xs space-y-3 text-center">
      <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block">
        CLASS PROBABILITY
      </span>

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        {/* Visual Bar Chart */}
        <div className="h-28 flex items-end justify-between px-4 gap-4 border-b border-slate-100 pb-2">
          {probBars.map((bar) => (
            <div
              key={bar.label}
              className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
            >
              <div
                className={`w-3.5 sm:w-4 rounded-full transition-all duration-300 ${
                  bar.height > 60
                    ? "bg-[#e52538]"
                    : bar.height > 30
                    ? "bg-slate-700"
                    : "bg-slate-400"
                }`}
                style={{ height: `${Math.max(bar.height, 8)}%` }}
              />
            </div>
          ))}
        </div>

        {/* Bar Labels & Values */}
        <div className="flex items-start justify-between text-[10px] font-bold text-slate-600 leading-tight">
          {probBars.map((bar) => (
            <div key={bar.label} className="flex-1 text-center">
              <span className="block truncate px-0.5" title={bar.label}>
                {bar.label}
              </span>
              <span className="font-mono text-[9px] text-slate-400 block pt-0.5">
                {Math.round(bar.val * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
