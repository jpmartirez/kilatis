/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  createInvestigator,
  getMyInvestigators,
  resetInvestigatorPassword,
  deleteInvestigator,
  getMonthlyVerdictStats,
  User,
  MonthlyStatsResponse,
} from "@/lib/api";
import { AdminSidebar, AdminTab } from "@/components/admin/admin-sidebar";
import { DashboardTab } from "@/components/admin/dashboard-tab";
import { AccountCreationTab } from "@/components/admin/account-creation-tab";
import { ResetPasswordModal } from "@/components/admin/reset-password-modal";
import { DeleteInvestigatorModal } from "@/components/admin/delete-investigator-modal";
import { LogoutModal } from "@/components/admin/logout-modal";

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Investigators state
  const [investigators, setInvestigators] = useState<User[]>([]);
  const [loadingInvestigators, setLoadingInvestigators] = useState(false);

  // Monthly stats state
  const [statsData, setStatsData] = useState<MonthlyStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");

  // Create investigator form state
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
      setLoadingInvestigators(true);
      const data = await getMyInvestigators(authToken);
      setInvestigators(data);
    } catch (err) {
      console.error("Error loading investigators:", err);
    } finally {
      setLoadingInvestigators(false);
    }
  }, []);

  const loadMonthlyStats = useCallback(
    async (authToken: string, monthFilter?: string) => {
      try {
        setLoadingStats(true);
        const data = await getMonthlyVerdictStats(authToken, monthFilter);
        setStatsData(data);
      } catch (err) {
        console.error("Error loading monthly verdict stats:", err);
      } finally {
        setLoadingStats(false);
      }
    },
    []
  );

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
      loadMonthlyStats(storedToken, "ALL");
      setIsCheckingAuth(false);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/");
    }
  }, [router, loadInvestigators, loadMonthlyStats]);

  const handleSelectMonth = (month: string) => {
    setSelectedMonth(month);
    if (token) {
      loadMonthlyStats(token, month);
    }
  };

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
        <div className="px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-xs text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
          Verifying Admin Access...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-sans text-slate-900">
      {/* Sidebar (Desktop left fixed / Mobile top header) */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setCreateError(null);
          setCreateSuccess(null);
        }}
        adminUsername={currentUser?.username || "ADMIN"}
        onLogout={() => setIsLogoutModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full">
        {activeTab === "dashboard" ? (
          <DashboardTab
            statsData={statsData}
            loadingStats={loadingStats}
            selectedMonth={selectedMonth}
            onSelectMonth={handleSelectMonth}
            onRefreshStats={() => loadMonthlyStats(token, selectedMonth)}
            investigators={investigators}
            loadingInvestigators={loadingInvestigators}
            onNavigateToAccounts={() => setActiveTab("accounts")}
          />
        ) : (
          <AccountCreationTab
            username={newUsername}
            setUsername={setNewUsername}
            password={newPassword}
            setPassword={setNewPassword}
            onSubmit={handleCreateInvestigator}
            createLoading={createLoading}
            createError={createError}
            createSuccess={createSuccess}
            investigators={investigators}
            loadingList={loadingInvestigators}
            onResetPassword={(u) => setResetTargetUser(u)}
            onDelete={(u) => setDeleteTargetUser(u)}
          />
        )}
      </main>

      {/* Modals */}
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

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          handleLogout();
        }}
      />
    </div>
  );
}
