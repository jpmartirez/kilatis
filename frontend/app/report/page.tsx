"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getStoredResults } from "@/lib/storage";
import { ReportCaseData } from "@/types/report";
import { StoredResultItem } from "@/types";
import { ReportToolbar } from "@/components/report/report-toolbar";
import { ReportPageSheet } from "@/components/report/report-page-sheet";
import { ReportFirstPage } from "@/components/report/report-first-page";
import { ReportImagePage } from "@/components/report/report-image-page";
import { ReportLastPage } from "@/components/report/report-last-page";
import { ForensicReportDocument } from "@/components/report/pdf/forensic-report-document";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ReportPage() {
  const router = useRouter();
  const [caseData, setCaseData] = useState<ReportCaseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [examinerNotes, setExaminerNotes] = useState<string>("");

  // Load results from IndexedDB or sessionStorage
  useEffect(() => {
    async function loadData() {
      try {
        const stored = await getStoredResults<ReportCaseData>(
          "kilatis_active_results"
        );
        if (stored && stored.items && stored.items.length > 0) {
          setCaseData(stored);
          setExaminerNotes(stored.caseNotes || "");
        } else {
          // Fallback check sessionStorage
          const sess = sessionStorage.getItem("kilatis_active_results");
          if (sess) {
            const parsed = JSON.parse(sess);
            setCaseData(parsed);
            setExaminerNotes(parsed.caseNotes || "");
          }
        }
      } catch (err) {
        console.error("Failed to load report data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(150, prev + 10));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(50, prev - 10));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Download PDF Handler via @react-pdf/renderer
  const handleDownloadPdf = async () => {
    if (!caseData) return;
    try {
      setIsGeneratingPdf(true);
      const { pdf } = await import("@react-pdf/renderer");
      const doc = (
        <ForensicReportDocument
          caseData={caseData}
          examinerNotes={examinerNotes}
        />
      );
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Forensic_Report_${caseData.caseNumber || "KIL-0417-2026"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      // Fallback to browser print dialog
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const items = caseData?.items || [];
  const totalItems = items.length;

  // Total pages: 1 (Overview) + N (1 page per image) + 1 (Last page)
  const totalPages = useMemo(() => {
    if (totalItems === 0) return 0;
    return totalItems + 2;
  }, [totalItems]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-bold font-mono text-slate-700">
          Generating Forensic Analysis Report...
        </p>
      </div>
    );
  }

  if (!caseData || !caseData.items || caseData.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white border border-slate-300 rounded-2xl p-8 max-w-md text-center space-y-4 shadow-lg">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-black tracking-wide uppercase font-sans">
            No Active Forensic Case Data
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            There is no active analysis session to generate a report from. Please upload and analyze evidence first.
          </p>
          <Link
            href="/main"
            className="inline-flex items-center justify-center gap-2 bg-[#18181b] hover:bg-slate-800 text-white text-xs font-bold px-5 py-3 rounded-full transition-colors w-full tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Evidence Upload</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e2e8f0] print:bg-white text-slate-900 flex flex-col antialiased font-sans select-text">
      {/* 1. Fixed Floating Top Toolbar */}
      <ReportToolbar
        reportNo={`${caseData.caseNumber || "KIL-0417-2026"}-R1`}
        caseNumber={caseData.caseNumber || "KIL-0417-2026"}
        zoomLevel={zoomLevel}
        isGeneratingPdf={isGeneratingPdf}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onPrint={handlePrint}
        onDownloadPdf={handleDownloadPdf}
      />

      {/* 2. Word-like Document Canvas: Discrete 1-to-1 A4 Sheets */}
      <main className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center print:p-0 print:m-0 print:overflow-visible print:block">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
          }}
          className="space-y-8 print:space-y-0"
        >
          {/* PAGE 1: Case Overview & Notes */}
          <ReportPageSheet pageNumber={1} totalPages={totalPages}>
            <ReportFirstPage caseData={caseData} />
          </ReportPageSheet>

          {/* PAGES 2 .. (N+1): Exactly One Dedicated Single-Page Report Per Investigated Image */}
          {items.map((item: StoredResultItem, idx: number) => {
            const pageNum = idx + 2;
            return (
              <ReportPageSheet
                key={idx}
                pageNumber={pageNum}
                totalPages={totalPages}
              >
                <ReportImagePage item={item} index={idx} />
              </ReportPageSheet>
            );
          })}

          {/* FINAL PAGE (Page N+2): Examiner Notes, Certification, Warning Banner & Legal Disclaimer */}
          <ReportPageSheet pageNumber={totalPages} totalPages={totalPages}>
            <ReportLastPage
              caseData={caseData}
              examinerNotes={examinerNotes}
              onNotesChange={setExaminerNotes}
            />
          </ReportPageSheet>
        </div>
      </main>
    </div>
  );
}
