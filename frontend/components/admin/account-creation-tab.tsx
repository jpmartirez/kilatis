"use client";

import React from "react";
import { User } from "@/lib/api";
import { CreateInvestigatorCard } from "./create-investigator-card";
import { InvestigatorList } from "./investigator-list";

interface AccountCreationTabProps {
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  createLoading: boolean;
  createError: string | null;
  createSuccess: string | null;
  investigators: User[];
  loadingList: boolean;
  onResetPassword: (user: User) => void;
  onDelete: (user: User) => void;
}

export const AccountCreationTab: React.FC<AccountCreationTabProps> = ({
  username,
  setUsername,
  password,
  setPassword,
  onSubmit,
  createLoading,
  createError,
  createSuccess,
  investigators,
  loadingList,
  onResetPassword,
  onDelete,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase font-sans">
          INVESTIGATOR ACCOUNT MANAGEMENT
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Create new investigator credentials and manage existing forensic accounts.
        </p>
      </div>

      <CreateInvestigatorCard
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        onSubmit={onSubmit}
        loading={createLoading}
        error={createError}
        success={createSuccess}
      />

      <InvestigatorList
        investigators={investigators}
        loading={loadingList}
        onResetPassword={onResetPassword}
        onDelete={onDelete}
      />
    </div>
  );
};
