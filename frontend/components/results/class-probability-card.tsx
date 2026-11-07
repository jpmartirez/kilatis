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

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-4 text-left">
        {probBars.map((bar) => {
          const isAi =
            bar.label.toLowerCase().includes("ai") ||
            bar.label.toLowerCase().includes("deepfake");
          const isSplice = bar.label.toLowerCase().includes("splice");

          let threshold: number | undefined = undefined;
          if (bar.threshold !== undefined) {
            threshold = bar.threshold;
          } else if (isAi) {
            threshold = 0.5422;
          } else if (isSplice) {
            threshold = 0.4500;
          }

          const isPassed = threshold !== undefined && bar.val >= threshold;
          const barColor = isPassed ? "bg-[#dc2626]" : "bg-[#16a34a]";
          const textColor = isPassed ? "text-rose-600" : "text-emerald-600";
          const pctValue = (bar.val * 100).toFixed(1);

          return (
            <div key={bar.label} className="space-y-1.5">
              {/* Top row: Label, Threshold, and Value */}
              <div className="flex items-center justify-between text-xs">
                <span
                  className="font-bold text-slate-800 text-[11px] truncate max-w-[150px]"
                  title={bar.label}
                >
                  {bar.label}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  {threshold !== undefined && (
                    <span
                      className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/80 font-medium"
                      title={`Decision Threshold: ${(threshold * 100).toFixed(2)}% (${threshold.toFixed(4)})`}
                    >
                      Thr: {(threshold * 100).toFixed(2)}%
                    </span>
                  )}
                  <span className={`font-mono font-bold text-xs ${textColor}`}>
                    {pctValue}%
                  </span>
                </div>
              </div>

              {/* Horizontal Track & Progress Bar */}
              <div className="relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
                {/* Horizontal Fill Bar */}
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
                  style={{ width: `${Math.min(100, Math.max(0, bar.val * 100))}%` }}
                />

                {/* Vertical Threshold Marker */}
                {threshold !== undefined && (
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-slate-900 z-10 shadow-xs"
                    style={{ left: `${threshold * 100}%` }}
                    title={`Threshold: ${(threshold * 100).toFixed(2)}%`}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
            <span>&lt; Threshold</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
            <span>&ge; Threshold</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 font-mono">
            <span className="w-[2px] h-2.5 bg-slate-900 inline-block rounded-full" />
            <span>Threshold</span>
          </div>
        </div>
      </div>
    </div>
  );
};
