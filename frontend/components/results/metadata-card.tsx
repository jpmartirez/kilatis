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
  const meta = currentItem.metadata;

  const cameraDevice =
    meta?.cameraMake && meta.cameraMake !== "N/A"
      ? `${meta.cameraMake} ${meta.cameraModel !== "N/A" ? meta.cameraModel : ""}`.trim()
      : meta?.cameraModel && meta.cameraModel !== "N/A"
      ? meta.cameraModel
      : "N/A";

  const shaVal = currentItem.sha256 || meta?.sha256 || "N/A";
  const softwareVal = meta?.software || "N/A";
  const dimensionsVal = currentItem.dimensions || meta?.dimensions || "N/A";
  const sizeVal = meta?.fileSize || (currentItem.fileSize ? `${(currentItem.fileSize / 1024).toFixed(1)} KB` : "N/A");
  const dateVal = meta?.dateOriginal || "N/A";
  const gpsVal = meta?.gpsCoordinates || "N/A";
  const colorSpaceVal = meta?.colorSpace || "sRGB";

  return (
    <div className="bg-[#e4ebf3] rounded-3xl p-4 sm:p-5 border border-slate-300/80 shadow-xs space-y-2 text-center">
      <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block">
        METADATA
      </span>

      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs text-left text-[11px] space-y-1.5">
        <div className="flex justify-between gap-2">
          <span className="text-slate-500 font-medium">File Name:</span>
          <span className="font-bold text-slate-800 truncate max-w-32" title={currentItem.originalName}>
            {currentItem.originalName || currentResult.filename || "N/A"}
          </span>
        </div>

        <div className="flex justify-between gap-2">
          <span className="text-slate-500 font-medium">SHA-256:</span>
          <span
            className="font-mono font-bold text-slate-800 truncate max-w-32"
            title={shaVal}
          >
            {shaVal.length > 18 ? `${shaVal.substring(0, 16)}...` : shaVal}
          </span>
        </div>

        <div className="flex justify-between gap-2">
          <span className="text-slate-500 font-medium">Dimensions:</span>
          <span className="font-mono text-slate-800 font-bold">
            {dimensionsVal}
          </span>
        </div>

        <div className="flex justify-between gap-2">
          <span className="text-slate-500 font-medium">File Size:</span>
          <span className="font-mono text-slate-800">
            {sizeVal}
          </span>
        </div>

        <div className="flex justify-between gap-2">
          <span className="text-slate-500 font-medium">Camera/Device:</span>
          <span className="text-slate-800 truncate max-w-32" title={cameraDevice}>
            {cameraDevice}
          </span>
        </div>

        <div className="flex justify-between gap-2">
          <span className="text-slate-500 font-medium">Software:</span>
          <span className="text-slate-800 truncate max-w-32" title={softwareVal}>
            {softwareVal}
          </span>
        </div>

        {showFullMetadata && (
          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[10px] animate-in fade-in">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">DateTimeOriginal:</span>
              <span className="text-slate-800 font-mono">
                {dateVal}
              </span>
            </div>

            <div className="flex justify-between gap-2">
              <span className="text-slate-500">GPS Coordinates:</span>
              <span className="text-slate-800 font-mono truncate max-w-32" title={gpsVal}>
                {gpsVal}
              </span>
            </div>

            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Color Space:</span>
              <span className="text-slate-800">
                {colorSpaceVal}
              </span>
            </div>

            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Case Number:</span>
              <span className="font-mono font-bold text-slate-800">
                {caseNumber || "N/A"}
              </span>
            </div>

            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Investigator:</span>
              <span className="text-slate-800 font-bold">
                {investigatorName || "N/A"}
              </span>
            </div>

            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Case Title:</span>
              <span className="text-slate-800 font-medium truncate max-w-32" title={caseTitle}>
                {caseTitle || "N/A"}
              </span>
            </div>

            {caseNotes && (
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Notes:</span>
                <span className="text-slate-800 truncate max-w-32" title={caseNotes}>
                  {caseNotes}
                </span>
              </div>
            )}
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
