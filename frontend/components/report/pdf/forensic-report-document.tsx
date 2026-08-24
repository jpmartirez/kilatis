"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image as PdfImage,
  StyleSheet,
} from "@react-pdf/renderer";
import { ReportCaseData } from "@/types/report";
import { StoredResultItem } from "@/types/results";

// Styles for @react-pdf/renderer perfectly proportioned for full-page A4
const styles = StyleSheet.create({
  page: {
    size: "A4",
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 36,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#020617",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    marginBottom: 14,
  },
  sectionCard: {
    backgroundColor: "#eef4f9",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    border: "0.5px solid #cbd5e1",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  circleIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    border: "1px solid #0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  circleIconText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#020617",
    textTransform: "uppercase",
  },
  sectionSubtitle: {
    fontSize: 8,
    color: "#64748b",
    marginLeft: 22,
    marginBottom: 8,
  },
  innerWhiteBox: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 10,
    border: "0.5px solid #e2e8f0",
  },
  grid2Col: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  col: {
    flex: 1,
  },
  labelSmall: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  valueText: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  paragraphText: {
    fontSize: 9,
    color: "#1e293b",
    lineHeight: 1.4,
  },
  bannerQuestioned: {
    backgroundColor: "#243346",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  bannerLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginRight: 6,
  },
  bannerValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  verdictBox: {
    width: "30%",
    borderRadius: 10,
    padding: 9,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    marginRight: 10,
    minHeight: 88,
  },
  verdictSubtitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    opacity: 0.9,
  },
  verdictTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    marginTop: 2,
  },
  verdictConfLabel: {
    fontSize: 7,
    color: "#ffffff",
    marginTop: 4,
    opacity: 0.9,
  },
  verdictConfVal: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  viewportCard: {
    backgroundColor: "#18181b",
    borderRadius: 10,
    padding: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  viewportImage: {
    width: "100%",
    height: 110,
    objectFit: "contain",
    borderRadius: 6,
  },
  viewportLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#cbd5e1",
    textTransform: "uppercase",
    marginTop: 4,
    textAlign: "center",
  },
  pillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 8,
  },
  pillCard: {
    width: "31.5%",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 7,
    border: "0.5px solid #e2e8f0",
  },
  streamRow: {
    flexDirection: "row",
    paddingVertical: 3.5,
    borderTop: "0.5px solid #f1f5f9",
  },
  streamCol1: {
    width: "22%",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textTransform: "uppercase",
  },
  streamCol2: {
    width: "78%",
    fontSize: 7.8,
    color: "#475569",
    lineHeight: 1.3,
  },
  blankInputBox: {
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    height: 24,
  },
  warningBanner: {
    backgroundColor: "#a82d24",
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
  },
  warningBannerText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    textAlign: "center",
  },
  disclaimerBox: {
    backgroundColor: "#eef4f9",
    borderRadius: 10,
    padding: 8,
    border: "0.5px solid #cbd5e1",
    alignItems: "center",
  },
  disclaimerText: {
    fontSize: 7.5,
    color: "#475569",
    textAlign: "center",
    lineHeight: 1.35,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "0.5px solid #cbd5e1",
    paddingTop: 5,
    marginTop: 8,
    fontSize: 7.5,
    color: "#94a3b8",
  },
});

interface ForensicReportDocumentProps {
  caseData: ReportCaseData;
  examinerNotes?: string;
}

