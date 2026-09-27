"use client";

import React, { useState } from "react";
import { User } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface AccountHistoryTableProps {
  investigators: User[];
  loading: boolean;
  onNavigateToCreate?: () => void;
}

export const AccountHistoryTable: React.FC<AccountHistoryTableProps> = ({
  investigators,
  loading,
  onNavigateToCreate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = investigators.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (isoStr: string): string => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Account Creation History</CardTitle>
            <CardDescription>
              Complete audit record of investigator accounts registered by this administrator
            </CardDescription>
          </div>
          {onNavigateToCreate && (
            <button
              type="button"
              onClick={onNavigateToCreate}
              className="text-xs font-bold uppercase tracking-wider px-3.5 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer self-start sm:self-auto"
            >
              + Create New Investigator
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="max-w-md">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter accounts by username or ID..."
            className="text-xs h-10"
          />
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500 uppercase tracking-wider">
            Loading registered accounts...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
            {searchTerm
              ? "No accounts match the specified search term."
              : "No investigator accounts registered yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Account ID</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Registered Date</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 font-sans">
                      {u.username}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {u.id}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Badge variant="success" className="font-mono text-[10px]">
                        ACTIVE
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
