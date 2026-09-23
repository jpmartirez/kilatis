"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowUpCircle } from "lucide-react";
import {
	getCurrentUser,
	getNextCaseNumber,
	analyzeEvidenceImages,
	saveCaseSession,
	BatchDetectionResponse,
} from "@/lib/api";
import { setStoredResults } from "@/lib/storage";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { CaseDetailsSection } from "@/components/dashboard/case-details-section";
import {
	UploadEvidenceSection,
	EvidenceItem,
} from "@/components/dashboard/upload-evidence-section";
import { AcknowledgementSection } from "@/components/dashboard/acknowledgement-section";
import { extractForensicMetadata } from "@/lib/metadata-extractor";

const fileToDataUrl = (file: File): Promise<string> => {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.readAsDataURL(file);
	});
};

export default function MainPage() {
	const router = useRouter();

	const [isCheckingAuth, setIsCheckingAuth] = useState(true);
	const [investigatorUsername, setInvestigatorUsername] = useState<string>("");

	const [caseNumber, setCaseNumber] = useState("");
	const [isGeneratingCaseNumber, setIsGeneratingCaseNumber] = useState(false);
	const [caseTitle, setCaseTitle] = useState("");
	const [caseDate, setCaseDate] = useState("");
	const [caseTime, setCaseTime] = useState("");
	const [caseLocation, setCaseLocation] = useState("");
	const [investigatorName, setInvestigatorName] = useState("");
	const [caseNotes, setCaseNotes] = useState("");
	const [evidenceFiles, setEvidenceFiles] = useState<EvidenceItem[]>([]);
	const [ackForensicStandards, setAckForensicStandards] = useState(false);
	const [ackSubmissionLog, setAckSubmissionLog] = useState(false);

	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const token = localStorage.getItem("token");
		const storedUser = localStorage.getItem("user");

		if (!token || !storedUser) {
			document.cookie =
				"auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
			document.cookie =
				"user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
			router.replace("/");
			return;
		}

		const fetchUserData = async () => {
			try {
				const [dbUser, autoCaseNumber] = await Promise.all([
					getCurrentUser(token),
					getNextCaseNumber(token),
				]);
				const formattedName = dbUser.username.toUpperCase().startsWith("PLT ")
					? dbUser.username.toUpperCase()
					: `PLT ${dbUser.username.toUpperCase()}`;

				setInvestigatorUsername(formattedName);
				setInvestigatorName(formattedName);
				setCaseNumber((prev) => prev || autoCaseNumber);
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
					getNextCaseNumber(token).then((autoNum) =>
						setCaseNumber((prev) => prev || autoNum)
					);
				} catch {
					localStorage.removeItem("token");
					localStorage.removeItem("user");
					router.replace("/");
				}
			}
		};

		fetchUserData();
	}, [router]);

	const handleRegenerateCaseNumber = async () => {
		setIsGeneratingCaseNumber(true);
		try {
			const token = localStorage.getItem("token") || undefined;
			const nextNum = await getNextCaseNumber(token);
			setCaseNumber(nextNum);
		} finally {
			setIsGeneratingCaseNumber(false);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		sessionStorage.removeItem("kilatis_active_results");
		document.cookie =
			"auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
		document.cookie =
			"user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
		router.replace("/");
	};

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
			const res: BatchDetectionResponse = await analyzeEvidenceImages(
				filesToUpload,
				{
					caseNumber,
					caseTitle,
					investigatorName,
					caseNotes,
				},
			);

			const itemsWithPreviews = await Promise.all(
				res.results.map(async (resultItem, index) => {
					const originalItem = evidenceFiles[index];
					let dataUrl = "";
					let meta = undefined;

					if (originalItem?.file) {
						[dataUrl, meta] = await Promise.all([
							fileToDataUrl(originalItem.file),
							extractForensicMetadata(originalItem.file),
						]);
					}

					return {
						result: resultItem,
						previewUrl: dataUrl || originalItem?.previewUrl || "",
						originalName: originalItem?.file?.name || resultItem.filename,
						fileSize: originalItem?.file?.size,
						fileType: originalItem?.file?.type,
						sha256: meta?.sha256,
						dimensions: meta?.dimensions || "N/A",
						metadata: meta,
					};
				}),
			);

			const payload = {
				caseNumber,
				caseTitle,
				caseDate: caseDate.trim() || undefined,
				caseTime: caseTime.trim() || undefined,
				caseLocation: caseLocation.trim() || undefined,
				investigatorName:
					investigatorName.trim() || investigatorUsername || "INVESTIGATOR",
				caseNotes,
				analyzedAt: new Date().toISOString(),
				items: itemsWithPreviews,
				summary: {
					total: res.total_images,
					authentic: res.authentic_count,
					spliced: res.spliced_count,
					ai: res.ai_generated_count,
					aiSpliced: res.ai_spliced_count,
					manual: res.manual_review_count,
				},
			};

			await setStoredResults("kilatis_active_results", payload);

			saveCaseSession({
				case_number: caseNumber,
				case_title: caseTitle,
				case_date: caseDate.trim() || undefined,
				case_time: caseTime.trim() || undefined,
				case_location: caseLocation.trim() || undefined,
				verdicts: res.results.map((r) => r.verdict.toUpperCase()),
				total_images: res.total_images,
			}).catch((saveErr) =>
				console.warn("Failed to persist case session to history:", saveErr),
			);

			router.push("/results");
		} catch (err) {
			console.error("Error running AI detection analysis:", err);
			alert("Analysis failed. Please ensure the backend is running.");
		} finally {
			setIsSubmitting(false);
		}
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
				<DashboardHeader
					investigatorName={investigatorUsername}
					onLogout={handleLogout}
				/>

				<form
					onSubmit={handleSubmit}
					className="bg-[#e4ebf3] rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 lg:p-10 border border-slate-300/80 shadow-md space-y-6 sm:space-y-8"
				>
					<CaseDetailsSection
						caseNumber={caseNumber}
						setCaseNumber={setCaseNumber}
						caseTitle={caseTitle}
						setCaseTitle={setCaseTitle}
						caseDate={caseDate}
						setCaseDate={setCaseDate}
						caseTime={caseTime}
						setCaseTime={setCaseTime}
						caseLocation={caseLocation}
						setCaseLocation={setCaseLocation}
						investigatorName={investigatorName}
						setInvestigatorName={setInvestigatorName}
						caseNotes={caseNotes}
						setCaseNotes={setCaseNotes}
						isGeneratingCaseNumber={isGeneratingCaseNumber}
						onRegenerateCaseNumber={handleRegenerateCaseNumber}
					/>

					<UploadEvidenceSection
						evidenceFiles={evidenceFiles}
						setEvidenceFiles={setEvidenceFiles}
					/>

					<AcknowledgementSection
						ackForensicStandards={ackForensicStandards}
						setAckForensicStandards={setAckForensicStandards}
						ackSubmissionLog={ackSubmissionLog}
						setAckSubmissionLog={setAckSubmissionLog}
					/>

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

			{isSubmitting && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs select-none">
					<div className="relative w-full max-w-sm mx-4 bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 flex flex-col items-center text-center space-y-4">
						<div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 border border-slate-300 shadow-inner">
							<Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
						</div>

						<div className="space-y-1">
							<h3 className="text-base font-black text-slate-900 tracking-wide uppercase">
								Analyzing...
							</h3>
						</div>

						<p className="text-[10px] text-slate-400 font-medium">
							Please do not close this app while detection is underway.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}