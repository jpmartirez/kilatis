"use client";

import React from "react";
import { FolderUp, Images } from "lucide-react";

interface EmptyDropzoneProps {
  isDragging: boolean;
  isScanning: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onSelectImages: () => void;
  onSelectFolder: () => void;
}

export const EmptyDropzone: React.FC<EmptyDropzoneProps> = ({
  isDragging,
  isScanning,
  onDragOver,
  onDragLeave,
  onDrop,
  onSelectImages,
  onSelectFolder,
}) => {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`w-full bg-[#edf2f7] hover:bg-[#e6eff7] rounded-2xl sm:rounded-3xl py-10 sm:py-14 px-6 flex flex-col items-center justify-center text-center transition-all border-2 ${
        isDragging
          ? "border-slate-800 bg-[#e2ebf5] scale-[0.99]"
          : "border-transparent hover:border-slate-300/80"
      }`}
    >
      {/* Upload Icon */}
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-slate-800 mb-3 group-hover:scale-105 transition-transform">
        <svg
          className="w-8 h-8 sm:w-9 sm:h-9 text-slate-800 stroke-[2.2]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1" />
          <polyline points="16 8 12 4 8 8" />
          <line x1="12" y1="4" x2="12" y2="16" />
        </svg>
      </div>

      {/* Title */}
      <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-wider uppercase">
        {isScanning
          ? "EXTRACTING IMAGES FROM FOLDER..."
          : "DRAG & DROP IMAGES OR FOLDER HERE"}
      </h3>
      <p className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1 mb-5">
        AUTO-FILTERS ONLY IMAGES (PNG, JPG, JPEG, WEBP, ETC.)
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onSelectImages}
          className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <Images className="w-4 h-4" />
          <span>Select Images</span>
        </button>

        <button
          type="button"
          onClick={onSelectFolder}
          className="px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <FolderUp className="w-4 h-4 text-slate-700" />
          <span>Upload Entire Folder</span>
        </button>
      </div>
    </div>
  );
};
