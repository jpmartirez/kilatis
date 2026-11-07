"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  Camera,
  ShieldCheck,
  Sliders,
  MapPin,
  FolderOpen,
  Info,
} from "lucide-react";
import { StoredResultItem } from "@/types/results";
import { ImageAnalysisResult } from "@/lib/api";

interface MetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentItem: StoredResultItem;
  currentResult?: ImageAnalysisResult;
  caseNumber?: string;
  caseTitle?: string;
  investigatorName?: string;
  caseNotes?: string;
}

export const MetadataModal: React.FC<MetadataModalProps> = ({
  isOpen,
  onClose,
  currentItem,
  currentResult,
  caseNumber,
  caseTitle,
  investigatorName,
  caseNotes,
}) => {
  const [copiedSha, setCopiedSha] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
  const sizeVal =
    meta?.fileSize ||
    (currentItem.fileSize ? `${(currentItem.fileSize / 1024).toFixed(1)} KB` : "N/A");
  const dateVal = meta?.dateOriginal || "N/A";
  const gpsVal = meta?.gpsCoordinates || "N/A";
  const colorSpaceVal = meta?.colorSpace || "sRGB";
  const compressionVal = meta?.compression || "Standard DCT";
  const lensVal = meta?.lensModel || "N/A";
  const isoVal = meta?.iso || "N/A";
  const exposureVal = meta?.exposureTime || "N/A";
  const apertureVal = meta?.fNumber || "N/A";
  const focalVal = meta?.focalLength || "N/A";
  const fileTypeVal =
    currentItem.fileType?.toUpperCase().split("/")[1] ||
    meta?.fileType?.toUpperCase() ||
    "JPEG";

  const fileName = currentItem.originalName || currentResult?.filename || "Questioned Image";

  const handleCopySha = async () => {
    if (shaVal === "N/A") return;
    try {
      await navigator.clipboard.writeText(shaVal);
      setCopiedSha(true);
      setTimeout(() => setCopiedSha(false), 2000);
    } catch (err) {
      console.error("Failed to copy hash:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-4.5 bg-[#181f2a] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-wider uppercase">
                  QUESTIONED ASSET METADATA
                </h3>
                <span className="bg-blue-900/60 text-blue-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-blue-700/50">
                  {fileTypeVal}
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate max-w-md font-mono mt-0.5" title={fileName}>
                {fileName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Dimensions
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 mt-1 block truncate">
                {dimensionsVal}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                File Size
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 mt-1 block truncate">
                {sizeVal}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Color Space
              </span>
              <span className="text-xs font-bold text-slate-900 mt-1 block truncate">
                {colorSpaceVal}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Compression
              </span>
              <span className="text-xs font-bold text-slate-900 mt-1 block truncate">
                {compressionVal}
              </span>
            </div>
          </div>

          {/* SHA-256 Hash Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Cryptographic SHA-256 Hash</span>
              </div>
              {shaVal !== "N/A" && (
                <button
                  type="button"
                  onClick={handleCopySha}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer bg-white border border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded-md shadow-2xs"
                >
                  {copiedSha ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Hash</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 font-mono text-[11px] font-medium text-slate-800 break-all select-all">
              {shaVal}
            </div>
          </div>

          {/* Two-Column Grid for EXIF & Exposure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Camera & Hardware Provenance */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Camera &amp; Hardware
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Camera / Device:</span>
                  <span className="font-semibold text-slate-900 block truncate" title={cameraDevice}>
                    {cameraDevice}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Lens Model:</span>
                  <span className="font-semibold text-slate-900 block truncate" title={lensVal}>
                    {lensVal}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Editing / Processing Software:</span>
                  <span
                    className={`font-semibold block truncate ${
                      softwareVal !== "N/A" ? "text-amber-700 font-bold" : "text-slate-900"
                    }`}
                    title={softwareVal}
                  >
                    {softwareVal}
                  </span>
                </div>
              </div>
            </div>

            {/* Capture & Exposure Settings */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Capture &amp; Exposure
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Original Date &amp; Time:</span>
                  <span className="font-mono font-semibold text-slate-900 block truncate">
                    {dateVal}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <span className="text-slate-500 block text-[11px]">ISO Speed:</span>
                    <span className="font-mono font-semibold text-slate-900">{isoVal}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Shutter Speed:</span>
                    <span className="font-mono font-semibold text-slate-900">{exposureVal}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Aperture:</span>
                    <span className="font-mono font-semibold text-slate-900">{apertureVal}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Focal Length:</span>
                    <span className="font-mono font-semibold text-slate-900">{focalVal}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Geolocation Section */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span>GPS Geolocation:</span>
            </div>
            <span className="font-mono text-slate-800 text-right truncate" title={gpsVal}>
              {gpsVal}
            </span>
          </div>

          {/* Case Association Section (if available) */}
          {(caseNumber || investigatorName || caseTitle || caseNotes) && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                <FolderOpen className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Case Association
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Case Number:</span>
                  <span className="font-mono font-bold text-slate-900">{caseNumber || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Investigator:</span>
                  <span className="font-semibold text-slate-900">{investigatorName || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Case Title:</span>
                  <span className="font-medium text-slate-900 truncate block" title={caseTitle}>
                    {caseTitle || "N/A"}
                  </span>
                </div>
              </div>

              {caseNotes && (
                <div className="pt-1 text-xs">
                  <span className="text-slate-500 block text-[11px]">Investigator Notes:</span>
                  <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 mt-1 italic font-serif text-[11px] leading-relaxed">
                    &ldquo;{caseNotes}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Forensic EXIF &amp; cryptographic hash metadata analysis
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#181f2a] hover:bg-[#2c3746] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
