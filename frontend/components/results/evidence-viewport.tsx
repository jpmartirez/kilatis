/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import {
	ZoomIn,
	ZoomOut,
	RotateCcw,
	Layers,
	ChevronLeft,
	ChevronRight,
	SplitSquareVertical,
} from "lucide-react";
import { StoredResultItem } from "@/types/results";

interface EvidenceViewportProps {
	currentItem: StoredResultItem;
	items: StoredResultItem[];
	selectedIndex: number;
	onSelectIndex: (index: number) => void;
	activeTab: "asset" | "heatmap";
	onTabChange: (tab: "asset" | "heatmap") => void;
	hasHeatmap: boolean;
	zoomLevel: number;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onZoomReset: () => void;
}

export const EvidenceViewport: React.FC<EvidenceViewportProps> = ({
	currentItem,
	items,
	selectedIndex,
	onSelectIndex,
	hasHeatmap,
	zoomLevel,
	onZoomIn,
	onZoomOut,
	onZoomReset,
}) => {
	const currentResult = currentItem.result;

	const isSpliced =
		Boolean(currentResult.mask_base64) &&
		(currentResult.verdict === "Spliced" ||
			currentResult.verdict === "AI-generated + spliced" ||
			hasHeatmap);

	return (
		<div className="bg-[#e4ebf3] rounded-3xl p-4 sm:p-5 border border-slate-300/80 shadow-xs space-y-3">
			<div className="flex items-center justify-between">
				{isSpliced ? (
					<div className="bg-white px-3.5 py-1.5 rounded-full shadow-2xs border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-800">
						<SplitSquareVertical className="w-3.5 h-3.5 text-blue-600" />
						<span>Comparative View: Questioned Asset &amp; Heatmap</span>
					</div>
				) : (
					<div className="bg-white px-3.5 py-1.5 rounded-full shadow-2xs border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-800">
						<span>Questioned Asset</span>
					</div>
				)}

				{items.length > 1 && (
					<div className="flex items-center gap-2 text-xs font-bold text-slate-600">
						<button
							type="button"
							onClick={() => onSelectIndex(Math.max(0, selectedIndex - 1))}
							disabled={selectedIndex === 0}
							className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
						>
							<ChevronLeft className="w-4 h-4" />
						</button>
						<span>
							{selectedIndex + 1} / {items.length}
						</span>
						<button
							type="button"
							onClick={() =>
								onSelectIndex(Math.min(items.length - 1, selectedIndex + 1))
							}
							disabled={selectedIndex === items.length - 1}
							className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				)}
			</div>

			<div className="relative w-full h-90 sm:h-107.5 lg:h-117.5 bg-[#1e232a] rounded-2xl overflow-hidden p-2.5 sm:p-3 shadow-inner">
				{isSpliced ? (
					<div
						className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 w-full h-full transition-transform duration-150 ease-out origin-center"
						style={{ transform: `scale(${zoomLevel})` }}
					>
						<div className="relative flex items-center justify-center h-full bg-[#13171c] rounded-xl overflow-hidden p-2 border border-slate-700/60 shadow-inner">
							<div className="absolute top-2.5 left-2.5 z-10 bg-black/75 backdrop-blur-xs text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border border-white/10">
								Questioned Asset
							</div>
							<img
								src={currentItem.previewUrl}
								alt={`Original - ${currentResult.filename}`}
								className="max-h-full max-w-full object-contain rounded-md pointer-events-none"
							/>
						</div>

						<div className="relative flex items-center justify-center h-full bg-[#13171c] rounded-xl overflow-hidden p-2 border border-rose-900/40 shadow-inner">
							<div className="absolute top-2.5 left-2.5 z-10 bg-rose-950/80 backdrop-blur-xs text-rose-200 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border border-rose-500/40 flex items-center gap-1.5 shadow-sm">
								<Layers className="w-3 h-3 text-rose-400" />
								<span>Tampering Heatmap</span>
							</div>
							<img
								src={currentResult.mask_base64 || currentItem.previewUrl}
								alt={`Heatmap - ${currentResult.filename}`}
								className="max-h-full max-w-full object-contain rounded-md pointer-events-none"
							/>
						</div>
					</div>
				) : (
					<div
						className="transition-transform duration-150 ease-out flex items-center justify-center w-full h-full p-2 origin-center"
						style={{ transform: `scale(${zoomLevel})` }}
					>
						<img
							src={currentItem.previewUrl}
							alt={currentResult.filename}
							className="max-h-full max-w-full object-contain rounded-lg pointer-events-none"
						/>
					</div>
				)}

				<div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-medium px-3 py-1 rounded-md z-20">
					{currentItem.dimensions || "NATIVE RESOLUTION"} ·{" "}
					{currentItem.fileType?.toUpperCase().split("/")[1] || "JPEG"}
				</div>

				<div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs rounded-lg shadow-md p-1 flex items-center gap-1 border border-slate-200 text-slate-700 z-20">
					<button
						type="button"
						onClick={onZoomIn}
						className="p-1.5 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
						title="Zoom In"
					>
						<ZoomIn className="w-3.5 h-3.5" />
					</button>
					<button
						type="button"
						onClick={onZoomOut}
						className="p-1.5 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
						title="Zoom Out"
					>
						<ZoomOut className="w-3.5 h-3.5" />
					</button>
					<button
						type="button"
						onClick={onZoomReset}
						className="p-1.5 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
						title="Reset Zoom"
					>
						<RotateCcw className="w-3.5 h-3.5" />
					</button>
				</div>
			</div>

			{items.length > 1 && (
				<div className="pt-1 overflow-x-auto flex items-center gap-2 pb-1">
					{items.map((item, idx) => {
						const isSelected = idx === selectedIndex;
						const itemSplice =
							item.result.verdict === "Spliced" ||
							item.result.verdict === "AI-generated + spliced";
						return (
							<button
								key={`${item.originalName}-${idx}`}
								type="button"
								onClick={() => onSelectIndex(idx)}
								className={`relative shrink-0 w-16 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-slate-900 ${
									isSelected
										? "border-blue-600 ring-2 ring-blue-400"
										: "border-slate-300 opacity-60 hover:opacity-100"
								}`}
							>
								<img
									src={item.previewUrl}
									alt={item.originalName}
									className="w-full h-full object-cover"
								/>
								{itemSplice && (
									<div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-1 ring-white" />
								)}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
};
