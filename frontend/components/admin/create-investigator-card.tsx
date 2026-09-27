"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreateInvestigatorCardProps {
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  success: string | null;
}

export const CreateInvestigatorCard: React.FC<CreateInvestigatorCardProps> = ({
  username,
  setUsername,
  password,
  setPassword,
  onSubmit,
  loading,
  error,
  success,
}) => {
  return (
    <Card className="border-slate-200 shadow-2xs">
      <CardHeader>
        <CardTitle>Register New Investigator</CardTitle>
        <CardDescription>
          Create authenticated forensic investigator credentials. Investigators can evaluate image sets and generate reports.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold">
            {success}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="block text-xs font-bold text-slate-800 uppercase tracking-wider"
              >
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. inv_rodriguez"
                required
                className="text-xs h-11"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-800 uppercase tracking-wider"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 4 characters"
                required
                className="text-xs h-11"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-6 h-11 cursor-pointer"
            >
              {loading ? "Registering Account..." : "Create Investigator Account"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
