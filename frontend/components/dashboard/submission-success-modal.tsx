"use client";

import React from "react";
import { CheckCircle2, ShieldAlert, ArrowRight, RotateCcw } from "lucide-react";

interface SubmissionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseNumber: string;
  caseTitle: string;
  investigatorName: string;
  fileName: string;
  onReset: () => void;
}

export const SubmissionSuccessModal: React.FC<SubmissionSuccessModalProps> = ({
  isOpen,
  onClose,
  caseNumber,
  caseTitle,
  investigatorName,
  fileName,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-slate-800 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header with Success Icon */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black uppercase text-slate-900 tracking-wide">
            EVIDENCE INITIALIZED
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            The case file and questioned evidence have been registered for tri-stream forensic analysis.
          </p>
        </div>

        {/* Case Summary Details */}
        <div className="bg-[#edf2f7] rounded-2xl p-4 sm:p-5 space-y-3 text-xs border border-slate-300/60 font-medium">
          <div className="flex justify-between items-center pb-2 border-b border-slate-300/60">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              Case Number
            </span>
            <span className="font-mono font-bold text-slate-900">{caseNumber}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-300/60">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              Case Title
            </span>
            <span className="font-bold text-slate-900 truncate max-w-50">{caseTitle}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-300/60">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              Investigator
            </span>
            <span className="font-bold text-slate-900">{investigatorName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              Evidence File
            </span>
            <span className="font-mono font-bold text-slate-900 truncate max-w-50">{fileName}</span>
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Chain of custody log generated and signed by active investigator session.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Evidence</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-full py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Close Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