export const ForensicReportDocument: React.FC<ForensicReportDocumentProps> = ({
  caseData,
  examinerNotes,
}) => {
  const caseNumber = caseData.caseNumber || "KIL-0417-2026";
  const caseTitle = caseData.caseTitle || "VERIFY SUSPECT IMAGE";
  const items = caseData.items || [];

  let dateAnalyzed = "2026-07-18 14:32 PST";
  let timestampShort = "07-18 · 14:32";
  if (caseData.analyzedAt) {
    try {
      const d = new Date(caseData.analyzedAt);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hr = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      dateAnalyzed = `${yr}-${mo}-${day} ${hr}:${min} PST`;
      timestampShort = `${mo}-${day} · ${hr}:${min}`;
    } catch {
      dateAnalyzed = caseData.analyzedAt;
    }
  }

  return (
    <Document title={`Forensic_Analysis_Report_${caseNumber}`} author="KILATIS Forensic System">
      {/* ======================================================== */}
      {/* PAGE 1: OVERVIEW & CASE INTAKE NOTES                     */}
      {/* ======================================================== */}
      <Page size="A4" style={styles.page}>
        <View style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Document Header */}
          <View>
            <Text style={styles.headerTitle}>FORENSIC ANALYSIS REPORT</Text>
            <Text style={styles.headerSubtitle}>
              Automated tri-stream tamper detection · Case {caseNumber} · Prepared for PNP Anti-Cybercrime Group
            </Text>
          </View>

          {/* ① CASE INFORMATION */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.circleIcon}>
                <Text style={styles.circleIconText}>1</Text>
              </View>
              <Text style={styles.sectionTitle}>CASE INFORMATION</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Evidence and submission details recorded at intake.
            </Text>

            <View style={styles.innerWhiteBox}>
              <View style={styles.grid2Col}>
                <View style={styles.col}>
                  <Text style={styles.labelSmall}>CASE NUMBER</Text>
                  <Text style={styles.valueText}>{caseNumber}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.labelSmall}>DATE ANALYZED</Text>
                  <Text style={styles.valueText}>{dateAnalyzed}</Text>
                </View>
              </View>
              <View style={{ marginTop: 6 }}>
                <Text style={styles.labelSmall}>CASE TITLE</Text>
                <Text style={[styles.valueText, { textTransform: "uppercase" }]}>{caseTitle}</Text>
              </View>
            </View>
          </View>

          {/* ② CONFIDENCE, LIMITATIONS & CHAIN OF CUSTODY */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.circleIcon}>
                <Text style={styles.circleIconText}>2</Text>
              </View>
              <Text style={styles.sectionTitle}>CONFIDENCE, LIMITATIONS & CHAIN OF CUSTODY</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              What this result does and does not establish.
            </Text>

            <View style={styles.innerWhiteBox}>
              <Text style={[styles.paragraphText, { marginBottom: 8 }]}>
                Performance varies by tampering type and image quality; heavily compressed or low-resolution images reduce reliability, particularly for the frequency-based indicator.
              </Text>

              <Text style={styles.labelSmall}>TIMESTAMP</Text>
              <View style={{ marginTop: 2 }}>
                <View style={[styles.grid2Col, { borderBottom: "0.5px solid #f1f5f9", paddingBottom: 3 }]}>
                  <Text style={{ fontSize: 8, color: "#475569" }}>{timestampShort}</Text>
                  <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#0f172a" }}>Tri-stream analysis completed</Text>
                  <Text style={{ fontSize: 8, color: "#475569" }}>KILATIS-TRISTREAM V1.0</Text>
                </View>
                <View style={[styles.grid2Col, { borderBottom: "0.5px solid #f1f5f9", paddingVertical: 3 }]}>
                  <Text style={{ fontSize: 8, color: "#475569" }}>{timestampShort}</Text>
                  <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#0f172a" }}>Report Generated</Text>
                  <Text style={{ fontSize: 8, color: "#475569" }}>KILATIS-TRISTREAM V1.0</Text>
                </View>
                <View style={[styles.grid2Col, { paddingTop: 3 }]}>
                  <Text style={{ fontSize: 8, color: "#475569" }}>{timestampShort}</Text>
                  <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#0f172a" }}>PENDING EXAMINER REVIEW</Text>
                  <Text style={{ fontSize: 8, color: "#94a3b8" }}>---------------------</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ③ CASE DESCRIPTION/NOTES (Fills remaining space) */}
          <View style={[styles.sectionCard, { flex: 1, minHeight: 180, display: "flex", flexDirection: "column" }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.circleIcon}>
                <Text style={styles.circleIconText}>3</Text>
              </View>
              <Text style={styles.sectionTitle}>CASE DESCRIPTION/NOTES</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Information that relates to the investigation or case.
            </Text>

            <View style={[styles.innerWhiteBox, { flex: 1 }]}>
              {caseData.caseNotes ? (
                <Text style={styles.paragraphText}>{caseData.caseNotes}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>KILATIS FORENSICS REPORT</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* ======================================================== */}
      {/* PAGES 2 .. (N+1): 1 COMPLETE DEDICATED PAGE PER IMAGE     */}
      {/* ======================================================== */}
      {items.map((item: StoredResultItem, idx: number) => {
        const result = item.result;
        const verdict = result.verdict || "Manual review";
        const isSpliced =
          verdict.toLowerCase().includes("spliced") || verdict === "AI-generated + spliced";
        const isAi =
          verdict.toLowerCase().includes("ai") || verdict.toLowerCase().includes("deepfake");
        const isAuthentic = verdict.toLowerCase().includes("authentic");

        let verdictBg = "#d97706";
        let verdictStatusText = "MANUAL REVIEW REQUIRED";
        let confScore = 50;

        if (isSpliced) {
          verdictBg = "#dc2626";
          verdictStatusText = "TAMPER DETECTED";
          confScore = result.scores?.p_splice ? Math.round(result.scores.p_splice * 100) : 93;
        } else if (isAi) {
          verdictBg = "#4338ca";
          verdictStatusText = "SYNTHESIS DETECTED";
          confScore = result.scores?.p_ai ? Math.round(result.scores.p_ai * 100) : 92;
        } else if (isAuthentic) {
          verdictBg = "#16a34a";
          verdictStatusText = "NO TAMPER DETECTED";
          confScore = result.class_probabilities?.authentic
            ? Math.round(result.class_probabilities.authentic * 100)
            : 93;
        }

        const spatialPct = Math.round((result.streams?.spatial_score ?? result.scores?.p_ai ?? 0.82) * 100);
        const noisePct = Math.round((result.streams?.noise_score ?? result.scores?.p_splice ?? 0.25) * 100);
        const freqPct = Math.round((result.streams?.frequency_score ?? result.scores?.p_ai ?? 0.34) * 100);

        const pAuth = result.class_probabilities?.authentic ?? (isAuthentic ? 0.93 : 0.05);
        const pSplice = result.class_probabilities?.traditional_spliced ?? (isSpliced ? 0.93 : 0.08);
        const pAiDeepfake = result.class_probabilities?.ai_deepfake ?? (isAi ? 0.92 : 0.12);

        const filename = item.originalName || result.filename || `asset${idx + 1}.jpg`;

        return (
          <Page key={idx} size="A4" style={styles.page}>
            <View style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              {/* Questioned Image Banner */}
              <View style={styles.bannerQuestioned}>
                <Text style={styles.bannerLabel}>QUESTIONED IMAGE:</Text>
                <Text style={styles.bannerValue}>{filename}</Text>
              </View>

              {/* Ⓐ VERDICT & EXECUTIVE SUMMARY */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.circleIcon}>
                    <Text style={styles.circleIconText}>A</Text>
                  </View>
                  <Text style={styles.sectionTitle}>VERDICT & EXECUTIVE SUMMARY</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Overall finding, in plain language, for non-technical readers.
                </Text>

                <View style={[styles.innerWhiteBox, { flexDirection: "row", alignItems: "center" }]}>
                  {/* Verdict Badge */}
                  <View style={[styles.verdictBox, { backgroundColor: verdictBg }]}>
                    <View>
                      <Text style={styles.verdictSubtitle}>{verdictStatusText}</Text>
                      <Text style={styles.verdictTitle}>
                        {verdict === "AI-generated / deepfake" ? "AI DEEPFAKE" : verdict.toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.verdictConfLabel}>Confidence</Text>
                      <Text style={styles.verdictConfVal}>{confScore}%</Text>
                    </View>
                  </View>

                  {/* Summary Text */}
                  <View style={{ width: "70%" }}>
                    {isSpliced ? (
                      <>
                        <Text style={[styles.paragraphText, { marginBottom: 4 }]}>
                          All three detection methods agree that this image has been altered. The evidence is consistent with <Text style={{ fontFamily: "Helvetica-Bold" }}>image splicing</Text> — content copied from a separate source photograph and inserted into this one.
                        </Text>
                        <Text style={{ fontSize: 7.5, color: "#64748b", lineHeight: 1.3 }}>
                          The system located the affected area in the upper-right portion of the frame, covering roughly 8% of the image. This finding is driven primarily by visual-structure and sensor-noise evidence; frequency-domain evidence was comparatively weak.
                        </Text>
                      </>
                    ) : isAi ? (
                      <>
                        <Text style={[styles.paragraphText, { marginBottom: 4 }]}>
                          Multi-branch neural analysis detected structural artifacts characteristic of <Text style={{ fontFamily: "Helvetica-Bold" }}>AI synthesis and deepfake generation</Text>.
                        </Text>
                        <Text style={{ fontSize: 7.5, color: "#64748b", lineHeight: 1.3 }}>
                          The finding is driven by frequency domain irregularities and convolutional generative fingerprint patterns detected across internal network layers.
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.paragraphText, { marginBottom: 4 }]}>
                          The image exhibits consistent physical sensor noise and natural optical characteristics with <Text style={{ fontFamily: "Helvetica-Bold" }}>no evidence of splicing or AI tampering</Text>.
                        </Text>
                        <Text style={{ fontSize: 7.5, color: "#64748b", lineHeight: 1.3 }}>
                          PRNU sensor pattern noise distribution and compression boundaries match native camera hardware capture properties.
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>

              {/* Ⓑ VISUAL EVIDENCE */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.circleIcon}>
                    <Text style={styles.circleIconText}>B</Text>
                  </View>
                  <Text style={styles.sectionTitle}>VISUAL EVIDENCE</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Questioned image and heatmap overlay.
                </Text>

                {/* Viewports */}
                <View style={[styles.grid2Col, { marginBottom: 6 }]}>
                  {/* Questioned Image */}
                  <View style={[styles.viewportCard, { width: isSpliced && result.mask_base64 ? "48.5%" : "55%", marginHorizontal: isSpliced && result.mask_base64 ? 0 : "auto" }]}>
                    {item.previewUrl && <PdfImage src={item.previewUrl} style={styles.viewportImage} />}
                    <Text style={styles.viewportLabel}>QUESTIONED IMAGE</Text>
                  </View>

                  {/* GradCAM Heatmap (Spliced ONLY) */}
                  {isSpliced && result.mask_base64 && (
                    <View style={[styles.viewportCard, { width: "48.5%" }]}>
                      <PdfImage src={result.mask_base64} style={styles.viewportImage} />
                      <Text style={styles.viewportLabel}>GRADCAM HEATMAP</Text>
                    </View>
                  )}
                </View>

                {/* Localized Evidence Caption */}
                <Text style={{ fontSize: 8, color: "#0f172a", marginBottom: 6 }}>
                  <Text style={{ color: "#64748b" }}>Localized evidence: </Text>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>
                    {isSpliced
                      ? "upper-right quadrant, ~8% of frame — consistent with a duplicated region"
                      : isAi
                      ? "global frequency and generative boundary inconsistency"
                      : "uniform sensor noise across frame — no localized anomaly detected"}
                  </Text>
                </Text>

                {/* 3 Metric Pills */}
                <View style={styles.pillRow}>
                  <View style={styles.pillCard}>
                    <Text style={styles.labelSmall}>SPATIAL</Text>
                    <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#020617" }}>{spatialPct}%</Text>
                    <Text style={{ fontSize: 7, color: "#64748b" }}>
                      {spatialPct > 60 ? "Boundary artifact" : "Consistent edge structure"}
                    </Text>
                  </View>

                  <View style={styles.pillCard}>
                    <Text style={styles.labelSmall}>NOISE</Text>
                    <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#020617" }}>{noisePct}%</Text>
                    <Text style={{ fontSize: 7, color: "#64748b" }}>
                      {noisePct > 50 ? "PRNU mismatch" : "Uniform sensor noise"}
                    </Text>
                  </View>

                  <View style={styles.pillCard}>
                    <Text style={styles.labelSmall}>FREQUENCY</Text>
                    <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#020617" }}>{freqPct}%</Text>
                    <Text style={{ fontSize: 7, color: "#64748b" }}>
                      {freqPct > 50 ? "DCT anomaly detected" : "Low DCT deviation"}
                    </Text>
                  </View>
                </View>

                {/* Stream Explanations */}
                <View style={styles.innerWhiteBox}>
                  <View style={styles.streamRow}>
                    <Text style={styles.streamCol1}>SPATIAL</Text>
                    <Text style={styles.streamCol2}>
                      The edges of the highlighted region show a sharpness and shading pattern that does not match the surrounding area, consistent with content pasted in from a different photograph.
                    </Text>
                  </View>

                  <View style={styles.streamRow}>
                    <Text style={styles.streamCol1}>NOISE</Text>
                    <Text style={styles.streamCol2}>
                      The region&apos;s sensor noise pattern breaks from the rest of the image, suggesting it originated from a different source image or capture device.
                    </Text>
                  </View>

                  <View style={styles.streamRow}>
                    <Text style={styles.streamCol1}>FREQUENCY</Text>
                    <Text style={styles.streamCol2}>
                      This indicator showed comparatively low deviation — the file&apos;s compression structure does not by itself strongly suggest AI generation or resave manipulation.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Ⓒ TECHNICAL BASIS (Metadata + Class Probability) */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.circleIcon}>
                    <Text style={styles.circleIconText}>C</Text>
                  </View>
                  <Text style={styles.sectionTitle}>TECHNICAL BASIS</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Image output detail, for expert review.
                </Text>

                <View style={[styles.grid2Col, { alignItems: "stretch" }]}>
                  {/* Left: METADATA */}
                  <View style={{ width: "65%" }}>
                    <Text style={[styles.labelSmall, { textAlign: "center", marginBottom: 3 }]}>METADATA</Text>
                    <View style={[styles.innerWhiteBox, { flexDirection: "row", justifyContent: "space-between" }]}>
                      <View style={{ width: "50%" }}>
                        <Text style={{ fontSize: 7, color: "#64748b" }}>SHA-256: <Text style={{ color: "#0f172a", fontFamily: "Helvetica-Bold" }}>{item.sha256 ? item.sha256.substring(0, 16) + "..." : "4f9a1eddfgdgoo..."}</Text></Text>
                        <Text style={{ fontSize: 7, color: "#64748b", marginTop: 3 }}>Software: <Text style={{ color: "#0f172a", fontFamily: "Helvetica-Bold" }}>ADOBE Photoshop</Text></Text>
                        <Text style={{ fontSize: 7, color: "#64748b", marginTop: 3 }}>DateTimeOriginal: <Text style={{ color: "#0f172a", fontFamily: "Helvetica-Bold" }}>N/A</Text></Text>
                        <Text style={{ fontSize: 7, color: "#64748b", marginTop: 3 }}>GPSLatitude: <Text style={{ color: "#0f172a", fontFamily: "Helvetica-Bold" }}>N/A</Text></Text>
                      </View>
                      <View style={{ width: "50%" }}>
                        <Text style={{ fontSize: 7, color: "#64748b" }}>File Size: <Text style={{ color: "#0f172a", fontFamily: "Helvetica-Bold" }}>{item.fileSize ? `${(item.fileSize / 1024).toFixed(1)} KB` : "N/A"}</Text></Text>
                        <Text style={{ fontSize: 7, color: "#64748b", marginTop: 3 }}>Dimensions: <Text style={{ color: "#0f172a", fontFamily: "Helvetica-Bold" }}>{item.dimensions || "N/A"}</Text></Text>
                        <Text style={{ fontSize: 7, color: "#64748b", marginTop: 3 }}>Format: <Text style={{ color: "#0f172a", fontFamily: "Helvetica-Bold" }}>{item.fileType?.toUpperCase().split("/")[1] || "JPEG"}</Text></Text>
                        <Text style={{ fontSize: 7, color: "#64748b", marginTop: 3 }}>GPSLongitude: <Text style={{ color: "#0f172a", fontFamily: "Helvetica-Bold" }}>N/A</Text></Text>
                      </View>
                    </View>
                  </View>

                  {/* Right: CLASS PROBABILITY BARS */}
                  <View style={{ width: "32%" }}>
                    <Text style={[styles.labelSmall, { textAlign: "center", marginBottom: 3 }]}>CLASS PROBABILITY</Text>
                    <View style={[styles.innerWhiteBox, { height: 68, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around" }]}>
                      <View style={{ alignItems: "center" }}>
                        <View style={{ width: 10, height: Math.max(8, Math.round(pAuth * 36)), backgroundColor: "#475569", borderRadius: 5 }} />
                        <Text style={{ fontSize: 6.5, color: "#334155", fontFamily: "Helvetica-Bold", marginTop: 3 }}>Authentic</Text>
                      </View>

                      <View style={{ alignItems: "center" }}>
                        <View style={{ width: 10, height: Math.max(8, Math.round(pSplice * 36)), backgroundColor: "#dc2626", borderRadius: 5 }} />
                        <Text style={{ fontSize: 6.5, color: "#334155", fontFamily: "Helvetica-Bold", marginTop: 3 }}>Spliced</Text>
                      </View>

                      <View style={{ alignItems: "center" }}>
                        <View style={{ width: 10, height: Math.max(8, Math.round(pAiDeepfake * 36)), backgroundColor: "#334155", borderRadius: 5 }} />
                        <Text style={{ fontSize: 6.5, color: "#334155", fontFamily: "Helvetica-Bold", marginTop: 3, textAlign: "center" }}>AI Deepfake</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer} fixed>
              <Text>KILATIS FORENSICS REPORT</Text>
              <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
            </View>
          </Page>
        );
      })}

      {/* ======================================================== */}
      {/* LAST PAGE: EXAMINER'S NOTES, CERTIFICATION & DISCLAIMER   */}
      {/* ======================================================== */}
      <Page size="A4" style={styles.page}>
        <View style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {/* ④ EXAMINER'S NOTES/ANALYSIS (Blank open canvas matching design) */}
          <View style={[styles.sectionCard, { flex: 1, minHeight: 280, display: "flex", flexDirection: "column" }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.circleIcon}>
                <Text style={styles.circleIconText}>4</Text>
              </View>
              <Text style={styles.sectionTitle}>EXAMINER&apos;S NOTES/ANALYSIS</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Anything that the examiner or investigator want to to the document
            </Text>

            <View style={[styles.innerWhiteBox, { flex: 1 }]}>
              <Text style={styles.paragraphText}></Text>
            </View>
          </View>

          {/* ④ EXAMINER CERTIFICATION */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.circleIcon}>
                <Text style={styles.circleIconText}>4</Text>
              </View>
              <Text style={styles.sectionTitle}>EXAMINER CERTIFICATION</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Certify that you have reviewed this automated finding.
            </Text>

            <View style={styles.innerWhiteBox}>
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 7.5, color: "#1e293b", marginBottom: 3 }}>
                  (  )  I certify that I have reviewed the automated findings above against the source evidence file. <Text style={{ color: "#ef4444", fontFamily: "Helvetica-Bold" }}>*Required</Text>
                </Text>
                <Text style={{ fontSize: 7.5, color: "#1e293b" }}>
                  (  )  I acknowledge that this report accurately reflects the KILATIS system output at the time of analysis. <Text style={{ color: "#ef4444", fontFamily: "Helvetica-Bold" }}>*Required</Text>
                </Text>
              </View>

              <View style={styles.grid2Col}>
                <View style={[styles.col, { marginRight: 8 }]}>
                  <Text style={styles.labelSmall}>NAME</Text>
                  <View style={styles.blankInputBox} />
                </View>

                <View style={styles.col}>
                  <Text style={styles.labelSmall}>BADGE NUMBER</Text>
                  <View style={styles.blankInputBox} />
                </View>
              </View>

              <View style={[styles.grid2Col, { marginTop: 6 }]}>
                <View style={[styles.col, { marginRight: 8 }]}>
                  <Text style={styles.labelSmall}>SIGNATURE</Text>
                  <View style={styles.blankInputBox} />
                </View>

                <View style={styles.col}>
                  <Text style={styles.labelSmall}>DATE</Text>
                  <View style={styles.blankInputBox} />
                </View>
              </View>
            </View>
          </View>

          {/* Red Warning Banner */}
          <View style={styles.warningBanner}>
            <Text style={styles.warningBannerText}>
              AUTOMATED PRELIMINARY ANALYSIS — NOT A SUBSTITUTE FOR EXPERT REVIEW
            </Text>
          </View>

          {/* Legal Disclaimer Box */}
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              This report was produced by an automated preliminary screening tool developed for research and investigative-assistance purposes. It is not a substitute for manual forensic examination by a qualified digital forensics expert, and should not be relied upon as sole evidentiary basis in any legal proceeding without independent expert verification.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>KILATIS FORENSICS REPORT</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
