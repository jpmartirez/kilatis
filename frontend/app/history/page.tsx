/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getHistorySessions, HistorySessionItem, HistoryFilters } from "@/lib/api";
import { HistoryHeader } from "@/components/history/history-header";
import { HistoryTable } from "@/components/history/history-table";
import { HistoryFilterSidebar } from "@/components/history/history-filter-sidebar";

const PAGE_LIMIT = 9;

export default function HistoryPage() {
  const router = useRouter();

  // State
  const [sessions, setSessions] = useState<HistorySessionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Counts
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filter States
  const [searchInput, setSearchInput] = useState<string>("");
  const [verdictFilter, setVerdictFilter] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Active filters applied on submit
  const [activeFilters, setActiveFilters] = useState<HistoryFilters>({
    page: 1,
    limit: PAGE_LIMIT,
  });

  // Fetch History Sessions from Neon API
  const fetchSessions = useCallback(async (filters: HistoryFilters) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getHistorySessions(filters, token);
      setSessions(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
      setCurrentPage(data.page || 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load history sessions";
      console.error("Error loading history sessions:", err);
      if (
        msg.includes("Could not validate credentials") ||
        msg.includes("401") ||
        msg.includes("Unauthorized")
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/");
        return;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSessions(activeFilters);
  }, [fetchSessions, activeFilters]);

  // Apply filters
  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveFilters({
      search: searchInput.trim() || undefined,
      verdict: verdictFilter !== "ALL" ? verdictFilter : undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page: 1,
      limit: PAGE_LIMIT,
    });
  };

  // Pagination change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setActiveFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const hasActiveFilters = Boolean(
    searchInput || verdictFilter !== "ALL" || fromDate || toDate
  );

  return (
    <div className="min-h-screen bg-[#eaeff5] text-slate-900 flex flex-col font-sans p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl mx-auto space-y-4">
        {/* Top Header & Back Navigation */}
        <HistoryHeader onBack={() => router.push("/main")} />

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start mt-2">
          {/* Main Sessions Table */}
          <HistoryTable
            sessions={sessions}
            isLoading={isLoading}
            error={error}
            currentPage={currentPage}
            totalPages={totalPages}
            hasActiveFilters={hasActiveFilters}
            onPageChange={handlePageChange}
            onRetry={() => fetchSessions(activeFilters)}
          />

          {/* Right Filter Sidebar */}
          <HistoryFilterSidebar
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            fromDate={fromDate}
            onFromDateChange={setFromDate}
            toDate={toDate}
            onToDateChange={setToDate}
            verdictFilter={verdictFilter}
            onVerdictFilterChange={setVerdictFilter}
            totalCount={totalCount}
            onApplyFilters={handleApplyFilters}
          />
        </div>
      </div>
    </div>
  );
}
