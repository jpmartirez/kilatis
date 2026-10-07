/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef, useState } from "react";
import { EvidenceItem } from "./upload/types";
import { isImageFile, splitValidImages, traverseDirectoryEntry } from "./upload/upload-utils";
import { UploadNotice, UploadNoticeModal } from "./upload-notice-modal";
import { EmptyDropzone } from "./upload/empty-dropzone";
import { EvidenceGallery } from "./upload/evidence-gallery";

// Re-export type for consumers
export type { EvidenceItem };

interface UploadEvidenceSectionProps {
  evidenceFiles: EvidenceItem[];
  setEvidenceFiles: React.Dispatch<React.SetStateAction<EvidenceItem[]>>;
}

export const UploadEvidenceSection: React.FC<UploadEvidenceSectionProps> = ({
  evidenceFiles,
  setEvidenceFiles,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [notice, setNotice] = useState<UploadNotice | null>(null);

  /**
   * Check files by their CONTENT and add only real images.
   *  - `direct`: files the user picked or dropped one by one -> every rejected file is reported.
   *  - `fromFolders`: files found inside a folder -> already limited to image names; fake images are reported.
   */
  const addCheckedFiles = async (direct: File[], fromFolders: File[] = []) => {
    const { valid, rejected } = await splitValidImages([...direct, ...fromFolders]);

    if (valid.length > 0) addEvidence(valid);

    if (rejected.length > 0) {
      setNotice({
        variant: "warning",
        title: valid.length > 0 ? "Some Files Were Not Added" : "Files Not Accepted",
        message:
          valid.length > 0
            ? "Only real image files can be used as evidence. The files below were skipped; the rest were added."
            : "Only real image files can be used as evidence. None of the selected files could be added.",
        addedCount: valid.length,
        rejected,
        showFormats: true,
      });
    } else if (valid.length === 0) {
      setNotice({
        variant: "warning",
        title: "No Images Found",
        message: "The selected folder does not contain any image files.",
        showFormats: true,
      });
    }
  };

  const addEvidence = (validImages: File[]) => {
    const newItems: EvidenceItem[] = validImages.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()
        .toString(36)
        .substring(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setEvidenceFiles((prev) => [...prev, ...newItems]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      e.target.value = "";
      await addCheckedFiles(filesArray);
    }
  };

  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Inside a folder, other file types (documents, notes, ...) are skipped quietly.
      const imageNamed = Array.from(e.target.files).filter(isImageFile);
      e.target.value = "";
      setIsScanning(true);
      try {
        await addCheckedFiles([], imageNamed);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setIsScanning(true);

    // Read everything from the drop NOW: the browser empties dataTransfer after the first await.
    const items = e.dataTransfer.items;
    const droppedFiles = Array.from(e.dataTransfer.files ?? []);
    const entries: any[] = [];
    if (items && items.length > 0 && (items[0] as any).webkitGetAsEntry) {
      for (let i = 0; i < items.length; i++) {
        const entry = (items[i] as any).webkitGetAsEntry();
        if (entry) entries.push(entry);
      }
    }

    try {
      const direct: File[] = [];
      const fromFolders: File[] = [];

      if (entries.length > 0) {
        for (const entry of entries) {
          if (entry.isDirectory) {
            fromFolders.push(...(await traverseDirectoryEntry(entry)));   // image-named files only
          } else {
            const file = await new Promise<File | null>((resolve) => entry.file(resolve, () => resolve(null)));
            if (file) direct.push(file);
          }
        }
      } else {
        direct.push(...droppedFiles);
      }

      await addCheckedFiles(direct, fromFolders);
    } catch (err) {
      console.error("Error processing dropped items:", err);
      setNotice({
        variant: "error",
        title: "Upload Error",
        message: "The dropped files could not be read. Please try the Select Images button instead.",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEvidenceFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    evidenceFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setEvidenceFiles([]);
  };

  return (
    <section className="space-y-3">
      <UploadNoticeModal notice={notice} onClose={() => setNotice(null)} />
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/bmp, image/tiff, image/heic, image/heif, image/svg+xml, .png, .jpg, .jpeg, .webp, .bmp, .gif, .tiff, .tif, .svg, .heic, .heif"
        onChange={handleFileChange}
        className="hidden"
        id="evidence-multi-files-input"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard in all modern browsers
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderChange}
        className="hidden"
        id="evidence-folder-input"
      />

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-xs sm:text-xs text-slate-900 shrink-0">
            2
          </div>
          <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-wide uppercase">
            UPLOAD EVIDENCE
          </h2>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
          Upload single/multiple questioned images or entire folders for batch
          forensic analysis.{" "}
          <span className="text-[10px] text-red-500 font-bold italic ml-1">
            *Required
          </span>
        </p>
      </div>

      {/* Card Body */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/80 space-y-4">
        {evidenceFiles.length === 0 ? (
          <EmptyDropzone
            isDragging={isDragging}
            isScanning={isScanning}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onSelectImages={() => fileInputRef.current?.click()}
            onSelectFolder={() => folderInputRef.current?.click()}
          />
        ) : (
          <EvidenceGallery
            evidenceFiles={evidenceFiles}
            isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onAddImages={() => fileInputRef.current?.click()}
            onAddFolder={() => folderInputRef.current?.click()}
            onClearAll={handleClearAll}
            onRemoveItem={handleRemoveItem}
          />
        )}
      </div>
    </section>
  );
};
