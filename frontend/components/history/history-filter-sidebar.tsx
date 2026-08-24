"use client";

import React from "react";
import { Search, Filter, Calendar } from "lucide-react";

interface HistoryFilterSidebarProps {
  searchInput: string;
  onSearchInputChange: (val: string) => void;
  fromDate: string;
  onFromDateChange: (val: string) => void;
  toDate: string;
  onToDateChange: (val: string) => void;
  verdictFilter: string;
  onVerdictFilterChange: (val: string) => void;
  totalCount: number;
  onApplyFilters: (e?: React.FormEvent) => void;
}

export const HistoryFilterSidebar: React.FC<HistoryFilterSidebarProps> = ({
  searchInput,
  onSearchInputChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  verdictFilter,
  onVerdictFilterChange,
  totalCount,
  onApplyFilters,
}) => {
  return (
    <div className="lg:col-span-3 space-y-4">
      {/* Search Input Card */}
      <div className="bg-[#e3e9f0]/80 backdrop-blur-xs rounded-2xl p-2.5 shadow-xs border border-slate-300/60 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-500 ml-1.5 shrink-0" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
          placeholder="Search case # or title..."
          className="w-full bg-white text-xs font-medium text-slate-800 placeholder-slate-400 px-3 py-2 rounded-xl outline-hidden border border-slate-200/80 shadow-2xs"
        />
      </div>

      {/* Filter Controls Form */}
      <form
        onSubmit={onApplyFilters}
        className="bg-[#e3e9f0]/80 backdrop-blur-xs rounded-3xl p-5 shadow-xs border border-slate-300/60 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-700" />
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
            FILTER
          </h2>
        </div>

        {/* DATE Filter Box (Stacked Vertically) */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">
            DATE
          </span>
          <div className="space-y-2">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                FROM
              </span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
                className="w-full bg-[#f1f5f9] text-xs font-mono font-medium text-slate-800 px-3 py-2 rounded-lg border border-transparent focus:border-slate-400 outline-hidden"
                title="From Date"
              />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                TO
              </span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => onToDateChange(e.target.value)}
                className="w-full bg-[#f1f5f9] text-xs font-mono font-medium text-slate-800 px-3 py-2 rounded-lg border border-transparent focus:border-slate-400 outline-hidden"
                title="To Date"
              />
            </div>
          </div>
        </div>

        {/* VERDICT Dropdown Box */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">
            VERDICT
          </span>
          <select
            value={verdictFilter}
            onChange={(e) => onVerdictFilterChange(e.target.value)}
            className="w-full bg-[#f1f5f9] text-xs font-bold text-slate-800 px-3 py-2 rounded-lg border border-transparent focus:border-slate-400 outline-hidden cursor-pointer"
          >
            <option value="ALL">ALL VERDICTS</option>
            <option value="SPLICED">SPLICED</option>
            <option value="AI">AI-GENERATED / DEEPFAKE</option>
            <option value="AUTHENTIC">AUTHENTIC</option>
          </select>
        </div>

        {/* Submit Search Button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="bg-[#243342] hover:bg-[#1a2632] text-white px-6 py-2.5 rounded-full inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>SEARCH</span>
          </button>
        </div>
      </form>

      {/* Total Results Summary Pill */}
      <div className="flex justify-end">
        <div className="bg-white text-slate-600 px-4 py-1.5 rounded-xl text-[11px] font-mono font-bold shadow-2xs border border-slate-200 inline-flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {totalCount} Total Case{totalCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
};
