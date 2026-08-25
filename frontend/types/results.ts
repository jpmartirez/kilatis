import { ImageAnalysisResult } from "@/lib/api";
import { ForensicMetadata } from "@/lib/metadata-extractor";

export interface StoredResultItem {
  result: ImageAnalysisResult;
  previewUrl: string;
  originalName: string;
  fileSize?: number;
  fileType?: string;
  sha256?: string;
  dimensions?: string;
  metadata?: ForensicMetadata;
}

export interface StoredResultsPayload {
  caseNumber: string;
  caseTitle: string;
  investigatorName: string;
  caseNotes: string;
  analyzedAt: string;
  items: StoredResultItem[];
  summary: {
    total: number;
    authentic: number;
    spliced: number;
    ai: number;
    aiSpliced: number;
    manual: number;
  };
}

export interface ProbBarItem {
  label: string;
  val: number;
  height: number;
}

export interface VerdictCardData {
  bg: string;
  subtitle: string;
  title: string;
  conf: string;
}
