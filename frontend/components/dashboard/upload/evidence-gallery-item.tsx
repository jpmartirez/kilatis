"use client";

import React from "react";
import { X } from "lucide-react";
import { EvidenceItem } from "./types";
import { formatFileSize } from "./upload-utils";

interface EvidenceGalleryItemProps {
  item: EvidenceItem;
  index: number;
  onRemove: (id: string, e: React.MouseEvent) => void;
}

export const EvidenceGalleryItem: React.FC<EvidenceGalleryItemProps> = ({
  item,
  index,
  onRemove,
}) => {
  return (
    <div className="relative group bg-[#edf2f7] rounded-xl overflow-hidden border border-slate-200 shadow-2xs flex flex-col justify-between">
      {/* Thumbnail Container */}
      <div className="relative w-full aspect-square bg-slate-200 flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.previewUrl}
          alt={item.file.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />

        {/* Index Badge */}
        <span className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
          #{index + 1}
        </span>

        {/* Remove Button */}
        <button
          type="button"
          onClick={(e) => onRemove(item.id, e)}
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
          title="Remove image"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metadata Footer */}
      <div className="p-2 bg-white text-left">
        <p
          className="text-[11px] font-bold text-slate-800 truncate"
          title={item.file.name}
        >
          {item.file.name}
        </p>
        <p className="text-[10px] text-slate-400 font-mono">
          {formatFileSize(item.file.size)}
        </p>
      </div>
    </div>
  );
};
