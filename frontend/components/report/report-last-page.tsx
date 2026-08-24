"use client";

import React, { useState } from "react";
import { ReportCaseData } from "@/types/report";
import { AlertTriangle } from "lucide-react";

interface ReportLastPageProps {
	caseData: ReportCaseData;
	examinerNotes: string;
	onNotesChange: (val: string) => void;
	examinerName: string;
	onExaminerNameChange: (val: string) => void;
	dateVal: string;
	onDateValChange: (val: string) => void;
}

export const ReportLastPage: React.FC<ReportLastPageProps> = ({
	onNotesChange,
	examinerName,
	onExaminerNameChange,
	dateVal,
	onDateValChange,
}) => {
	const [cert1, setCert1] = useState(false);
	const [cert2, setCert2] = useState(false);
	const [badgeNumber, setBadgeNumber] = useState("");
	const [signature, setSignature] = useState("");

	return (
		<div className="space-y-4 flex-1 flex flex-col justify-between font-sans h-full">
			{/* ④ EXAMINER'S NOTES/ANALYSIS */}
			<div className="bg-[#eef4f9] rounded-2xl p-5 shadow-2xs border border-slate-200/80 flex-1 flex flex-col min-h-65">
				<div className="flex items-center gap-2 mb-0.5">
					<div className="w-4 h-4 rounded-full border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-900 font-sans">
						4
					</div>
					<h3 className="text-xs font-black tracking-wide text-slate-950 uppercase font-sans">
						EXAMINER&apos;S NOTES/ANALYSIS
					</h3>
				</div>
				<p className="text-[10px] text-slate-500 font-medium mb-3 pl-6">
					Anything that the examiner or investigator want to to the document
				</p>

				{/* Large Clean White Area without placeholder */}
				<div className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200/60 flex-1 flex flex-col">
					<textarea
						onChange={(e) => onNotesChange(e.target.value)}
						className="w-full flex-1 resize-none border-none outline-hidden text-xs text-slate-800 leading-relaxed font-sans bg-transparent"
					/>
				</div>
			</div>

			{/* ④ EXAMINER CERTIFICATION */}
			<div className="bg-[#eef4f9] rounded-2xl p-5 shadow-2xs border border-slate-200/80 shrink-0">
				<div className="flex items-center gap-2 mb-0.5">
					<div className="w-4 h-4 rounded-full border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-900 font-sans">
						4
					</div>
					<h3 className="text-xs font-black tracking-wide text-slate-950 uppercase font-sans">
						EXAMINER CERTIFICATION
					</h3>
				</div>
				<p className="text-[10px] text-slate-500 font-medium mb-3 pl-6">
					Certify that you have reviewed this automated finding.
				</p>

				{/* Inner White Box */}
				<div className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200/60 space-y-3.5 text-xs">
					{/* Checkboxes */}
					<div className="space-y-2">
						<label className="flex items-start gap-2.5 cursor-pointer">
							<input
								type="checkbox"
								checked={cert1}
								onChange={(e) => setCert1(e.target.checked)}
								className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-0"
							/>
							<span className="text-slate-800 font-medium text-[11px] leading-snug">
								I certify that I have reviewed the automated findings above
								against the source evidence file.{" "}
								<span className="text-red-500 font-bold">*Required</span>
							</span>
						</label>

						<label className="flex items-start gap-2.5 cursor-pointer">
							<input
								type="checkbox"
								checked={cert2}
								onChange={(e) => setCert2(e.target.checked)}
								className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-0"
							/>
							<span className="text-slate-800 font-medium text-[11px] leading-snug">
								I acknowledge that this report accurately reflects the KILATIS
								system output at the time of analysis.{" "}
								<span className="text-red-500 font-bold">*Required</span>
							</span>
						</label>
					</div>

					{/* Form Fields: Clean blank input capsules without placeholder text */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
						<div>
							<span className="text-[9px] font-bold font-sans text-slate-600 uppercase tracking-wider block mb-1">
								NAME
							</span>
							<input
								type="text"
								value={examinerName}
								onChange={(e) => onExaminerNameChange(e.target.value)}
								className="w-full bg-[#f1f5f9] rounded-lg px-3 py-2 text-xs text-slate-900 font-medium outline-hidden border border-transparent focus:border-slate-300 min-h-7.5"
							/>
						</div>

						<div>
							<span className="text-[9px] font-bold font-sans text-slate-600 uppercase tracking-wider block mb-1">
								BADGE NUMBER
							</span>
							<input
								type="text"
								value={badgeNumber}
								onChange={(e) => setBadgeNumber(e.target.value)}
								className="w-full bg-[#f1f5f9] rounded-lg px-3 py-2 text-xs text-slate-900 font-medium outline-hidden border border-transparent focus:border-slate-300 min-h-7.5"
							/>
						</div>

						<div>
							<span className="text-[9px] font-bold font-sans text-slate-600 uppercase tracking-wider block mb-1">
								SIGNATURE
							</span>
							<input
								type="text"
								value={signature}
								onChange={(e) => setSignature(e.target.value)}
								className="w-full bg-[#f1f5f9] rounded-lg px-3 py-2 text-xs text-slate-900 font-serif italic outline-hidden border border-transparent focus:border-slate-300 min-h-7.5"
							/>
						</div>

						<div>
							<span className="text-[9px] font-bold font-sans text-slate-600 uppercase tracking-wider block mb-1">
								DATE
							</span>
							<input
								type="text"
								value={dateVal}
								onChange={(e) => onDateValChange(e.target.value)}
								className="w-full bg-[#f1f5f9] rounded-lg px-3 py-2 text-xs text-slate-900 font-medium outline-hidden border border-transparent focus:border-slate-300 min-h-7.5"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Red Warning Banner */}
			<div className="bg-[#a82d24] text-white py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 text-center shrink-0">
				<AlertTriangle className="w-3.5 h-3.5 shrink-0 text-white" />
				<span className="text-[11px] font-black uppercase tracking-wider font-sans">
					AUTOMATED PRELIMINARY ANALYSIS — NOT A SUBSTITUTE FOR EXPERT REVIEW
				</span>
			</div>

			{/* Official Legal Disclaimer Box */}
			<div className="bg-[#eef4f9] rounded-2xl p-4 border border-slate-200/80 text-center shadow-2xs shrink-0">
				<p className="text-[10px] text-slate-600 leading-relaxed font-sans max-w-2xl mx-auto">
					This report was produced by an automated preliminary screening tool
					developed for research and investigative-assistance purposes. It is
					not a substitute for manual forensic examination by a qualified
					digital forensics expert, and should not be relied upon as sole
					evidentiary basis in any legal proceeding without independent expert
					verification.
				</p>
			</div>
		</div>
	);
};
