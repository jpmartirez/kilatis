/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { StoredResultItem } from "@/types/results";

interface EvidenceViewportProps {
  currentItem: StoredResultItem;
  items: StoredResultItem[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  activeTab: "asset" | "heatmap";
  onTabChange: (tab: "asset" | "heatmap") => void;
  hasHeatmap: boolean;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export const EvidenceViewport: React.FC<EvidenceViewportProps> = ({
  currentItem,
  items,
  selectedIndex,
  onSelectIndex,
  activeTab,
  onTabChange,
  hasHeatmap,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}) => {
  const currentResult = currentItem.result;

  return (
    <div className="bg-[#e4ebf3] rounded-3xl p-4 sm:p-5 border border-slate-300/80 shadow-xs space-y-3">
      {/* Asset / Heatmap Switcher Tabs */}
      <div className="flex items-center justify-between">
        <div className="bg-white p-1 rounded-full shadow-2xs border border-slate-200 flex items-center gap-1">
          <button
            type="button"
            onClick={() => onTabChange("asset")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === "asset"
                ? "bg-[#181f2a] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Questioned Asset
          </button>

          {/* Heatmap tab is enabled exclusively for Spliced images */}
          {hasHeatmap ? (
            <button
              type="button"
              onClick={() => onTabChange("heatmap")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "heatmap"
                  ? "bg-[#181f2a] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>GradCAM Heatmap</span>
            </button>
          ) : null}
        </div>

        {/* Multi-image indicator if multiple images uploaded */}
        {items.length > 1 && (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => onSelectIndex(Math.max(0, selectedIndex - 1))}
              disabled={selectedIndex === 0}
              className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              {selectedIndex + 1} / {items.length}
            </span>
            <button
              type="button"
              onClick={() => onSelectIndex(Math.min(items.length - 1, selectedIndex + 1))}
              disabled={selectedIndex === items.length - 1}
              className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* High-Resolution Viewport Canvas */}
      <div className="relative w-full h-90 sm:h-107.5 lg:h-117.5 bg-[#1e232a] rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
        <div
          className="transition-transform duration-150 ease-out flex items-center justify-center w-full h-full p-2"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={
              activeTab === "heatmap" && currentResult.mask_base64
                ? currentResult.mask_base64
                : currentItem.previewUrl
            }
            alt={currentResult.filename}
            className="max-h-full max-w-full object-contain rounded-lg pointer-events-none"
          />
        </div>

        {/* Bottom Left: Resolution / Format Badge */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-medium px-3 py-1 rounded-md">
          {currentItem.dimensions || "NATIVE RESOLUTION"} · {currentItem.fileType?.toUpperCase().split("/")[1] || "JPEG"}
        </div>

        {/* Bottom Right: Zoom Tools */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs rounded-lg shadow-md p-1 flex items-center gap-1 border border-slate-200 text-slate-700">
          <button
            type="button"
            onClick={onZoomIn}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onZoomOut}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onZoomReset}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Multi-Image Thumbnail Carousel (If >1 image) */}
      {items.length > 1 && (
        <div className="pt-1 overflow-x-auto flex items-center gap-2 pb-1">
          {items.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const itemSplice =
              item.result.verdict === "Spliced" ||
              item.result.verdict === "AI-generated + spliced";
            return (
              <button
                key={`${item.originalName}-${idx}`}
                type="button"
                onClick={() => onSelectIndex(idx)}
                className={`relative shrink-0 w-16 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-slate-900 ${
                  isSelected
                    ? "border-blue-600 ring-2 ring-blue-400"
                    : "border-slate-300 opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={item.previewUrl}
                  alt={item.originalName}
                  className="w-full h-full object-cover"
                />
                {itemSplice && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-1 ring-white" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
