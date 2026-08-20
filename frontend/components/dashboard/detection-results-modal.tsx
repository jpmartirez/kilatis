"use client";

import React from "react";
import {
	ShieldCheck,
	AlertTriangle,
	RotateCcw,
	Sparkles,
	Bot,
} from "lucide-react";
import { BatchDetectionResponse } from "@/lib/api";

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
	if (!isOpen || !data) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
			<div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 text-slate-800 space-y-5 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
							<Sparkles className="w-4 h-4" />
						</div>
						<div>
							<h3 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-wide">
								AI Forensic Detection Results
							</h3>
							<p className="text-[11px] text-slate-400 font-medium">
								Tri-Stream Analysis (Spatial • Frequency • Wavelet)
							</p>
						</div>
					</div>

					<div className="text-right">
						<span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
							Threshold: {data.threshold_used}
						</span>
					</div>
				</div>

				{/* Case & Summary Counters */}
				<div className="grid grid-cols-3 gap-2.5 shrink-0">
					<div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
						<span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
							Authentic
						</span>
						<span className="text-xl sm:text-2xl font-black text-emerald-800">
							{data.authentic_count}
						</span>
					</div>

					<div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
						<span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
							AI Generated
						</span>
						<span className="text-xl sm:text-2xl font-black text-rose-800">
							{data.ai_generated_count}
						</span>
					</div>

					<div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
						<span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
							Deepfake (Face)
						</span>
						<span className="text-xl sm:text-2xl font-black text-amber-800">
							{data.deepfake_count}
						</span>
					</div>
				</div>

				{/* Results List */}
				<div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[150px]">
					{data.results.map((res, index) => {
						const isAuth = res.classification === "AUTHENTIC";
						const isDeepfake = res.classification === "DEEPFAKE";

						return (
							<div
								key={`${res.filename}-${index}`}
								className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
									isAuth
										? "bg-slate-50 border-slate-200"
										: isDeepfake
											? "bg-amber-50/70 border-amber-200"
											: "bg-rose-50/70 border-rose-200"
								}`}
							>
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<span className="font-mono text-[10px] font-bold text-slate-400">
											#{index + 1}
										</span>
										<span
											className="font-bold text-slate-900 truncate max-w-xs sm:max-w-sm block"
											title={res.filename}
										>
											{res.filename}
										</span>
									</div>

									<div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
										<span>
											P(Whole-Image AI):{" "}
											<strong className="text-slate-800 font-mono">
												{(res.p_tile * 100).toFixed(1)}%
											</strong>
										</span>
										{res.has_face && res.p_face !== null && (
											<span>
												• P(Face Manipulation):{" "}
												<strong className="text-slate-800 font-mono">
													{(res.p_face * 100).toFixed(1)}%
												</strong>
											</span>
										)}
										<span>• {res.tiles_analyzed} tiles</span>
									</div>
								</div>

								{/* Verdict Badge */}
								<div className="self-start sm:self-auto shrink-0">
									{isAuth ? (
										<span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide">
											<ShieldCheck className="w-3.5 h-3.5" />
											<span>AUTHENTIC</span>
										</span>
									) : isDeepfake ? (
										<span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide">
											<AlertTriangle className="w-3.5 h-3.5" />
											<span>DEEPFAKE</span>
										</span>
									) : (
										<span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide">
											<Bot className="w-3.5 h-3.5" />
											<span>AI-GENERATED</span>
										</span>
									)}
								</div>
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
		</div>
	);
};
