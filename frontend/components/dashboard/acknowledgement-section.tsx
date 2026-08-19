"use client";

import React from "react";
import { Check } from "lucide-react";

interface AcknowledgementSectionProps {
  ackForensicStandards: boolean;
  setAckForensicStandards: (val: boolean) => void;
  ackSubmissionLog: boolean;
  setAckSubmissionLog: (val: boolean) => void;
}

export const AcknowledgementSection: React.FC<AcknowledgementSectionProps> = ({
  ackForensicStandards,
  setAckForensicStandards,
  ackSubmissionLog,
  setAckSubmissionLog,
}) => {
  return (
    <section className="space-y-3">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2.5">
        <div className="flex items-center gap-2">
          {/* Numbered Step Circle */}
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-xs sm:text-xs text-slate-900 shrink-0">
            3
          </div>
          <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-wide uppercase">
            ACKNOWLEDGEMENT
          </h2>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
          Certify that you acknowledge the session and analysis.
        </p>
      </div>

      {/* Card Body */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/80 space-y-4">
        {/* Checkbox Item 1 */}
        <label className="flex items-start gap-3.5 cursor-pointer group select-none">
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              type="checkbox"
              checked={ackForensicStandards}
              onChange={(e) => setAckForensicStandards(e.target.checked)}
              className="peer sr-only"
            />
            <div
              className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                ackForensicStandards
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-400 group-hover:border-slate-600"
              }`}
            >
              {ackForensicStandards && <Check className="w-3.5 h-3.5 stroke-3" />}
            </div>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed flex-1">
            I certify that this evidence has been properly collected, documented, and maintained in accordance with forensic standards.{" "}
            <span className="text-[10px] text-red-500 font-bold italic whitespace-nowrap">
              *Required
            </span>
          </span>
        </label>

        {/* Checkbox Item 2 */}
        <label className="flex items-start gap-3.5 cursor-pointer group select-none">
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              type="checkbox"
              checked={ackSubmissionLog}
              onChange={(e) => setAckSubmissionLog(e.target.checked)}
              className="peer sr-only"
            />
            <div
              className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                ackSubmissionLog
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-400 group-hover:border-slate-600"
              }`}
            >
              {ackSubmissionLog && <Check className="w-3.5 h-3.5 stroke-3" />}
            </div>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed flex-1">
            I acknowledge that this submission will be logged and subjected to forensic analysis.{" "}
            <span className="text-[10px] text-red-500 font-bold italic whitespace-nowrap">
              *Required
            </span>
          </span>
        </label>
      </div>
    </section>
  );
};
