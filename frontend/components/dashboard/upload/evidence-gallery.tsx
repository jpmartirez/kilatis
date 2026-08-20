"use client";

import React from "react";
import { FolderUp, Plus, Trash2, FileCheck, Upload } from "lucide-react";
import { EvidenceItem } from "./types";
import { EvidenceGalleryItem } from "./evidence-gallery-item";
import { formatFileSize } from "./upload-utils";

interface EvidenceGalleryProps {
  evidenceFiles: EvidenceItem[];
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onAddImages: () => void;
  onAddFolder: () => void;
  onClearAll: (e: React.MouseEvent) => void;
  onRemoveItem: (id: string, e: React.MouseEvent) => void;
}

export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({
  evidenceFiles,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onAddImages,
  onAddFolder,
  onClearAll,
  onRemoveItem,
}) => {
  const totalBytes = evidenceFiles.reduce(
    (acc, curr) => acc + curr.file.size,
    0
  );

  return (
    <div className="space-y-4">
      {/* Header / Summary Bar */}
      <div className="bg-[#edf2f7] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-300/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              {evidenceFiles.length} Evidence{" "}
              {evidenceFiles.length === 1 ? "Image" : "Images"} Ready
            </h4>
            <p className="text-[11px] text-slate-500 font-mono">
              Total Volume: {formatFileSize(totalBytes)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={onAddImages}
            className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Add more images"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Images</span>
            <span className="sm:hidden">Images</span>
          </button>

          <button
            type="button"
            onClick={onAddFolder}
            className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Add an entire folder"
          >
            <FolderUp className="w-3.5 h-3.5 text-slate-700" />
            <span className="hidden sm:inline">Add Folder</span>
            <span className="sm:hidden">Folder</span>
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold border border-red-200 transition-all flex items-center gap-1 cursor-pointer"
            title="Clear all selected files"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Mini Dropzone Strip */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`w-full py-2.5 px-4 rounded-xl border border-dashed text-center text-xs font-bold transition-all ${
          isDragging
            ? "border-slate-800 bg-[#e2ebf5] text-slate-900"
            : "border-slate-300 bg-slate-50/70 text-slate-500 hover:bg-slate-100"
        }`}
      >
        <span className="flex items-center justify-center gap-1.5 uppercase tracking-wide text-[11px]">
          <Upload className="w-3.5 h-3.5 text-slate-600" />
          Drop more images or folders here to append
        </span>
      </div>

      {/* Grid Gallery */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 sm:max-h-80 overflow-y-auto pr-1">
        {evidenceFiles.map((item, index) => (
          <EvidenceGalleryItem
            key={item.id}
            item={item}
            index={index}
            onRemove={onRemoveItem}
          />
        ))}
      </div>
    </div>
  );
};
