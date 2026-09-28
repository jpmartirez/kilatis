"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { checkPasswordStrength, PasswordRequirementsList } from "./password-requirements";

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
  const [showPassword, setShowPassword] = useState(false);
  const passwordValidation = checkPasswordStrength(password);
  const isFormValid = username.trim().length > 0 && passwordValidation.isValid;

  return (
    <Card className="border-slate-200 shadow-2xs">
      <CardHeader>
        <CardTitle>Register New Investigator</CardTitle>
        <CardDescription>
          Create authenticated forensic investigator credentials. Password must satisfy standard forensic security criteria.
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
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
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
              <p className="text-[11px] text-slate-400">
                Unique identifier for the forensic investigator.
              </p>
            </div>

            {/* Password Field & Requirements Column */}
            <div className="space-y-2.5">
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-800 uppercase tracking-wider"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter standard password"
                    required
                    className="text-xs h-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer focus:outline-hidden"
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Standards Checklist (Directly below Password Input) */}
              <PasswordRequirementsList validation={passwordValidation} />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 font-mono">
              {!isFormValid && password.length > 0 && (
                <span className="text-amber-700 font-semibold">
                  Complete all crossed-out standards to enable account creation.
                </span>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !isFormValid}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-6 h-11 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Registering Account..." : "Create Investigator Account"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
