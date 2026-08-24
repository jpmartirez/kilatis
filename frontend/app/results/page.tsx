/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getStoredResults, clearStoredResults } from "@/lib/storage";
import { StoredResultsPayload, ProbBarItem, VerdictCardData } from "@/types/results";
import { ResultsHeader } from "@/components/results/results-header";
import { EvidenceViewport } from "@/components/results/evidence-viewport";
import { PerStreamEvidence } from "@/components/results/per-stream-evidence";
import { ResultsSidebar } from "@/components/results/results-sidebar";

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<StoredResultsPayload | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"asset" | "heatmap">("asset");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load results from persistent IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        const parsed = await getStoredResults<StoredResultsPayload>("kilatis_active_results");
        if (!parsed || !parsed.items || parsed.items.length === 0) {
          router.replace("/main");
          return;
        }
        setData(parsed);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading results from storage:", err);
        router.replace("/main");
      }
    }
    loadData();
  }, [router]);

  const currentItem = useMemo(() => {
    if (!data || !data.items || data.items.length === 0) return null;
    return data.items[selectedIndex] || data.items[0];
  }, [data, selectedIndex]);

  const currentResult = currentItem?.result;
  const isCurrentSpliced =
    currentResult?.verdict === "Spliced" ||
    currentResult?.verdict === "AI-generated + spliced";
  const hasHeatmap = Boolean(isCurrentSpliced && currentResult?.mask_base64);

  // Reset tab & zoom upon image selection change
  useEffect(() => {
    setZoomLevel(1);
    if (isCurrentSpliced && hasHeatmap) {
      setActiveTab("heatmap");
    } else {
      setActiveTab("asset");
    }
  }, [selectedIndex, isCurrentSpliced, hasHeatmap]);

  const handleNewAnalysis = async () => {
    try {
      await clearStoredResults("kilatis_active_results");
      sessionStorage.removeItem("kilatis_active_results");
    } catch (err) {
      console.error("Error clearing results:", err);
    }
    router.push("/main");
  };

  if (isLoading || !data || !currentItem || !currentResult) {
    return (
      <div className="min-h-screen w-full bg-[#edf2f7] flex items-center justify-center font-sans text-slate-800">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider">Loading Forensic Results...</span>
        </div>
      </div>
    );
  }

  // Format analysis date
  const dateObj = new Date(data.analyzedAt || Date.now());
  const formattedDate = dateObj.toISOString().replace("T", " ").substring(0, 16) + " PST";

  // Stream metrics
  const pAi = currentResult.scores?.p_ai ?? 0;
  const pSplice = currentResult.scores?.p_splice ?? 0;
  const spatialScore = currentResult.streams?.spatial_score ?? pAi;
  const frequencyScore = currentResult.streams?.frequency_score ?? (pAi * 0.4);
  const noiseScore = currentResult.streams?.noise_score ?? pSplice;
  const noiseInconsistency = currentResult.streams?.noise_inconsistency ?? pSplice;

  const spatialPct = Math.round(spatialScore * 100);
  const frequencyPct = Math.round(frequencyScore * 100);
  const noisePct = Math.round((isCurrentSpliced ? Math.max(noiseScore, noiseInconsistency) : noiseScore) * 100);

  // 3 Canonical Classes: Authentic, Traditional Spliced, AI-Generated / Deepfake
  const pAuth = currentResult.class_probabilities?.authentic ?? Math.max(0, 1 - Math.max(pAi, pSplice));
  const pTradSplice = currentResult.class_probabilities?.traditional_spliced ?? pSplice;
  const pAiDeepfake = currentResult.class_probabilities?.ai_deepfake ?? pAi;

  const probBars: ProbBarItem[] = [
    { label: "Authentic", val: pAuth, height: Math.round(pAuth * 100) },
    { label: "Traditional Spliced", val: pTradSplice, height: Math.round(pTradSplice * 100) },
    { label: "AI-Generated / Deepfake", val: pAiDeepfake, height: Math.round(pAiDeepfake * 100) },
  ];

  // Verdict Presentation
  const getVerdictCard = (): VerdictCardData => {
    if (currentResult.verdict === "Spliced") {
      return {
        bg: "bg-[#e52538] text-white",
        subtitle: "TAMPER DETECTED",
        title: "SPLICED",
        conf: `${Math.round(pSplice * 100)}%`,
      };
    }
    if (currentResult.verdict === "AI-generated + spliced") {
      return {
        bg: "bg-[#181f2a] text-white",
        subtitle: "SYNTHETIC & TAMPERED",
        title: "AI + SPLICED",
        conf: `${Math.round(Math.max(pAi, pSplice) * 100)}%`,
      };
    }
    if (currentResult.verdict === "AI-generated / deepfake") {
      return {
        bg: "bg-[#1e293b] text-white",
        subtitle: "SYNTHESIS DETECTED",
        title: "AI-GENERATED",
        conf: `${Math.round(pAi * 100)}%`,
      };
    }
    if (currentResult.verdict === "Authentic") {
      return {
        bg: "bg-[#0f172a] text-white",
        subtitle: "NO TAMPERING DETECTED",
        title: "AUTHENTIC",
        conf: `${Math.round(pAuth * 100)}%`,
      };
    }
    return {
      bg: "bg-slate-700 text-white",
      subtitle: "INSUFFICIENT SIGNAL",
      title: "MANUAL REVIEW",
      conf: "N/A",
    };
  };

  const verdictData = getVerdictCard();

  return (
    <div className="min-h-screen w-full bg-[#edf2f7] text-slate-900 font-sans p-3 sm:p-5 lg:p-6 select-none overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* 1. Header Information Capsule */}
        <ResultsHeader
          filename={currentResult.filename}
          investigatorName={data.investigatorName}
          formattedDate={formattedDate}
          onNewAnalysis={handleNewAnalysis}
        />

        {/* 2. Main Grid: Left Viewport & Right Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Visualizer Viewport + Findings & Per-Stream Evidence */}
          <main className="lg:col-span-8 space-y-4">
            <EvidenceViewport
              currentItem={currentItem}
              items={data.items}
              selectedIndex={selectedIndex}
              onSelectIndex={setSelectedIndex}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              hasHeatmap={hasHeatmap}
              zoomLevel={zoomLevel}
              onZoomIn={() => setZoomLevel((prev) => Math.min(prev + 0.25, 3))}
              onZoomOut={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5))}
              onZoomReset={() => setZoomLevel(1)}
            />

            <PerStreamEvidence
              result={currentResult}
              spatialPct={spatialPct}
              noisePct={noisePct}
              frequencyPct={frequencyPct}
              isSpliced={Boolean(isCurrentSpliced)}
            />
          </main>

          {/* Right Column: Fixed Forensic Report Sidebar */}
          <ResultsSidebar
            verdictData={verdictData}
            probBars={probBars}
            caseNumber={data.caseNumber}
            caseTitle={data.caseTitle}
            investigatorName={data.investigatorName}
            caseNotes={data.caseNotes}
            currentItem={currentItem}
            currentResult={currentResult}
            onGenerateReport={() => router.push("/report")}
          />
        </div>
      </div>
    </div>
  );
}
