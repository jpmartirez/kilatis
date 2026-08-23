"use client";

import React from "react";
import { ImageAnalysisResult } from "@/lib/api";

interface PerStreamEvidenceProps {
  result: ImageAnalysisResult;
  spatialPct: number;
  noisePct: number;
  frequencyPct: number;
  isSpliced: boolean;
}

export const PerStreamEvidence: React.FC<PerStreamEvidenceProps> = ({
  result,
  spatialPct,
  noisePct,
  frequencyPct,
  isSpliced,
}) => {
  return (
    <div className="bg-[#e4ebf3] rounded-3xl p-5 border border-slate-300/80 shadow-xs space-y-4 text-xs">
      <div className="space-y-1">
        <p className="text-slate-800 font-medium leading-relaxed">
          <strong className="font-bold text-slate-900">Findings: </strong>
          {result.headline || "Dual-branch forensic analysis completed across spatial and frequency domains."}
        </p>
        {result.detail && result.detail.length > 0 && (
          <p className="text-slate-500 text-[11px]">
            {result.detail.join(" • ")}
          </p>
        )}
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-300/60">
        <span className="font-black text-[11px] uppercase tracking-wider text-slate-700 block">
          PER-STREAM EVIDENCE
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Spatial Metric */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
              SPATIAL
            </span>
            <span className="text-2xl font-black text-slate-900 block font-mono">
              {spatialPct}%
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              {spatialPct > 50 ? "Boundary artifact" : "Consistent edge gradients"}
            </span>
          </div>

          {/* Noise / Splice Metric */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
              NOISE (PRNU)
            </span>
            <span className="text-2xl font-black text-slate-900 block font-mono">
              {noisePct}%
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              {isSpliced ? "PRNU & noise mismatch" : "Uniform camera sensor noise"}
            </span>
          </div>

          {/* Frequency Metric */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
              FREQUENCY
            </span>
            <span className="text-2xl font-black text-slate-900 block font-mono">
              {frequencyPct}%
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              {frequencyPct > 50 ? "High DCT deviation" : "Standard DCT distribution"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
