"use client";

import React from "react";

interface ReportPageSheetProps {
  children: React.ReactNode;
  pageNumber: number;
  totalPages: number;
}

export const ReportPageSheet: React.FC<ReportPageSheetProps> = ({
  children,
  pageNumber,
  totalPages,
}) => {
  return (
    <div className="a4-page-sheet bg-white shadow-xl print:shadow-none w-full max-w-[210mm] min-h-[297mm] h-[297mm] p-6 sm:p-7 md:p-8 mb-8 print:mb-0 print:p-0 mx-auto rounded-xl print:rounded-none flex flex-col justify-between relative border border-slate-200 print:border-none box-border overflow-hidden print:overflow-hidden print:h-[280mm]">
      {/* Page Content Container */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden">{children}</div>

      {/* Footer / Page Number */}
      <div className="pt-2 mt-auto flex items-center justify-between text-[9px] font-mono text-slate-400 border-t border-slate-200/60 print:text-slate-500">
        <span>KILATIS FORENSICS REPORT</span>
        <span>
          Page {pageNumber} of {totalPages}
        </span>
      </div>
    </div>
  );
};
