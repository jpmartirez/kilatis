"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Bot,
  Layers,
  HelpCircle,
  Eye,
  EyeOff,
  Maximize2,
  X,
  FileText,
} from "lucide-react";
import { BatchDetectionResponse, ImageAnalysisResult } from "@/lib/api";

interface DetectionResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
  data: BatchDetectionResponse | null;
}

export const DetectionResultsModal: React.FC<DetectionResultsModalProps> = ({
  isOpen,
  onClose,
  onReset,
  data,
}) => {
  const [selectedHeatmap, setSelectedHeatmap] = useState<{
    filename: string;
    maskUrl: string;
    verdict: string;
  } | null>(null);

  const [expandedHeatmaps, setExpandedHeatmaps] = useState<{ [key: string]: boolean }>({});

  if (!isOpen || !data) return null;

  const toggleHeatmap = (filename: string) => {
    setExpandedHeatmaps((prev) => ({
      ...prev,
      [filename]: !prev[filename],
    }));
  };

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case "Authentic":
        return {
          badge: "bg-slate-100 text-slate-800 border-slate-300",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />,
          label: "AUTHENTIC",
        };
      case "Spliced":
        return {
          badge: "bg-blue-900 text-white border-blue-950",
          icon: <Layers className="w-3.5 h-3.5 text-blue-200" />,
          label: "SPLICED",
        };
      case "AI-generated / deepfake":
        return {
          badge: "bg-slate-900 text-white border-slate-950",
          icon: <Bot className="w-3.5 h-3.5 text-slate-300" />,
          label: "AI-GENERATED",
        };
      case "AI-generated + spliced":
        return {
          badge: "bg-blue-950 text-white border-blue-900",
          icon: <Sparkles className="w-3.5 h-3.5 text-blue-300" />,
          label: "AI + SPLICED",
        };
      case "Manual review":
      default:
        return {
          badge: "bg-slate-200 text-slate-800 border-slate-300",
          icon: <HelpCircle className="w-3.5 h-3.5 text-slate-600" />,
          label: "MANUAL REVIEW",
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 text-slate-900 space-y-5 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-wide">
                Forensic Analysis Report
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Dual-Branch Verification (AI Deepfake & Splicing Localization)
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono uppercase bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold border border-slate-200">
              {data.total_images} Evidence Image{data.total_images !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Minimalist Summary Counter Cards (Black/Blue/White) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 shrink-0">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
              Authentic
            </span>
            <span className="text-lg sm:text-xl font-black text-slate-900">
              {data.authentic_count}
            </span>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 text-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-900 block">
              Spliced
            </span>
            <span className="text-lg sm:text-xl font-black text-blue-950">
              {data.spliced_count}
            </span>
          </div>

          <div className="bg-slate-900 text-white border border-slate-900 rounded-2xl p-3 text-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
              AI Generated
            </span>
            <span className="text-lg sm:text-xl font-black text-white">
              {data.ai_generated_count}
            </span>
          </div>

          <div className="bg-slate-800 text-white border border-slate-800 rounded-2xl p-3 text-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
              AI + Spliced
            </span>
            <span className="text-lg sm:text-xl font-black text-white">
              {data.ai_spliced_count}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-100 border border-slate-200 rounded-2xl p-3 text-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
              Review
            </span>
            <span className="text-lg sm:text-xl font-black text-slate-800">
              {data.manual_review_count}
            </span>
          </div>
        </div>

        {/* Forensic Results List */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-[220px]">
          {data.results.map((res: ImageAnalysisResult, index: number) => {
            const style = getVerdictStyle(res.verdict);
            const isSpliced = res.verdict === "Spliced" || res.verdict === "AI-generated + spliced";
            const showHeatmap = isSpliced && Boolean(res.mask_base64);
            const isExpanded = expandedHeatmaps[res.filename] ?? true;

            return (
              <div
                key={`${res.filename}-${index}`}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isSpliced
                    ? "bg-blue-50/20 border-blue-200"
                    : "bg-white border-slate-200 shadow-2xs"
                }`}
              >
                {/* Header & Verdict */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        #{index + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-sm truncate max-w-sm sm:max-w-md" title={res.filename}>
                        {res.filename}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {res.headline}
                    </p>
                  </div>

                  <div className="shrink-0 self-start sm:self-auto">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${style.badge}`}
                    >
                      {style.icon}
                      <span>{style.label}</span>
                    </span>
                  </div>
                </div>

                {/* Score Axes (Minimalist Cards) */}
                <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {/* AI Axis */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                        Branch 1: AI / Deepfake Score
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          {(res.scores.p_ai * 100).toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (Thr: {res.ai_axis.threshold})
                        </span>
                      </div>
                    </div>
                    {res.ai_axis.tier && (
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        res.ai_axis.state === "positive"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}>
                        {res.ai_axis.tier}
                      </span>
                    )}
                  </div>

                  {/* Splice Axis */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                        Branch 2: Splicing Score
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          {(res.scores.p_splice * 100).toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (Thr: {res.splice_axis.threshold})
                        </span>
                      </div>
                    </div>
                    {res.splice_axis.tier && (
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        res.splice_axis.state === "positive"
                          ? "bg-blue-900 text-white border-blue-900"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}>
                        {res.splice_axis.tier}
                      </span>
                    )}
                  </div>
                </div>

                {/* Splicing Heatmap Overlay — Rendered ONLY for Spliced images */}
                {showHeatmap && (
                  <div className="mt-3.5 pt-3.5 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-blue-700" />
                        <span className="text-xs font-bold text-slate-900">
                          Tamper Localization Heatmap
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleHeatmap(res.filename)}
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hide Heatmap</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Show Heatmap</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Heatmap Container */}
                    {isExpanded && res.mask_base64 && (
                      <div className="mt-2.5 bg-slate-950 rounded-2xl p-3 text-white space-y-2">
                        <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-72">
                          <img
                            src={res.mask_base64}
                            alt={`Tamper Heatmap for ${res.filename}`}
                            className="max-h-72 w-auto object-contain cursor-pointer transition-transform hover:scale-[1.01]"
                            onClick={() =>
                              setSelectedHeatmap({
                                filename: res.filename,
                                maskUrl: res.mask_base64!,
                                verdict: res.verdict,
                              })
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedHeatmap({
                                filename: res.filename,
                                maskUrl: res.mask_base64!,
                                verdict: res.verdict,
                              })
                            }
                            className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-lg text-xs backdrop-blur-xs cursor-pointer border border-slate-700"
                            title="Expand Heatmap"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Legend Guide */}
                        <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                          <div className="flex items-center gap-3">
                            <span className="text-white font-medium">Anomaly Guide:</span>
                            <span className="inline-flex items-center gap-1 text-slate-200">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span> Warm/Red: Grafted Region
                            </span>
                            <span className="inline-flex items-center gap-1 text-slate-400">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Cool/Blue: Background
                            </span>
                          </div>
                          <span className="text-slate-500">Click to expand</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Analysis</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-full py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Done</span>
          </button>
        </div>
      </div>

      {/* Full Size Heatmap Modal (Minimalist Black/White/Blue) */}
      {selectedHeatmap && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-3xl p-4 sm:p-6 text-white space-y-3 shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm sm:text-base font-bold truncate max-w-md">
                  Splicing Localization: {selectedHeatmap.filename}
                </h4>
                <p className="text-[11px] text-blue-300 font-medium">
                  Verdict: {selectedHeatmap.verdict}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedHeatmap(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center max-h-[75vh] overflow-hidden rounded-2xl bg-black">
              <img
                src={selectedHeatmap.maskUrl}
                alt="Full Size Heatmap"
                className="max-h-[75vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-3">
                <span className="text-slate-200">● Anomaly Overlay (Grafted / Spliced)</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHeatmap(null)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-full font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
