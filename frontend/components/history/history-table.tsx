"use client";

import React from "react";
import { Loader2, ShieldAlert, Inbox, ChevronLeft, ChevronRight } from "lucide-react";
import { HistorySessionItem } from "@/lib/api";
import { HistoryRowItem } from "@/components/history/history-row-item";

interface HistoryTableProps {
  sessions: HistorySessionItem[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  hasActiveFilters: boolean;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  sessions,
  isLoading,
  error,
  currentPage,
  totalPages,
  hasActiveFilters,
  onPageChange,
  onRetry,
}) => {
  return (
    <div className="lg:col-span-9 bg-[#e3e9f0]/80 backdrop-blur-xs rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-300/60 flex flex-col min-h-145 justify-between">
      <div>
        {/* Pill Headers */}
        <div className="grid grid-cols-12 gap-2 mb-3 px-2">
          <div className="col-span-3 sm:col-span-3">
            <span className="inline-block w-full bg-white text-slate-800 text-[11px] font-black uppercase tracking-wider text-center py-2 px-3 rounded-full shadow-2xs border border-slate-200">
              CASE NO
            </span>
          </div>
          <div className="col-span-4 sm:col-span-4">
            <span className="inline-block w-full bg-white text-slate-800 text-[11px] font-black uppercase tracking-wider text-center py-2 px-3 rounded-full shadow-2xs border border-slate-200">
              CASE TITLE
            </span>
          </div>
          <div className="col-span-3 sm:col-span-3">
            <span className="inline-block w-full bg-white text-slate-800 text-[11px] font-black uppercase tracking-wider text-center py-2 px-3 rounded-full shadow-2xs border border-slate-200">
              TIMESTAMP
            </span>
          </div>
          <div className="col-span-2 sm:col-span-2">
            <span className="inline-block w-full bg-white text-slate-800 text-[11px] font-black uppercase tracking-wider text-center py-2 px-3 rounded-full shadow-2xs border border-slate-200">
              VERDICT
            </span>
          </div>
        </div>

        {/* Table Body / Rows */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Loading forensic history...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-center text-red-600">
            <ShieldAlert className="w-8 h-8" />
            <p className="text-xs font-bold">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 text-xs font-bold underline cursor-pointer text-slate-800 hover:text-slate-950"
            >
              Retry Loading
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2 text-slate-500 text-center">
            <Inbox className="w-10 h-10 stroke-1 text-slate-400" />
            <p className="text-sm font-bold text-slate-700">No History Sessions Found</p>
            <p className="text-xs text-slate-500 max-w-sm">
              {hasActiveFilters
                ? "No sessions match your search criteria. Try adjusting the filters."
                : "Evaluated cases will automatically appear here once you perform image analysis."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((item) => (
              <HistoryRowItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls on Table Bottom */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end mt-4 pt-3 border-t border-slate-300/40">
          <div className="bg-[#243342] text-white px-3 py-1 rounded-full flex items-center gap-3 text-xs font-bold shadow-xs">
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => onPageChange(currentPage - 1)}
              className="hover:text-slate-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] tracking-wider">
              {currentPage}/{totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => onPageChange(currentPage + 1)}
              className="hover:text-slate-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
