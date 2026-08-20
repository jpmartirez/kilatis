"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowUpCircle } from "lucide-react";
import { getCurrentUser, analyzeEvidenceImages, BatchDetectionResponse } from "@/lib/api";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { CaseDetailsSection } from "@/components/dashboard/case-details-section";
import {
  UploadEvidenceSection,
  EvidenceItem,
} from "@/components/dashboard/upload-evidence-section";
import { AcknowledgementSection } from "@/components/dashboard/acknowledgement-section";
import { DetectionResultsModal } from "@/components/dashboard/detection-results-modal";

export default function MainPage() {
  const router = useRouter();

  // Authentication & DB User State
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [investigatorUsername, setInvestigatorUsername] = useState<string>("");

  // Form Fields (All Required)
  const [caseNumber, setCaseNumber] = useState("");
  const [caseTitle, setCaseTitle] = useState("");
  const [investigatorName, setInvestigatorName] = useState("");
  const [caseNotes, setCaseNotes] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceItem[]>([]);
  const [ackForensicStandards, setAckForensicStandards] = useState(false);
  const [ackSubmissionLog, setAckSubmissionLog] = useState(false);

  // Analysis & Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<BatchDetectionResponse | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.replace("/");
      return;
    }

    // Fetch fresh user data directly from Neon PostgreSQL Database via /api/auth/me
    const fetchUserData = async () => {
      try {
        const dbUser = await getCurrentUser(token);
        const formattedName = dbUser.username.toUpperCase().startsWith("PLT ")
          ? dbUser.username.toUpperCase()
          : `PLT ${dbUser.username.toUpperCase()}`;

        setInvestigatorUsername(formattedName);
        setInvestigatorName(formattedName);
        setIsCheckingAuth(false);
      } catch (err) {
        console.error("Failed to fetch fresh user from database:", err);
        try {
          const parsed = JSON.parse(storedUser);
          const formattedName = parsed.username.toUpperCase().startsWith("PLT ")
            ? parsed.username.toUpperCase()
            : `PLT ${parsed.username.toUpperCase()}`;
          setInvestigatorUsername(formattedName);
          setInvestigatorName(formattedName);
          setIsCheckingAuth(false);
        } catch {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/");
        }
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.replace("/");
  };

  // Validation: ALL fields are required
  const isFormValid =
    caseNumber.trim().length > 0 &&
    caseTitle.trim().length > 0 &&
    investigatorName.trim().length > 0 &&
    caseNotes.trim().length > 0 &&
    evidenceFiles.length > 0 &&
    ackForensicStandards &&
    ackSubmissionLog;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const filesToUpload = evidenceFiles.map((item) => item.file);
      const res = await analyzeEvidenceImages(filesToUpload, {
        caseNumber,
        caseTitle,
        investigatorName,
        caseNotes,
      });

      setAnalysisResults(res);
      setShowResultsModal(true);
    } catch (err) {
      console.error("Error running AI detection analysis:", err);
      alert("Analysis failed. Please ensure the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setShowResultsModal(false);
    setAnalysisResults(null);
    setCaseNumber("");
    setCaseTitle("");
    setCaseNotes("");
    evidenceFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setEvidenceFiles([]);
    setAckForensicStandards(false);
    setAckSubmissionLog(false);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full bg-[#edf2f7] flex items-center justify-center font-sans text-slate-700">
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-md border border-slate-200">
          <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Loading Investigator Session...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#edf2f7] text-slate-800 font-sans selection:bg-slate-800 selection:text-white py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
        {/* Top Header Row with Title and Active Session from Neon DB */}
        <DashboardHeader
          investigatorName={investigatorUsername}
          onLogout={handleLogout}
        />

        {/* Main Dashboard Container */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#e4ebf3] rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 lg:p-10 border border-slate-300/80 shadow-md space-y-6 sm:space-y-8"
        >
          {/* Step 1: Case Details */}
          <CaseDetailsSection
            caseNumber={caseNumber}
            setCaseNumber={setCaseNumber}
            caseTitle={caseTitle}
            setCaseTitle={setCaseTitle}
            investigatorName={investigatorName}
            setInvestigatorName={setInvestigatorName}
            caseNotes={caseNotes}
            setCaseNotes={setCaseNotes}
          />

          {/* Step 2: Upload Evidence (Multi-image & Folder Upload) */}
          <UploadEvidenceSection
            evidenceFiles={evidenceFiles}
            setEvidenceFiles={setEvidenceFiles}
          />

          {/* Step 3: Acknowledgement */}
          <AcknowledgementSection
            ackForensicStandards={ackForensicStandards}
            setAckForensicStandards={setAckForensicStandards}
            ackSubmissionLog={ackSubmissionLog}
            setAckSubmissionLog={setAckSubmissionLog}
          />

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full bg-[#1b232b] hover:bg-[#2b3744] text-white rounded-full py-4 px-6 font-black tracking-widest text-xs sm:text-sm uppercase flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.99] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>ANALYZING EVIDENCE WITH KILATIS AI...</span>
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />
                  <span>
                    SUBMIT FOR ANALYSIS{" "}
                    {evidenceFiles.length > 0
                      ? `(${evidenceFiles.length} ${
                          evidenceFiles.length === 1 ? "IMAGE" : "IMAGES"
                        })`
                      : ""}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Detection Results Modal */}
      <DetectionResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        onReset={handleResetForm}
        data={analysisResults}
      />
    </div>
  );
}
