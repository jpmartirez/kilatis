"use client";

import React, { useState } from "react";
import { User } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    <Card className="border-slate-200 shadow-2xs">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Investigator Accounts Directory</CardTitle>
            <CardDescription>
              Manage investigator access, reset credentials, or permanently revoke accounts.
            </CardDescription>
          </div>
          <Badge variant="navy" className="font-mono text-xs self-start sm:self-auto">
            Total: {investigators.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Filter Bar */}
        {investigators.length > 0 && (
          <div className="max-w-md">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search investigators by username or ID..."
              className="text-xs h-10"
            />
          </div>
        )}

        {/* Content State */}
        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500 uppercase tracking-wider bg-slate-50 rounded-xl border border-slate-200">
            Loading team accounts...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
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
      </CardContent>
    </Card>
  );
};
