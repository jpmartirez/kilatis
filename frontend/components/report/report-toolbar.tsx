"use client";

import React from "react";
import { Printer, Download, FileText, ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Loader2 } from "lucide-react";
import Link from "next/link";

interface ReportToolbarProps {
  reportNo?: string;
  caseNumber: string;
  zoomLevel: number;
  isGeneratingPdf?: boolean;
  isCompleting?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
  onCompleteReport: () => void;
}

export const ReportToolbar: React.FC<ReportToolbarProps> = ({
  reportNo,
  caseNumber,
  zoomLevel,
  isGeneratingPdf = false,
  isCompleting = false,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onPrint,
  onDownloadPdf,
  onCompleteReport,
}) => {
  const displayReportNo = reportNo || `${caseNumber || "KIL-0417-2026"}-R1`;
  const displayCaseNo = caseNumber || "KIL-0417-2026";

  return (
    <header className="sticky top-0 z-50 w-full bg-[#f1f5f9]/95 backdrop-blur-md border-b border-slate-300/80 shadow-xs py-2 px-3 sm:px-6 print:hidden">
      <div className="max-w-[96rem] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Back button + Dark Capsule with REPORT NO & CASE NO */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <Link
            href="/results"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full transition-colors shadow-2xs cursor-pointer"
            title="Back to Results"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Back</span>
          </Link>

          <div className="bg-[#243346] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-2 sm:gap-3 text-xs font-mono shadow-xs">
            <div className="hidden lg:flex items-center gap-1.5">
              <span className="text-slate-400 font-bold tracking-wider text-[10px]">
                REPORT:
              </span>
              <span className="font-bold text-white tracking-wide text-xs">
                {displayReportNo}
              </span>
            </div>
            <span className="hidden lg:inline text-slate-500">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold tracking-wider text-[10px]">
                CASE:
              </span>
              <span className="font-bold text-white tracking-wide text-xs">
                {displayCaseNo}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Zoom Controls + Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Subtle Zoom Controls (Hidden on very small mobile, visible on sm+) */}
          <div className="hidden sm:flex items-center gap-0.5 sm:gap-1 bg-white border border-slate-300 rounded-full px-2 sm:px-2.5 py-1 sm:py-1.5 shadow-2xs">
            <button
              type="button"
              onClick={onZoomOut}
              disabled={zoomLevel <= 50}
              title="Zoom Out (-)"
              className="p-0.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] sm:text-xs font-mono font-bold px-1 sm:px-1.5 text-slate-700 min-w-[2.5rem] sm:min-w-[2.8rem] text-center">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={onZoomIn}
              disabled={zoomLevel >= 150}
              title="Zoom In (+)"
              className="p-0.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onZoomReset}
              title="Reset Zoom"
              className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors border-l border-slate-200 ml-0.5 sm:ml-1 pl-0.5 sm:pl-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Print Button */}
          <button
            type="button"
            onClick={onPrint}
            title="Print Report"
            className="flex items-center gap-1.5 bg-[#18181b] hover:bg-[#27272a] text-white text-xs font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full transition-all active:scale-[0.98] shadow-xs cursor-pointer tracking-wider"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">PRINT</span>
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            title="Download PDF"
            className="flex items-center gap-1.5 bg-[#18181b] hover:bg-[#27272a] disabled:opacity-60 text-white text-xs font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full transition-all active:scale-[0.98] shadow-xs cursor-pointer tracking-wider"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {isGeneratingPdf ? "GENERATING..." : "DOWNLOAD PDF"}
            </span>
            <span className="sm:hidden">PDF</span>
          </button>

          {/* Complete Report Button */}
          <button
            type="button"
            onClick={onCompleteReport}
            disabled={isCompleting || isGeneratingPdf}
            title="Complete & Reset Report"
            className="flex items-center gap-1.5 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-60 text-white text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all active:scale-[0.98] shadow-xs cursor-pointer tracking-wider"
          >
            {isCompleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span className="hidden lg:inline">
              {isCompleting ? "COMPLETING..." : "COMPLETE REPORT"}
            </span>
            <span className="lg:hidden">
              {isCompleting ? "COMPLETING..." : "COMPLETE"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
