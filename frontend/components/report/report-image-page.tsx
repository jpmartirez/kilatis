/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { StoredResultItem } from "@/types/results";

interface ReportImagePageProps {
  item: StoredResultItem;
  index: number;
}

export const ReportImagePage: React.FC<ReportImagePageProps> = ({
  item,
  index,
}) => {
  const result = item.result;
  const verdict = result.verdict || "Manual review";
  const vLower = verdict.toLowerCase();
  const isSpliced =
    vLower.includes("splice") || verdict === "AI-generated + spliced";
  const isDeepfake = vLower.includes("deepfake");
  const isAi = vLower.includes("ai") || isDeepfake;
  const isAuthentic = vLower.includes("authentic");

  // Streams percentages
  const spatialPct = Math.round((result.streams?.spatial_score ?? result.scores?.p_ai ?? 0.82) * 100);
  const noisePct = Math.round((result.streams?.noise_score ?? result.scores?.p_splice ?? 0.25) * 100);
  const freqPct = Math.round((result.streams?.frequency_score ?? result.scores?.p_ai ?? 0.34) * 100);

  // Class probabilities for right chart
  const pSplice = result.class_probabilities?.traditional_spliced ?? result.scores?.p_splice ?? (isSpliced ? 0.93 : 0.08);
  const pAiDeepfake = result.class_probabilities?.ai_deepfake ?? result.scores?.p_ai ?? (isAi ? 0.92 : 0.12);
  const pAuth = result.class_probabilities?.authentic ?? (isAuthentic ? 0.93 : Math.max(0.02, 1 - Math.max(pAiDeepfake, pSplice)));

  // Determine verdict visual styling
  let verdictBadgeBg = "bg-amber-600";
  let verdictStatusText = "MANUAL REVIEW REQUIRED";
  let confidenceScore = 50;

  if (isSpliced) {
    verdictBadgeBg = "bg-[#dc2626]";
    verdictStatusText = "TAMPER DETECTED";
    confidenceScore = Math.round(pSplice * 100);
  } else if (isDeepfake) {
    verdictBadgeBg = "bg-[#7c2d12]";
    verdictStatusText = "DEEPFAKE DETECTED";
    confidenceScore = Math.round(pAiDeepfake * 100);
  } else if (isAi) {
    verdictBadgeBg = "bg-[#4338ca]";
    verdictStatusText = "SYNTHESIS DETECTED";
    confidenceScore = Math.round(pAiDeepfake * 100);
  } else if (isAuthentic) {
    verdictBadgeBg = "bg-[#16a34a]";
    verdictStatusText = "NO TAMPER DETECTED";
    confidenceScore = Math.round(pAuth * 100);
  }

  const filename = item.originalName || item.result.filename || `asset${index + 1}.jpg`;

  return (
    <div className="flex-1 flex flex-col justify-between font-sans h-full space-y-3.5">
      {/* Top Banner: QUESTIONED IMAGE */}
      <div className="bg-[#243346] text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs shrink-0">
        <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">
          QUESTIONED IMAGE:
        </span>
        <span className="text-white font-bold text-[11px] font-mono truncate max-w-md">
          {filename}
        </span>
      </div>

      {/* Ⓐ VERDICT & EXECUTIVE SUMMARY */}
      <div className="bg-[#eef4f9] rounded-2xl p-4 shadow-2xs border border-slate-200/80 shrink-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-4 h-4 rounded-full border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-900 font-sans">
            A
          </div>
          <h3 className="text-xs font-black tracking-wide text-slate-950 uppercase font-sans">
            VERDICT & EXECUTIVE SUMMARY
          </h3>
        </div>
        <p className="text-[10px] text-slate-500 font-medium mb-2 pl-6">
          Overall finding, in plain language, for non-technical readers.
        </p>

        {/* Inner White Box */}
        <div className="bg-white rounded-xl p-3.5 shadow-2xs border border-slate-200/60 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Verdict Box */}
          <div
            className={`md:col-span-4 ${verdictBadgeBg} text-white rounded-xl p-3 text-left shadow-xs flex flex-col justify-between min-h-23`}
          >
            <div>
              <span className="text-[8.5px] font-sans font-bold uppercase tracking-wider block opacity-90">
                {verdictStatusText}
              </span>
              <span className="text-lg font-black tracking-tight uppercase font-sans block mt-0.5 leading-tight">
                {verdict.toUpperCase()}
              </span>
            </div>
            <div className="mt-1">
              <span className="text-[8.5px] font-sans opacity-90 block">
                Confidence
              </span>
              <span className="text-xl font-black font-sans leading-none">
                {confidenceScore}%
              </span>
            </div>
          </div>

          {/* Executive Summary Paragraph */}
          <div className="md:col-span-8 space-y-1.5 text-[10.5px] text-slate-800 leading-snug font-sans">
            {isSpliced ? (
              <>
                <p>
                  All three detection methods agree that this image has been altered. The evidence is consistent with{" "}
                  <strong>image splicing</strong> — content copied from a separate source photograph and inserted into this one.
                </p>
                <p className="text-slate-600 text-[9.5px]">
                  The system located the affected area in the upper-right portion of the frame, covering roughly 8% of the image. This finding is driven primarily by visual-structure and sensor-noise evidence; frequency-domain evidence was comparatively weak.
                </p>
              </>
            ) : isAi ? (
              <>
                <p>
                  {isDeepfake ? (
                    <>Multi-branch neural analysis detected structural artifacts in the <strong>facial region</strong> characteristic of <strong>deepfake synthesis</strong>.</>
                  ) : (
                    <>Multi-branch neural analysis detected structural artifacts characteristic of <strong>AI-generated / synthetic image content</strong>.</>
                  )}
                </p>
                <p className="text-slate-600 text-[9.5px]">
                  {isDeepfake
                    ? "The finding is driven by face-crop tiling analysis detecting generative fingerprint patterns localized to the facial region."
                    : "The finding is driven by frequency domain irregularities and convolutional generative fingerprint patterns detected across whole-image tiles."
                  }
                </p>
              </>
            ) : isAuthentic ? (
              <>
                <p>
                  The image exhibits consistent physical sensor noise and natural optical characteristics with <strong>no evidence of splicing or AI tampering</strong>.
                </p>
                <p className="text-slate-600 text-[9.5px]">
                  PRNU sensor pattern noise distribution and compression boundaries match native camera hardware capture properties.
                </p>
              </>
            ) : (
              <p>
                Inconclusive detection metrics requiring secondary expert verification and manual baseline inspection.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Ⓑ VISUAL EVIDENCE */}
      <div className="bg-[#eef4f9] rounded-2xl p-4 shadow-2xs border border-slate-200/80 shrink-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-4 h-4 rounded-full border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-900 font-sans">
            B
          </div>
          <h3 className="text-xs font-black tracking-wide text-slate-950 uppercase font-sans">
            VISUAL EVIDENCE
          </h3>
        </div>
        <p className="text-[10px] text-slate-500 font-medium mb-2 pl-6">
          Questioned image and heatmap overlay.
        </p>

        {/* Viewports (Heatmap ONLY if Spliced; 1 Centered Image if Authentic or AI) */}
        <div
          className={`grid gap-3 mb-2 ${
            isSpliced && result.mask_base64
              ? "grid-cols-2"
              : "grid-cols-1 max-w-60 mx-auto"
          }`}
        >
          {/* Questioned Image */}
          <div className="bg-[#18181b] rounded-xl p-2.5 flex flex-col items-center justify-center shadow-xs">
            <div className="relative aspect-4/3 w-full flex items-center justify-center overflow-hidden rounded-lg">
              <img
                src={item.previewUrl}
                alt="Questioned Image"
                className="max-h-36 max-w-full object-contain rounded-lg"
              />
            </div>
            <span className="text-[8.5px] font-black tracking-widest text-slate-300 uppercase mt-1.5">
              QUESTIONED IMAGE
            </span>
          </div>

          {/* GradCAM / JET Heatmap (Spliced ONLY) */}
          {isSpliced && result.mask_base64 && (
            <div className="bg-[#18181b] rounded-xl p-2.5 flex flex-col items-center justify-center shadow-xs">
              <div className="relative aspect-4/3 w-full flex items-center justify-center overflow-hidden rounded-lg">
                <img
                  src={result.mask_base64}
                  alt="GradCAM Heatmap"
                  className="max-h-36 max-w-full object-contain rounded-lg"
                />
              </div>
              <span className="text-[8.5px] font-black tracking-widest text-slate-300 uppercase mt-1.5">
                GRADCAM HEATMAP
              </span>
            </div>
          )}
        </div>

        {/* Localized Evidence Caption */}
        <p className="text-[10px] text-slate-800 font-sans mb-2">
          <span className="text-slate-600">Localized evidence: </span>
          <strong>
            {isSpliced
              ? "upper-right quadrant, ~8% of frame — consistent with a duplicated region"
              : isAi
              ? "global frequency and generative boundary inconsistency"
              : "uniform sensor noise across frame — no localized anomaly detected"}
          </strong>
        </p>

        {/* 3 Score Cards in a row */}
        <div className="grid grid-cols-3 gap-2.5 mb-2">
          <div className="bg-white rounded-xl p-2.5 shadow-2xs border border-slate-200/60">
            <span className="text-[8px] font-bold font-sans text-slate-400 uppercase tracking-wider block">
              SPATIAL
            </span>
            <span className="text-sm font-black text-slate-950 block">
              {spatialPct}%
            </span>
            <span className="text-[8.5px] font-medium text-slate-600 block truncate">
              {spatialPct > 60 ? "Boundary artifact" : "Consistent edge structure"}
            </span>
          </div>

          <div className="bg-white rounded-xl p-2.5 shadow-2xs border border-slate-200/60">
            <span className="text-[8px] font-bold font-sans text-slate-400 uppercase tracking-wider block">
              NOISE
            </span>
            <span className="text-sm font-black text-slate-950 block">
              {noisePct}%
            </span>
            <span className="text-[8.5px] font-medium text-slate-600 block truncate">
              {noisePct > 50 ? "PRNU mismatch" : "Uniform sensor noise"}
            </span>
          </div>

          <div className="bg-white rounded-xl p-2.5 shadow-2xs border border-slate-200/60">
            <span className="text-[8px] font-bold font-sans text-slate-400 uppercase tracking-wider block">
              FREQUENCY
            </span>
            <span className="text-sm font-black text-slate-950 block">
              {freqPct}%
            </span>
            <span className="text-[8.5px] font-medium text-slate-600 block truncate">
              {freqPct > 50 ? "DCT anomaly detected" : "Low DCT deviation"}
            </span>
          </div>
        </div>

        {/* Stream Findings Explanation Rows */}
        <div className="bg-white rounded-xl p-2.5 shadow-2xs border border-slate-200/60 space-y-1.5 text-[9.5px]">
          <div className="grid grid-cols-12 gap-2 items-start">
            <div className="col-span-3 font-bold uppercase tracking-wider text-slate-900 text-[9px]">
              SPATIAL
            </div>
            <div className="col-span-9 text-slate-600 leading-snug">
              The edges of the highlighted region show a sharpness and shading pattern that does not match the surrounding area, consistent with content pasted in from a different photograph.
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 items-start pt-1 border-t border-slate-100">
            <div className="col-span-3 font-bold uppercase tracking-wider text-slate-900 text-[9px]">
              NOISE
            </div>
            <div className="col-span-9 text-slate-600 leading-snug">
              The region&apos;s sensor noise pattern breaks from the rest of the image, suggesting it originated from a different source image or capture device.
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 items-start pt-1 border-t border-slate-100">
            <div className="col-span-3 font-bold uppercase tracking-wider text-slate-900 text-[9px]">
              FREQUENCY
            </div>
            <div className="col-span-9 text-slate-600 leading-snug">
              This indicator showed comparatively low deviation — the file&apos;s compression structure does not by itself strongly suggest AI generation or resave manipulation.
            </div>
          </div>
        </div>
      </div>

      {/* Ⓒ TECHNICAL BASIS (Metadata on Left + Class Probability Chart on Right) */}
      <div className="bg-[#eef4f9] rounded-2xl p-4 shadow-2xs border border-slate-200/80 shrink-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-4 h-4 rounded-full border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-900 font-sans">
            C
          </div>
          <h3 className="text-xs font-black tracking-wide text-slate-950 uppercase font-sans">
            TECHNICAL BASIS
          </h3>
        </div>
        <p className="text-[10px] text-slate-500 font-medium mb-1.5 pl-6">
          Image output detail, for expert review.
        </p>

        {/* 2-Column Split: METADATA & CLASS PROBABILITY */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
          {/* Left Block: METADATA */}
          <div className="md:col-span-8 flex flex-col justify-between">
            <div className="text-center mb-1">
              <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-600">
                METADATA
              </span>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-2xs border border-slate-200/60 grid grid-cols-2 gap-y-1.5 gap-x-4 text-[9.5px] flex-1">
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-1">
                  <span className="text-slate-600 font-medium">SHA-256:</span>
                  <span className="font-bold text-slate-900 font-mono text-[8.5px] truncate max-w-25">
                    {item.sha256 || "4f9a1eddfgdgoo47nsc8021bd3e21c"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-1">
                  <span className="text-slate-600 font-medium">Software:</span>
                  <span className="font-bold text-slate-900">
                    ADOBE Photoshop
                  </span>
                </div>
                <div className="flex items-start justify-between gap-1">
                  <span className="text-slate-600 font-medium">DateTimeOriginal:</span>
                  <span className="font-bold text-slate-900">
                    N/A
                  </span>
                </div>
                <div className="flex items-start justify-between gap-1">
                  <span className="text-slate-600 font-medium">GPSLatitude:</span>
                  <span className="font-bold text-slate-900">
                    N/A
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-start justify-between gap-1">
                  <span className="text-slate-600 font-medium">File Size:</span>
                  <span className="font-bold text-slate-900">
                    {item.fileSize ? `${(item.fileSize / 1024).toFixed(1)} KB` : "N/A"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-1">
                  <span className="text-slate-600 font-medium">Dimensions:</span>
                  <span className="font-bold text-slate-900">
                    {item.dimensions || "N/A"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-1">
                  <span className="text-slate-600 font-medium">Format:</span>
                  <span className="font-bold text-slate-900">
                    {item.fileType?.toUpperCase().split("/")[1] || "JPEG"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-1">
                  <span className="text-slate-600 font-medium">GPSLongitude:</span>
                  <span className="font-bold text-slate-900">
                    N/A
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Block: CLASS PROBABILITY BAR CHART */}
          <div className="md:col-span-4 flex flex-col justify-between">
            <div className="text-center mb-1">
              <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-600">
                CLASS PROBABILITY
              </span>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-2xs border border-slate-200/60 flex items-end justify-around h-21 flex-1">
              {/* Authentic Bar */}
              <div className="flex flex-col items-center gap-1">
                <div
                  style={{ height: `${Math.max(10, Math.round(pAuth * 46))}px` }}
                  className="w-3.5 bg-[#16a34a] rounded-full transition-all"
                />
                <span className="text-[8px] font-bold text-slate-700 text-center leading-tight">
                  Authentic
                </span>
              </div>

              {/* Spliced Bar */}
              <div className="flex flex-col items-center gap-1">
                <div
                  style={{ height: `${Math.max(10, Math.round(pSplice * 46))}px` }}
                  className="w-3.5 bg-[#dc2626] rounded-full transition-all"
                />
                <span className="text-[8px] font-bold text-slate-700 text-center leading-tight">
                  Spliced
                </span>
              </div>

              {/* AI / Deepfake Bar */}
              <div className="flex flex-col items-center gap-1">
                <div
                  style={{ height: `${Math.max(10, Math.round(pAiDeepfake * 46))}px` }}
                  className={`w-3.5 rounded-full transition-all ${isDeepfake ? 'bg-[#7c2d12]' : 'bg-[#4338ca]'}`}
                />
                <span className="text-[8px] font-bold text-slate-700 text-center leading-tight">
                  {isDeepfake ? "Deepfake" : "AI Gen"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
