"use client";

import React from "react";
import { Printer, Download, FileText, ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Loader2 } from "lucide-react";
import Link from "next/link";

interface ReportToolbarProps {
  reportNo?: string;
  caseNumber: string;
  zoomLevel: number;
  isGeneratingPdf?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
}

export const ReportToolbar: React.FC<ReportToolbarProps> = ({
  reportNo,
  caseNumber,
  zoomLevel,
  isGeneratingPdf = false,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onPrint,
  onDownloadPdf,
}) => {
  const displayReportNo = reportNo || `${caseNumber || "KIL-0417-2026"}-R1`;
  const displayCaseNo = caseNumber || "KIL-0417-2026";

  return (
    <header className="sticky top-0 z-50 w-full bg-[#f1f5f9]/90 backdrop-blur-md border-b border-slate-300 shadow-xs py-3 px-4 print:hidden">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back button + Dark Capsule with REPORT NO & CASE NO */}
        <div className="flex items-center gap-3">
          <Link
            href="/results"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-full transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Results</span>
          </Link>

          <div className="bg-[#243346] text-white px-5 py-2 rounded-full flex items-center gap-4 text-xs font-mono shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold tracking-wider text-[11px]">
                REPORT NO:
              </span>
              <span className="font-bold text-white tracking-wide">
                {displayReportNo}
              </span>
            </div>
            <span className="text-slate-500">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold tracking-wider text-[11px]">
                CASE NO:
              </span>
              <span className="font-bold text-white tracking-wide">
                {displayCaseNo}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Subtle Zoom Controls */}
        <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-full px-2.5 py-1 shadow-2xs">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={zoomLevel <= 50}
            title="Zoom Out (-)"
            className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono font-bold px-2 text-slate-700 min-w-[3.2rem] text-center">
            {zoomLevel}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            disabled={zoomLevel >= 150}
            title="Zoom In (+)"
            className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onZoomReset}
            title="Reset Zoom"
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors border-l border-slate-200 ml-1 pl-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Right: Black Pills (Print, Download) + Green Pill (Complete Report) */}
        <div className="flex items-center gap-2">
          {/* Print Button */}
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-2 bg-[#18181b] hover:bg-[#27272a] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all active:scale-[0.98] shadow-xs cursor-pointer tracking-wider"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT REPORT</span>
          </button>

          {/* Download PDF Button with @react-pdf/renderer generator */}
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 bg-[#18181b] hover:bg-[#27272a] disabled:opacity-60 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all active:scale-[0.98] shadow-xs cursor-pointer tracking-wider"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isGeneratingPdf ? "GENERATING PDF..." : "DOWNLOAD REPORT (PDF)"}</span>
          </button>

          {/* Complete Report Button */}
          <button
            type="button"
            onClick={() =>
              alert(
                "Complete Report submission & archival will be available in the next phase."
              )
            }
            className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all active:scale-[0.98] shadow-xs cursor-pointer tracking-wider"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>COMPLETE REPORT</span>
          </button>
        </div>
      </div>
    </header>
  );
};
