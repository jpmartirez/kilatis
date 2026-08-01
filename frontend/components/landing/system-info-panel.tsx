import React from "react";
import Image from "next/image";

export const SystemInfoPanel = () => {
	return (
		<section className="bg-[#2a3847] text-white rounded-[2rem] p-6 lg:p-7 flex flex-col justify-between shadow-xl border border-slate-700/50 h-full lg:min-h-0 lg:overflow-hidden gap-5 lg:gap-2">
			{/* Top Header Title */}
			<div className="space-y-1 lg:space-y-0.5 shrink-0">
				<h2 className="text-2xl sm:text-3xl lg:text-3xl font-extrabold tracking-wide text-white uppercase leading-tight">
					DIGITAL IMAGE
				</h2>
				<div>
					<span className="bg-[#e4ebf3] text-[#2a3847] font-black text-lg sm:text-xl lg:text-2xl tracking-wider px-4 sm:px-5 py-1 rounded-full inline-block uppercase shadow-sm">
						AUTHENTICATION
					</span>
				</div>
				<h2 className="text-2xl sm:text-3xl lg:text-3xl font-extrabold tracking-wide text-white uppercase leading-tight">
					ANALYSIS TOOL
				</h2>
			</div>

			{/* Middle Tampered Image Preview (Uncompressed aspect ratio on mobile, flex fill on desktop) */}
			<div className="relative rounded-2xl overflow-hidden my-2 lg:my-3 border border-slate-500/30 shadow-xl group aspect-video min-h-50 sm:min-h-60 lg:min-h-0 lg:flex-1 w-full">
				<Image
					src="/tampered-img.png"
					alt="Tampered Image Analysis Preview"
					fill
					sizes="(max-width: 1024px) 100vw, 50vw"
					className="object-cover transition-transform duration-500 group-hover:scale-105"
					priority
				/>

				{/* Overlay Result Badge */}
				<div className="absolute bottom-3 left-3 bg-[#ab2b23] text-white font-bold text-[11px] sm:text-xs px-3.5 py-1.5 rounded-full shadow-lg border border-red-400/40 flex items-center gap-1.5 tracking-wider uppercase backdrop-blur-xs">
					<span>RESULT: IMAGE IS TAMPERED</span>
				</div>
			</div>

			{/* Bottom Description */}
			<div className="space-y-2 lg:space-y-1.5 shrink-0 pt-1">
				<p className="text-slate-200 text-sm lg:text-sm leading-relaxed lg:leading-snug font-normal">
					KILATIS is an advanced image forensic analysis powered by a tri-stream
					deep learning architecture.
				</p>
				<p className="text-slate-300 text-xs sm:text-sm lg:text-sm leading-relaxed lg:leading-snug font-light opacity-95">
					Providing rapid tamper detection and explainable forensic reporting
					for cybercrime investigators.
				</p>
			</div>
		</section>
	);
};
