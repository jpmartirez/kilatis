"use client";

import React, { useState } from "react";
import Image from "next/image";
import { StoredResultItem } from "@/types";

interface ReportSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: StoredResultItem[];
  onConfirm: (selectedIndices: number[]) => void;
}

export const ReportSelectionModal: React.FC<ReportSelectionModalProps> = ({
  isOpen,
  onClose,
  items,
  onConfirm,
}) => {
  const [selectedIndices, setSelectedIndices] = useState<number[]>(() =>
    items.map((_, idx) => idx)
  );

  if (!isOpen) return null;

  const allSelected = items.length > 0 && selectedIndices.length === items.length;

  const handleToggleItem = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSelectAll = () => {
    setSelectedIndices(items.map((_, idx) => idx));
  };

  const handleDeselectAll = () => {
    setSelectedIndices([]);
  };

  const handleProceed = () => {
    if (selectedIndices.length === 0) return;
    onConfirm(selectedIndices);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200">
          <h3 className="text-sm font-black text-slate-900 tracking-wider uppercase">
            Select Evidence for Report
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Choose which evaluated images to include in the generated PDF report.
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">
            {selectedIndices.length} of {items.length} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={allSelected}
              className="font-bold text-slate-700 hover:text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider text-[11px]"
            >
              Select All
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              disabled={selectedIndices.length === 0}
              className="font-bold text-slate-700 hover:text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider text-[11px]"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Scrollable Evidence List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
          {items.map((item, index) => {
            const isChecked = selectedIndices.includes(index);
            const verdict = item.result.verdict;

            return (
              <div
                key={index}
                onClick={() => handleToggleItem(index)}
                className={`flex items-center gap-3.5 p-3 rounded-xl transition-colors cursor-pointer select-none ${
                  isChecked ? "bg-slate-100/60 hover:bg-slate-100" : "hover:bg-slate-50 opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleItem(index)}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Evidence Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300/80 relative">
                  {item.previewUrl ? (
                    <Image
                      src={item.previewUrl}
                      alt={item.originalName || "Evidence"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                      IMG
                    </div>
                  )}
                </div>

                {/* Evidence Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {item.originalName || `Evidence #${index + 1}`}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Verdict: <span className="font-semibold text-slate-800">{verdict}</span>
                  </p>
                </div>

                {/* Evidence Index */}
                <span className="text-[11px] font-mono font-medium text-slate-400 px-2 py-1 bg-white border border-slate-200 rounded-md shrink-0">
                  #{index + 1}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {selectedIndices.length === 0 ? "Select at least 1 image to proceed" : ""}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProceed}
              disabled={selectedIndices.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs cursor-pointer uppercase tracking-wider"
            >
              Generate Report ({selectedIndices.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
