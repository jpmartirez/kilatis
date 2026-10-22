// Shared formatting + plain-language explanation of the meta-classifier output,
// used by both the on-screen/print report and the downloadable PDF so they stay identical.
import type { ImageAnalysisResult } from "@/lib/api";

const MONTHS = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December",
];

/** "2026-09-28" -> "September 28, 2026"; returns null when not provided. */
export function formatIncidentDate(date?: string): string | null {
	const value = date?.trim();
	if (!value) return null;
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!m) return value;
	const month = MONTHS[Number(m[2]) - 1];
	return month ? `${month} ${Number(m[3])}, ${m[1]}` : value;
}

/** "14:30" -> "2:30 PM"; returns null when not provided. */
export function formatIncidentTime(time?: string): string | null {
	const value = time?.trim();
	if (!value) return null;
	const m = /^(\d{1,2}):(\d{2})/.exec(value);
	if (!m) return value;
	const h = Number(m[1]);
	return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

export interface EvidenceFactor {
	label: string;
	value: string;
	points: number;
	toward: string;
}

export type ConfidenceKey = "high" | "moderate" | "low" | "manual review";

export interface DecisionExplanation {
	available: boolean;
	learned: boolean;
	confidenceKey: ConfidenceKey | null;
	confidenceLabel: string;
	confidenceColor: string;
	summary: string;
	evidenceToward: string | null;
	evidence: EvidenceFactor[];
	notes: string[];
}

const CONFIDENCE: Record<ConfidenceKey, { label: string; color: string }> = {
	high: { label: "HIGH CONFIDENCE", color: "#16a34a" },
	moderate: { label: "MODERATE CONFIDENCE", color: "#d97706" },
	low: { label: "LOW CONFIDENCE", color: "#ea580c" },
	"manual review": { label: "MANUAL REVIEW", color: "#475569" },
};

const CONFLICT_TEXT: Record<string, string> = {
	both_positive: "both detectors positive",
	near_cutoff: "score near a decision cut-off",
	streams_disagree: "AI-detection streams disagree",
	face_vs_tile: "face and whole-image AI scores disagree",
};

const REASON_PATTERN = /^(.+?) = (-?\d+(?:\.\d+)?) \(\+(\d+) pts toward (.+)\)$/;

function pct(v: number): string {
	return `${Math.round(v * 100)}%`;
}

function noteText(line: string): string | null {
	const text = line.trim();
	if (!text || text === "localization mask available" || text.startsWith("Error:")) return null;
	if (text.startsWith("confidence lowered one level")) {
		return "Confidence lowered one level because of an input-quality issue or a detection branch that could not assess the image.";
	}
	if (text.startsWith("secondary note: ")) {
		const rest = text.slice("secondary note: ".length);
		return `Secondary finding: ${rest.charAt(0).toUpperCase()}${rest.slice(1)}.`;
	}
	if (text.startsWith("quality: ")) return `Input quality: ${text.slice("quality: ".length)}.`;
	return text;
}

export interface SpliceFindings {
	/** Opening sentence, followed in the report by the bold phrase "image splicing". */
	lead: string;
	detail: string;
	/** Short "Localized evidence" caption under the heatmap. */
	caption: string;
}

/** Plain-language splice findings built from this image's own scores and tamper region. */
export function getSpliceFindings(result: ImageAnalysisResult): SpliceFindings {
	const lead = `The splice detection branch flagged this image as altered (splice score ${pct(result.scores?.p_splice ?? 0)}). The evidence is consistent with`;

	const loc = result.tamper_location;
	const area = result.tamper_area;
	let where: string | null = null;
	let size: string | null = null;
	if (loc && area != null) {
		where =
			loc === "spread across the image" ? loc : loc === "center" ? "center of the frame" : `${loc} part of the frame`;
		size = area < 0.01 ? "less than 1%" : `about ${pct(area)}`;
	}

	const sentences = [
		where && size
			? `The suspected area is in the ${where}, covering ${size} of the image.`
			: "The suspected area is highlighted on the tampering heatmap.",
	];
	const ai = result.ai_axis;
	if (ai && ai.state !== "not-assessable") {
		const pAi = result.scores?.p_ai ?? 0;
		sentences.push(
			pAi >= ai.threshold
				? `The AI-detection branch also gave a raised score (${pct(pAi)}), so the inserted content may itself be AI-generated.`
				: `The AI-detection branch found no strong sign of AI generation (score ${pct(pAi)}).`,
		);
	}

	const caption =
		where && size
			? `${where.charAt(0).toUpperCase()}${where.slice(1)}, ${size} of the image`
			: "suspected spliced area highlighted on the heatmap";

	return { lead, detail: sentences.join(" "), caption };
}

/** Turns the backend's meta-classifier fields into report-ready, plain-language explanation. */
export function getDecisionExplanation(result: ImageAnalysisResult): DecisionExplanation {
	const confidenceKey = (result.confidence?.toLowerCase() || null) as ConfidenceKey | null;
	const conf = confidenceKey ? CONFIDENCE[confidenceKey] : undefined;
	const learned = result.decider === "learned";
	const verdict = result.verdict || "Manual review";

	const evidence: EvidenceFactor[] = (result.reasons ?? []).slice(0, 3).flatMap((reason) => {
		const m = REASON_PATTERN.exec(reason);
		return m ? [{ label: m[1], value: Number(m[2]).toFixed(2), points: Number(m[3]), toward: m[4] }] : [];
	});

	const flags = (result.conflicts ?? []).map((c) => CONFLICT_TEXT[c] ?? c);
	const notes = (result.detail ?? []).map(noteText).filter((n): n is string => Boolean(n));
	if (flags.length > 0) notes.push(`Hard-case flags: ${flags.join(", ")}.`);

	const base = {
		learned,
		confidenceKey: conf ? confidenceKey : null,
		confidenceLabel: conf?.label ?? "",
		confidenceColor: conf?.color ?? "#475569",
		evidenceToward: evidence[0]?.toward ?? null,
		evidence,
		notes,
	};

	// Results analysed before the learned decision layer existed carry none of these fields
	if (!result.decider && !conf && evidence.length === 0) {
		return {
			...base,
			available: false,
			summary: "A decision explanation is not available for this result (it was analysed before the explainable decision layer was introduced).",
		};
	}

	if (!learned) {
		return {
			...base,
			available: true,
			summary: "This verdict was produced by the rule-based decision gates because the learned meta-classifier was not available, so no evidence ranking is provided.",
		};
	}

	const probs = result.class_probabilities;
	const ranked = [
		{ label: "Authentic", p: probs?.authentic ?? 0 },
		{ label: "Spliced", p: probs?.traditional_spliced ?? 0 },
		{ label: "AI-generated / deepfake", p: probs?.ai_deepfake ?? 0 },
	].sort((a, b) => b.p - a.p);
	const [top, second] = ranked;

	let summary: string;
	if (verdict === "Manual review") {
		summary =
			top.p === 0
				? "Neither detection branch could assess this image, so no automated verdict was made. The image is referred for manual forensic examination."
				: `The meta-classifier could not reach a confident verdict: ${top.label} ${pct(top.p)} vs ${second.label} ${pct(second.p)}. The image is referred for manual forensic examination.`;
	} else {
		summary = `Combining the evidence from both detection branches, the meta-classifier assigned ${pct(top.p)} probability to ${verdict} (next: ${second.label} ${pct(second.p)}).`;
	}

	return { ...base, available: true, summary };
}
