"use client";

import React, { useEffect, useRef } from "react";
import { CheckCircle2, FileWarning, FileX2, ServerCrash } from "lucide-react";
import { RejectedFile, RejectionCode, SUPPORTED_FORMATS } from "./upload/upload-utils";

/** What the modal shows. `warning` = files refused by the check; `error` = upload or connection failure. */
export interface UploadNotice {
  variant: "warning" | "error";
  title: string;
  message: string;
  addedCount?: number;          // images that WERE added (shown as a green note)
  rejected?: RejectedFile[];    // files that were refused, with the reason for each
  showFormats?: boolean;        // list the supported formats
}

interface UploadNoticeModalProps {
  notice: UploadNotice | null;
  onClose: () => void;
}

const BADGES: Record<RejectionCode, { label: string; className: string }> = {
  "fake-image": { label: "Fake image", className: "bg-red-50 text-red-700 border-red-200" },
  "not-image": { label: "Not an image", className: "bg-slate-100 text-slate-600 border-slate-300" },
  empty: { label: "Empty file", className: "bg-amber-50 text-amber-700 border-amber-200" },
  unreadable: { label: "Unreadable", className: "bg-amber-50 text-amber-700 border-amber-200" },
  server: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200" },
};

export const UploadNoticeModal: React.FC<UploadNoticeModalProps> = ({ notice, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the button when the modal opens, and close it with the Escape key.
  useEffect(() => {
    if (!notice) return;
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [notice, onClose]);

  if (!notice) return null;

  const isError = notice.variant === "error";
  const Icon = isError ? ServerCrash : FileWarning;
  const rejected = notice.rejected ?? [];

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="upload-notice-title"
        aria-describedby="upload-notice-message"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-slate-800 space-y-5 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div
            className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
              isError ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
            }`}
          >
            <Icon className="w-7 h-7" />
          </div>
          <h3 id="upload-notice-title" className="text-lg font-black uppercase text-slate-900 tracking-wide">
            {notice.title}
          </h3>
          <p id="upload-notice-message" className="text-xs text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
            {notice.message}
          </p>
        </div>

        {/* Images that were added */}
        {notice.addedCount ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {notice.addedCount} {notice.addedCount === 1 ? "image was" : "images were"} added to the evidence.
            </span>
          </div>
        ) : null}

        {/* Rejected files */}
        {rejected.length > 0 && (
          <div className="bg-[#edf2f7] rounded-2xl border border-slate-300/60 p-3 sm:p-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              {rejected.length} {rejected.length === 1 ? "file was" : "files were"} {isError ? "refused" : "not added"}
            </span>
            <ul className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {rejected.map((file, i) => {
                const badge = BADGES[file.code];
                return (
                  <li
                    key={`${file.name}-${i}`}
                    className="flex items-start gap-2.5 bg-white rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <FileX2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 truncate" title={file.name}>
                          {file.name}
                        </span>
                        <span
                          className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{file.reason}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Supported formats */}
        {notice.showFormats && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block text-center">
              Supported formats
            </span>
            <div className="flex flex-wrap justify-center gap-1">
              {SUPPORTED_FORMATS.map((f) => (
                <span
                  key={f}
                  className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-md px-1.5 py-0.5"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-full py-3 text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.99] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        >
          Understood
        </button>
      </div>
    </div>
  );
};
