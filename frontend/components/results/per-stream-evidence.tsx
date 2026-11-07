"use client";

import React from "react";
import { ImageAnalysisResult } from "@/lib/api";

interface PerStreamEvidenceProps {
  result: ImageAnalysisResult;
  spatialPct: number;
  noisePct: number;
  frequencyPct: number;
  isSpliced?: boolean;
}

export const PerStreamEvidence: React.FC<PerStreamEvidenceProps> = ({
  result,
  spatialPct,
  noisePct,
  frequencyPct,
}) => {
  return (
    <div className="bg-[#e4ebf3] rounded-3xl p-4 sm:p-5 border border-slate-300/80 shadow-xs space-y-3 text-center">
      <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block">
        FINDINGS &amp; PER-STREAM EVIDENCE
      </span>

      {/* Findings Box */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2.5 text-left">
        <div className="border-b border-slate-100 pb-2">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Forensic Findings
          </span>
        </div>

        <p className="text-slate-800 font-medium leading-relaxed text-xs">
          {result.headline || "Dual-branch forensic analysis completed across spatial and frequency domains."}
        </p>

        {result.detail && result.detail.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
            {result.detail.map((d, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <span className="text-blue-500 font-bold">•</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-Stream Metrics (Percentage Only) */}
      <div className="space-y-2 text-left">
        {/* 1. Spatial Stream */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
              SPATIAL STREAM
            </span>
            <span className="text-xs font-bold text-slate-800">
              RGB + Laplacian Edges
            </span>
          </div>
          <span className="text-lg font-black text-slate-900 font-mono">
            {spatialPct}%
          </span>
        </div>

        {/* 2. Noise / Splice Stream */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
              NOISEPRINT STREAM
            </span>
            <span className="text-xs font-bold text-slate-800">
              Sensor Noise Inconsistency
            </span>
          </div>
          <span className="text-lg font-black text-slate-900 font-mono">
            {noisePct}%
          </span>
        </div>

        {/* 3. Frequency Stream */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
              FREQUENCY STREAM
            </span>
            <span className="text-xs font-bold text-slate-800">
              8x8 Block-DCT Spectral
            </span>
          </div>
          <span className="text-lg font-black text-slate-900 font-mono">
            {frequencyPct}%
          </span>
        </div>
      </div>
    </div>
  );
};
