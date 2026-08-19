"use client";

import React, { useRef, useState } from "react";
import { X, Image as ImageIcon, FileCheck } from "lucide-react";

interface UploadEvidenceSectionProps {
	evidenceFile: File | null;
	setEvidenceFile: (file: File | null) => void;
	previewUrl: string | null;
	setPreviewUrl: (url: string | null) => void;
}

export const UploadEvidenceSection: React.FC<UploadEvidenceSectionProps> = ({
	evidenceFile,
	setEvidenceFile,
	previewUrl,
	setPreviewUrl,
}) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const handleFile = (file: File) => {
		if (!file.type.startsWith("image/")) {
			alert("Please upload a valid image file (PNG, JPG, JPEG, WEBP).");
			return;
		}
		setEvidenceFile(file);
		const objectUrl = URL.createObjectURL(file);
		setPreviewUrl(objectUrl);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			handleFile(e.target.files[0]);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			handleFile(e.dataTransfer.files[0]);
		}
	};

	const handleRemoveFile = (e: React.MouseEvent) => {
		e.stopPropagation();
		setEvidenceFile(null);
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			setPreviewUrl(null);
		}
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	return (
		<section className="space-y-3">
			{/* Section Header */}
			<div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2.5">
				<div className="flex items-center gap-2">
					{/* Numbered Step Circle */}
					<div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-xs sm:text-xs text-slate-900 shrink-0">
						2
					</div>
					<h2 className="text-sm sm:text-base font-black text-slate-900 tracking-wide uppercase">
						UPLOAD EVIDENCE
					</h2>
				</div>
				<p className="text-[11px] sm:text-xs text-slate-400 font-medium">
					Please make sure the image you upload is the questioned image you
					intend to submit for analysis.{" "}
					<span className="text-[10px] text-red-500 font-bold italic ml-1">
						*Required
					</span>
				</p>
			</div>

			{/* Card Body */}
			<div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/80">
				<input
					ref={fileInputRef}
					type="file"
					accept="image/png, image/jpeg, image/jpg, image/webp"
					onChange={handleFileChange}
					className="hidden"
					id="evidence-upload-input"
				/>

				{!evidenceFile ? (
					<div
						onClick={() => fileInputRef.current?.click()}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						className={`w-full bg-[#edf2f7] hover:bg-[#e6eff7] rounded-2xl sm:rounded-3xl py-12 sm:py-16 px-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 ${
							isDragging
								? "border-slate-800 bg-[#e2ebf5] scale-[0.99]"
								: "border-transparent hover:border-slate-300/80"
						}`}
					>
						{/* Minimalist Upload Tray Icon */}
						<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-slate-800 mb-3 group-hover:scale-105 transition-transform">
							<svg
								className="w-8 h-8 sm:w-9 sm:h-9 text-slate-800 stroke-[2.2]"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1" />
								<polyline points="16 8 12 4 8 8" />
								<line x1="12" y1="4" x2="12" y2="16" />
							</svg>
						</div>

						{/* Upload Instruction Text */}
						<h3 className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-wider uppercase">
							DRAG & DROP OR CLICK TO UPLOAD
						</h3>
						<p className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">
							PNG, JPG, JPEG, WEBP
						</p>
					</div>
				) : (
					/* Uploaded File Preview Box */
					<div className="w-full bg-[#edf2f7] rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5 sm:gap-6 border border-slate-300/70">
						{/* Thumbnail Preview */}
						<div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden bg-white border border-slate-300 shrink-0 shadow-inner flex items-center justify-center">
							{previewUrl ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={previewUrl}
									alt="Evidence Preview"
									className="w-full h-full object-contain"
								/>
							) : (
								<ImageIcon className="w-8 h-8 text-slate-400" />
							)}
						</div>

						{/* File Details & Action Buttons */}
						<div className="flex-1 w-full space-y-2 text-center sm:text-left">
							<div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wide">
								<FileCheck className="w-4 h-4" />
								<span>Evidence Image Ready</span>
							</div>
							<p className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
								{evidenceFile.name}
							</p>
							<p className="text-xs text-slate-500 font-mono">
								Size: {formatFileSize(evidenceFile.size)} • Type:{" "}
								{evidenceFile.type}
							</p>

							<div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="px-4 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 shadow-2xs transition-all cursor-pointer"
								>
									Change Image
								</button>
								<button
									type="button"
									onClick={handleRemoveFile}
									className="px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold border border-red-200 transition-all flex items-center gap-1 cursor-pointer"
								>
									<X className="w-3.5 h-3.5" />
									<span>Remove</span>
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</section>
	);
};
