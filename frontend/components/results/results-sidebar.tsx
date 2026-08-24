"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { VerdictCard } from "./verdict-card";
import { ClassProbabilityCard } from "./class-probability-card";
import { MetadataCard } from "./metadata-card";
import { ImageAnalysisResult } from "@/lib/api";
import { ProbBarItem, StoredResultItem, VerdictCardData } from "@/types/results";

interface ResultsSidebarProps {
  verdictData: VerdictCardData;
  probBars: ProbBarItem[];
  caseNumber: string;
  caseTitle: string;
  investigatorName: string;
  caseNotes: string;
  currentItem: StoredResultItem;
  currentResult: ImageAnalysisResult;
  onGenerateReport?: () => void;
}

export const ResultsSidebar: React.FC<ResultsSidebarProps> = ({
  verdictData,
  probBars,
  caseNumber,
  caseTitle,
  investigatorName,
  caseNotes,
  currentItem,
  currentResult,
  onGenerateReport,
}) => {
  const router = useRouter();

  const handleGenerateReport = () => {
    if (onGenerateReport) {
      onGenerateReport();
    } else {
      router.push("/report");
    }
  };

  return (
    <aside className="lg:col-span-4 space-y-3.5 sticky top-4">
      {/* 1. Verdict Card */}
      <VerdictCard verdictData={verdictData} />

      {/* 2. Class Probability Bar Chart */}
      <ClassProbabilityCard probBars={probBars} />

      {/* 3. Metadata Card */}
      <MetadataCard
        caseNumber={caseNumber}
        caseTitle={caseTitle}
        investigatorName={investigatorName}
        caseNotes={caseNotes}
        currentItem={currentItem}
        currentResult={currentResult}
      />

      {/* 4. Generate Report Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleGenerateReport}
          className="w-full bg-[#181f2a] hover:bg-[#2c3746] text-white rounded-full py-4 px-5 font-black tracking-widest text-xs uppercase flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.99] cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>GENERATE REPORT</span>
        </button>
      </div>
    </aside>
  );
};
