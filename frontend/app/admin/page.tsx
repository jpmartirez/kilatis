/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  createInvestigator,
  getMyInvestigators,
  resetInvestigatorPassword,
  deleteInvestigator,
  User,
} from "@/lib/api";
import { AdminHeader } from "@/components/admin/admin-header";
import { CreateInvestigatorCard } from "@/components/admin/create-investigator-card";
import { InvestigatorList } from "@/components/admin/investigator-list";
import { ResetPasswordModal } from "@/components/admin/reset-password-modal";
import { DeleteInvestigatorModal } from "@/components/admin/delete-investigator-modal";

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");
  const [investigators, setInvestigators] = useState<User[]>([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loadingList, setLoadingList] = useState(false);

  // Create form state
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Modals state
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);

  const loadInvestigators = useCallback(async (authToken: string) => {
    try {
      setLoadingList(true);
      const data = await getMyInvestigators(authToken);
      setInvestigators(data);
    } catch (err) {
      console.error("Error loading investigators:", err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken || !storedUser) {
      router.replace("/");
      return;
    }

    try {
      const userObj: User = JSON.parse(storedUser);
      if (userObj.role !== "admin") {
        router.replace("/main");
        return;
      }
      setCurrentUser(userObj);
      setToken(storedToken);
      loadInvestigators(storedToken);
      setIsCheckingAuth(false);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/");
    }
  }, [router, loadInvestigators]);

  const handleCreateInvestigator = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    setCreateLoading(true);

    try {
      const created = await createInvestigator(token, newUsername.trim(), newPassword.trim());
      setCreateSuccess(`Account for "${created.username}" created successfully.`);
      setNewUsername("");
      setNewPassword("");
      await loadInvestigators(token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create investigator account.";
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleConfirmResetPassword = async (newPass: string) => {
    if (!resetTargetUser) return;
    await resetInvestigatorPassword(token, resetTargetUser.id, newPass);
    setCreateSuccess(`Password for "${resetTargetUser.username}" was reset successfully.`);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetUser) return;
    await deleteInvestigator(token, deleteTargetUser.id);
    setCreateSuccess(`Investigator account "${deleteTargetUser.username}" was deleted.`);
    await loadInvestigators(token);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.replace("/");
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center font-sans text-slate-600">
        <div className="flex items-center gap-2.5 px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <Loader2 className="w-4 h-4 animate-spin text-slate-800" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Verifying Admin Access...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-6 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto space-y-6">
        <AdminHeader
          adminUsername={currentUser?.username || "ADMIN"}
          onLogout={handleLogout}
        />

        <CreateInvestigatorCard
          username={newUsername}
          setUsername={setNewUsername}
          password={newPassword}
          setPassword={setNewPassword}
          onSubmit={handleCreateInvestigator}
          loading={createLoading}
          error={createError}
          success={createSuccess}
        />

        <InvestigatorList
          investigators={investigators}
          loading={loadingList}
          onResetPassword={(u) => setResetTargetUser(u)}
          onDelete={(u) => setDeleteTargetUser(u)}
        />
      </div>

      <ResetPasswordModal
        user={resetTargetUser}
        isOpen={Boolean(resetTargetUser)}
        onClose={() => setResetTargetUser(null)}
        onConfirm={handleConfirmResetPassword}
      />

      <DeleteInvestigatorModal
        user={deleteTargetUser}
        isOpen={Boolean(deleteTargetUser)}
        onClose={() => setDeleteTargetUser(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
