"use client";

import React from "react";
import { ReportCaseData } from "@/types/report";

interface ReportFirstPageProps {
  caseData: ReportCaseData;
}

export const ReportFirstPage: React.FC<ReportFirstPageProps> = ({ caseData }) => {
  const caseNumber = caseData.caseNumber || "KIL-0417-2026";
  const caseTitle = caseData.caseTitle || "VERIFY SUSPECT IMAGE";
  const caseDescription =
    caseData.caseNotes || "";

  let dateAnalyzed = "2026-07-18 14:32 PST";
  let timestampShort = "07-18 · 14:32";

  if (caseData.analyzedAt) {
    try {
      const d = new Date(caseData.analyzedAt);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hr = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      dateAnalyzed = `${yr}-${mo}-${day} ${hr}:${min} PST`;
      timestampShort = `${mo}-${day} · ${hr}:${min}`;
    } catch {
      dateAnalyzed = caseData.analyzedAt;
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-start gap-3.5 font-sans h-full">
      {/* Title & Agency Subtitle */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase font-sans">
          FORENSIC ANALYSIS REPORT
        </h1>
        <p className="text-[10px] font-semibold text-slate-600 tracking-tight mt-0.5">
          Automated tri-stream tamper detection · Case {caseNumber} · Prepared for PNP Anti-Cybercrime Group
        </p>
      </div>

      {/* ① CASE INFORMATION */}
      <div className="bg-[#eef4f9] rounded-2xl p-4 shadow-2xs border border-slate-200/80 shrink-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-4 h-4 rounded-full border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-900 font-sans">
            1
          </div>
          <h2 className="text-xs font-black tracking-wide text-slate-950 uppercase font-sans">
            CASE INFORMATION
          </h2>
        </div>
        <p className="text-[10px] text-slate-500 font-medium mb-2 pl-6">
          Evidence and submission details recorded at intake.
        </p>

        {/* Inner White Box */}
        <div className="bg-white rounded-xl p-3 shadow-2xs border border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 text-[10px]">
          <div>
            <span className="text-[8px] font-bold font-sans text-slate-400 uppercase block tracking-wider">
              CASE NUMBER
            </span>
            <span className="font-bold text-slate-900 text-[10px] tracking-wide">
              {caseNumber}
            </span>
          </div>

          <div>
            <span className="text-[8px] font-bold font-sans text-slate-400 uppercase block tracking-wider">
              DATE ANALYZED
            </span>
            <span className="font-bold text-slate-900 text-[10px] tracking-wide">
              {dateAnalyzed}
            </span>
          </div>

          <div className="sm:col-span-2">
            <span className="text-[8px] font-bold font-sans text-slate-400 uppercase block tracking-wider">
              CASE TITLE
            </span>
            <span className="font-bold text-slate-900 text-[10px] tracking-wide uppercase">
              {caseTitle}
            </span>
          </div>
        </div>
      </div>

      {/* ② CONFIDENCE, LIMITATIONS & CHAIN OF CUSTODY */}
      <div className="bg-[#eef4f9] rounded-2xl p-4 shadow-2xs border border-slate-200/80 shrink-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-4 h-4 rounded-full border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-900 font-sans">
            2
          </div>
          <h3 className="text-xs font-black tracking-wide text-slate-950 uppercase font-sans">
            CONFIDENCE, LIMITATIONS & CHAIN OF CUSTODY
          </h3>
        </div>
        <p className="text-[10px] text-slate-500 font-medium mb-2 pl-6">
          What this result does and does not establish.
        </p>

        {/* Inner White Box */}
        <div className="bg-white rounded-xl p-3 shadow-2xs border border-slate-200/60 space-y-2 text-[10px]">
          <p className="text-slate-800 leading-relaxed font-sans text-[9.5px]">
            Performance varies by tampering type and image quality; heavily compressed or low-resolution images reduce reliability, particularly for the frequency-based indicator.
          </p>

          <div>
            <span className="text-[8px] font-bold font-sans text-slate-400 uppercase tracking-wider block mb-0.5">
              TIMESTAMP
            </span>

            <div className="space-y-1 text-[9px] font-sans">
              <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                <span className="font-mono text-slate-700">{timestampShort}</span>
                <span className="text-slate-900 font-medium">Tri-stream analysis completed</span>
                <span className="font-mono text-slate-700">KILATIS-TRISTREAM V1.0</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                <span className="font-mono text-slate-700">{timestampShort}</span>
                <span className="text-slate-900 font-medium">Report Generated</span>
                <span className="font-mono text-slate-700">KILATIS-TRISTREAM V1.0</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-700">{timestampShort}</span>
                <span className="text-slate-900 font-medium">PENDING EXAMINER REVIEW</span>
                <span className="font-mono text-slate-400">---------------------</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ③ CASE DESCRIPTION/NOTES (Flex to fill remaining space) */}
      <div className="bg-[#eef4f9] rounded-2xl p-4 shadow-2xs border border-slate-200/80 flex-1 flex flex-col min-h-[220px]">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-4 h-4 rounded-full border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-900 font-sans">
            3
          </div>
          <h3 className="text-xs font-black tracking-wide text-slate-950 uppercase font-sans">
            CASE DESCRIPTION/NOTES
          </h3>
        </div>
        <p className="text-[10px] text-slate-500 font-medium mb-2 pl-6">
          Information that relates to the investigation or case.
        </p>

        {/* Expansive Inner White Box */}
        <div className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200/60 flex-1 text-xs text-slate-800 leading-relaxed font-sans overflow-auto whitespace-pre-wrap">
          {caseDescription}
        </div>
      </div>
    </div>
  );
};
