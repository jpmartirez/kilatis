"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
              Confirm Logout
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Administrative Session Termination
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

        <div className="bg-slate-50 border border-slate-200 text-slate-700 p-4 rounded-xl text-xs space-y-1">
          <p className="font-semibold text-slate-900">
            Are you sure you want to log out of the admin portal?
          </p>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Your active administrative session will be closed. You will need to re-authenticate to regain access to forensic statistics and account controls.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs font-bold uppercase tracking-wider h-10 px-4 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider h-10 px-5 cursor-pointer"
          >
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
};
