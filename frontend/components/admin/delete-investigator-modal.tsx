"use client";

import React, { useState } from "react";
import { User } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface DeleteInvestigatorModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteInvestigatorModal: React.FC<DeleteInvestigatorModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleDelete = async () => {
    setError(null);
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete investigator";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
              Delete Investigator Account
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Username: {user.username}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-800 px-2 py-1 rounded-md cursor-pointer uppercase font-mono"
          >
            [Close]
          </button>
        </div>

        <div className="bg-red-50/70 border border-red-200 text-red-900 p-3.5 rounded-xl text-xs space-y-1">
          <div className="font-bold uppercase tracking-wider text-[11px] text-red-800">
            Irreversible Action
          </div>
          <p className="text-slate-700 text-xs leading-relaxed">
            Are you sure you want to permanently delete the investigator account for{" "}
            <strong className="font-bold text-slate-950">{user.username}</strong>{" "}
            (Account ID: <span className="font-mono text-[11px]">{user.id}</span>)?
            This will permanently revoke all access.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="text-xs font-bold uppercase tracking-wider h-10 px-4 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider h-10 px-5 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Confirm Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
};
