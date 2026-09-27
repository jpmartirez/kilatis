"use client";

import React from "react";
import { MonthlyStatsResponse } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VerdictStatsChartProps {
  data: MonthlyStatsResponse | null;
  loading: boolean;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onRefresh: () => void;
}

export const VerdictStatsChart: React.FC<VerdictStatsChartProps> = ({
  data,
  loading,
  selectedMonth,
  onSelectMonth,
  onRefresh,
}) => {
  if (loading && !data) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-12 text-center text-xs font-mono text-slate-500 uppercase tracking-wider">
          Loading forensic verdict statistics...
        </CardContent>
      </Card>
    );
  }

  const summary = data?.summary || {
    total_cases: 0,
    total_images: 0,
    authentic: 0,
    spliced: 0,
    ai_generated: 0,
    ai_spliced: 0,
    manual_review: 0,
  };

  const totalVerdicts =
    summary.authentic +
    summary.spliced +
    summary.ai_generated +
    summary.ai_spliced +
    summary.manual_review;

  const calculatePct = (count: number) => {
    if (totalVerdicts === 0) return 0;
    return Math.round((count / totalVerdicts) * 100);
  };

  const verdictCategories = [
    {
      label: "Authentic",
      count: summary.authentic,
      pct: calculatePct(summary.authentic),
      color: "bg-emerald-700",
      trackColor: "bg-emerald-100",
      description: "Verified untouched photographic evidence",
    },
    {
      label: "Spliced (Local Tampering)",
      count: summary.spliced,
      pct: calculatePct(summary.spliced),
      color: "bg-amber-600",
      trackColor: "bg-amber-100",
      description: "Localized copy-paste or composite artifacts detected",
    },
    {
      label: "AI-Generated / Deepfake",
      count: summary.ai_generated,
      pct: calculatePct(summary.ai_generated),
      color: "bg-rose-700",
      trackColor: "bg-rose-100",
      description: "Diffusion or GAN synthetic generation patterns",
    },
    {
      label: "AI-Generated + Spliced",
      count: summary.ai_spliced,
      pct: calculatePct(summary.ai_spliced),
      color: "bg-indigo-700",
      trackColor: "bg-indigo-100",
      description: "Hybrid manipulation: synthetic subject with splicing",
    },
    {
      label: "Manual Review Required",
      count: summary.manual_review,
      pct: calculatePct(summary.manual_review),
      color: "bg-slate-700",
      trackColor: "bg-slate-200",
      description: "Inconclusive threshold requiring secondary review",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* FILTER HEADER & ACTIONS                                        */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 uppercase">
            Verdict Statistics &amp; Metrics
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Forensic analysis volume aggregated across active case sessions.
          </p>
        </div>

        {/* Month Selector Filter */}
        <div className="flex items-center gap-2.5">
          <label htmlFor="month-filter" className="text-xs font-bold uppercase tracking-wider text-slate-600 shrink-0">
            Filter Month:
          </label>
          <select
            id="month-filter"
            value={selectedMonth}
            onChange={(e) => onSelectMonth(e.target.value)}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 outline-hidden focus:border-slate-800 transition-colors cursor-pointer"
          >
            <option value="ALL">All Recorded Months</option>
            {data?.available_months?.map((m) => {
              // Convert "YYYY-MM" to readable label
              const [y, mon] = m.split("-");
              const dateObj = new Date(parseInt(y), parseInt(mon) - 1, 1);
              const label = dateObj.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              });
              return (
                <option key={m} value={m}>
                  {label}
                </option>
              );
            })}
          </select>

          <button
            type="button"
            onClick={onRefresh}
            className="text-xs font-bold uppercase tracking-wider px-3 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh statistics"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUMMARY STAT CARDS                                             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 sm:p-5 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Cases
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {summary.total_cases}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {summary.total_images} total images analyzed
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 sm:p-5 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Authentic
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-900 font-mono">
              {summary.authentic}
            </div>
            <div className="text-[10px] text-emerald-700 font-mono">
              {calculatePct(summary.authentic)}% of total verdicts
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 sm:p-5 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Spliced
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-900 font-mono">
              {summary.spliced}
            </div>
            <div className="text-[10px] text-amber-700 font-mono">
              {calculatePct(summary.spliced)}% of total verdicts
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 sm:p-5 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              AI / Deepfake
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-900 font-mono">
              {summary.ai_generated}
            </div>
            <div className="text-[10px] text-rose-700 font-mono">
              {calculatePct(summary.ai_generated)}% of total verdicts
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 sm:p-5 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
              AI + Spliced
            </div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-900 font-mono">
              {summary.ai_spliced}
            </div>
            <div className="text-[10px] text-indigo-700 font-mono">
              {calculatePct(summary.ai_spliced)}% of total verdicts
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 sm:p-5 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Manual Review
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
              {summary.manual_review}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {calculatePct(summary.manual_review)}% of total verdicts
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================== */}
      {/* VERDICT DISTRIBUTION GRAPH (MINIMALIST BAR VISUALIZER)        */}
      {/* ============================================================== */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>Verdict Distribution Breakdown</CardTitle>
              <CardDescription>
                Comparison of forensic findings for{" "}
                <span className="font-bold text-slate-800 font-mono">
                  {selectedMonth === "ALL" ? "All Recorded Months" : selectedMonth}
                </span>
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-[11px] self-start sm:self-auto">
              Total Verdicts: {totalVerdicts}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {totalVerdicts === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
              No evaluated cases found for this period.
            </div>
          ) : (
            <div className="space-y-4">
              {verdictCategories.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 tracking-wide">
                      {item.label}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {item.count}{" "}
                      <span className="text-slate-400 font-normal">
                        ({item.pct}%)
                      </span>
                    </span>
                  </div>

                  {/* Clean Minimalist Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200/80">
                    <div
                      className={`h-full ${item.color} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.max(item.pct, item.count > 0 ? 3 : 0)}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-500">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/* MONTH-BY-MONTH BREAKDOWN TABLE                                 */}
      {/* ============================================================== */}
      {data?.monthly_breakdown && data.monthly_breakdown.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Monthly History &amp; Breakdown</CardTitle>
            <CardDescription>
              Detailed verdict counts partitioned by calendar month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                    <th className="py-2.5 px-3">Month</th>
                    <th className="py-2.5 px-3 text-right">Cases</th>
                    <th className="py-2.5 px-3 text-right">Images</th>
                    <th className="py-2.5 px-3 text-right text-emerald-800">Authentic</th>
                    <th className="py-2.5 px-3 text-right text-amber-800">Spliced</th>
                    <th className="py-2.5 px-3 text-right text-rose-800">AI / Deepfake</th>
                    <th className="py-2.5 px-3 text-right text-indigo-800">AI + Spliced</th>
                    <th className="py-2.5 px-3 text-right text-slate-700">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {data.monthly_breakdown.map((row) => (
                    <tr
                      key={row.month}
                      className={
                        selectedMonth === row.month
                          ? "bg-slate-100/80 font-bold"
                          : "hover:bg-slate-50/70"
                      }
                    >
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                        {row.month_label || row.month}
                      </td>
                      <td className="py-2.5 px-3 text-right">{row.total_cases}</td>
                      <td className="py-2.5 px-3 text-right">{row.total_images}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700">{row.authentic}</td>
                      <td className="py-2.5 px-3 text-right text-amber-700">{row.spliced}</td>
                      <td className="py-2.5 px-3 text-right text-rose-700">{row.ai_generated}</td>
                      <td className="py-2.5 px-3 text-right text-indigo-700">{row.ai_spliced}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{row.manual_review}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
