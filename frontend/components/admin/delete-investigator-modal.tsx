"use client";

import React, { useState } from "react";
import { User } from "@/lib/api";
import { Trash2, X, Loader2, AlertTriangle } from "lucide-react";

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
    <div className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-[1.5px] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-50 rounded-full text-red-600">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide">
                Delete Account
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {user.username}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#243346]/5 border border-[#243346]/15 text-[#243346] p-3.5 rounded-2xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[#243346]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#243346] shrink-0" />
            <span>Permanent Action Notice</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Are you sure you want to permanently delete the investigator account for <strong className="font-bold text-slate-900">{user.username}</strong> (ID: <span className="font-mono text-[10px]">{user.id}</span>)? This action cannot be undone.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-full transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
