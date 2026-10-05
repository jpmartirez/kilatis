"use client";

import React from "react";
import { ImageAnalysisResult } from "@/lib/api";

interface DecisionBasisCardProps {
  result: ImageAnalysisResult;
}

const CONFIDENCE_STYLES: Record<string, { label: string; className: string }> = {
  high: { label: "HIGH CONFIDENCE", className: "bg-[#16a34a] text-white" },
  moderate: { label: "MODERATE CONFIDENCE", className: "bg-amber-500 text-white" },
  low: { label: "LOW CONFIDENCE", className: "bg-orange-600 text-white" },
  "manual review": { label: "MANUAL REVIEW", className: "bg-slate-700 text-white" },
};

export const DecisionBasisCard: React.FC<DecisionBasisCardProps> = ({ result }) => {
  const confidence = result.confidence?.toLowerCase() || "";
  const reasons = result.reasons ?? [];

  // Results produced before the learned decision layer carry neither field
  if (!confidence && reasons.length === 0) return null;

  const badge = CONFIDENCE_STYLES[confidence];
  const isManualReview = confidence === "manual review" || result.verdict === "Manual review";
  const showRulesVerdict =
    Boolean(result.rules_verdict) && result.rules_verdict !== result.verdict;

  return (
    <div className="bg-[#e4ebf3] rounded-3xl p-4 sm:p-5 border border-slate-300/80 shadow-xs space-y-3">
      <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 text-center block">
        DECISION BASIS
      </span>

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          {badge && (
            <span
              className={`${badge.className} text-[10px] font-black tracking-widest px-3 py-1 rounded-full`}
            >
              {badge.label}
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {result.decider === "learned" ? "Learned meta-classifier" : "Rule-based gates"}
          </span>
        </div>

        {isManualReview && (
          <p className="text-slate-700 font-medium leading-relaxed">
            Not confident enough — please check manually.
          </p>
        )}

        {reasons.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
              TOP EVIDENCE
            </span>
            <ul className="space-y-1">
              {reasons.slice(0, 3).map((reason) => (
                <li
                  key={reason}
                  className="text-[11px] text-slate-700 leading-snug pl-3 border-l-2 border-slate-300"
                >
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showRulesVerdict && (
          <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-100">
            Rule-based check: <strong className="text-slate-700">{result.rules_verdict}</strong>
          </p>
        )}
      </div>
    </div>
  );
};
