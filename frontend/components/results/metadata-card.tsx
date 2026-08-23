"use client";

import React, { useState } from "react";
import { ImageAnalysisResult } from "@/lib/api";
import { StoredResultItem } from "@/types/results";

interface MetadataCardProps {
  caseNumber: string;
  caseTitle: string;
  investigatorName: string;
  caseNotes: string;
  currentItem: StoredResultItem;
  currentResult: ImageAnalysisResult;
}

export const MetadataCard: React.FC<MetadataCardProps> = ({
  caseNumber,
  caseTitle,
  investigatorName,
  caseNotes,
  currentItem,
  currentResult,
}) => {
  const [showFullMetadata, setShowFullMetadata] = useState(false);

  return (
    <div className="bg-[#e4ebf3] rounded-3xl p-4 sm:p-5 border border-slate-300/80 shadow-xs space-y-2 text-center">
      <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block">
        METADATA
      </span>

      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs text-left text-[11px] space-y-1.5">
        <div className="flex justify-between gap-2">
          <span className="text-slate-500 font-medium">Case Number:</span>
          <span className="font-mono font-bold text-slate-800 truncate">
            {caseNumber || "N/A"}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-500 font-medium">SHA-256:</span>
          <span
            className="font-mono text-slate-800 truncate max-w-32.5"
            title={currentItem.sha256 || "4f9a1eddfgdgoo47nsc8021bd3e21c"}
          >
            {currentItem.sha256
              ? currentItem.sha256.substring(0, 18) + "..."
              : "4f9a1eddfgdgoo..."}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-500 font-medium">Software:</span>
          <span className="text-slate-800">Original EXIF / Camera Raw</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-500 font-medium">Investigator:</span>
          <span className="text-slate-800 font-bold">
            {investigatorName || "PLT JOHN DOE"}
          </span>
        </div>

        {showFullMetadata && (
          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[10px] animate-in fade-in">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Case Title:</span>
              <span className="text-slate-800 font-medium">
                {caseTitle || "N/A"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Notes:</span>
              <span className="text-slate-800 truncate">
                {caseNotes || "None"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Threshold (AI):</span>
              <span className="font-mono text-slate-800">
                {currentResult.ai_axis?.threshold || 0.68}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Threshold (Splice):</span>
              <span className="font-mono text-slate-800">
                {currentResult.splice_axis?.threshold || 0.428}
              </span>
            </div>
          </div>
        )}

        <div className="pt-1 text-right">
          <button
            type="button"
            onClick={() => setShowFullMetadata((prev) => !prev)}
            className="text-[10px] text-slate-500 hover:text-slate-800 font-bold underline cursor-pointer"
          >
            {showFullMetadata ? "see less" : "see more"}
          </button>
        </div>
      </div>
    </div>
  );
};
