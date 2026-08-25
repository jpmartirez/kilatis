"use client";

import React, { useState } from "react";
import { User } from "@/lib/api";
import { History, Search, Loader2 } from "lucide-react";
import { InvestigatorRowItem } from "./investigator-row-item";

interface InvestigatorListProps {
  investigators: User[];
  loading: boolean;
  onResetPassword: (user: User) => void;
  onDelete: (user: User) => void;
}

export const InvestigatorList: React.FC<InvestigatorListProps> = ({
  investigators,
  loading,
  onResetPassword,
  onDelete,
}) => {
  const [search, setSearch] = useState("");

  const filtered = investigators.filter(
    (inv) =>
      inv.username.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="space-y-3">
      {/* Dark Navy Banner */}
      <div className="bg-[#243346] text-white px-5 py-3 rounded-2xl flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <History className="w-4 h-4 text-slate-300 stroke-[2.5]" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase font-sans">
            INVESTIGATORS
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-300 font-bold">
          TOTAL: {investigators.length}
        </span>
      </div>

      {/* Container Body */}
      <div className="bg-[#e4ebf3] rounded-3xl sm:rounded-[2.2rem] p-4 sm:p-6 border border-slate-300/80 shadow-sm space-y-3.5">
        {/* Search Filter Bar */}
        {investigators.length > 0 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search investigators by username or ID..."
              className="w-full bg-white text-xs font-medium text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-full outline-hidden border border-slate-200 shadow-2xs"
            />
          </div>
        )}

        {/* Content State */}
        {loading ? (
          <div className="bg-white/80 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-slate-800" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Loading Team Accounts...
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 font-medium text-xs border border-slate-200/80">
            {search
              ? "No investigators match your search criteria."
              : "No investigator accounts registered yet. Use the form above to add your team members."}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((inv) => (
              <InvestigatorRowItem
                key={inv.id}
                investigator={inv}
                onResetPassword={onResetPassword}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
