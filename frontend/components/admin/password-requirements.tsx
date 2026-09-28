"use client";

import React from "react";

export interface PasswordValidation {
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isValid: boolean;
}

export function checkPasswordStrength(password: string): PasswordValidation {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);

  return {
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    isValid: hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial,
  };
}

interface PasswordRequirementsListProps {
  validation: PasswordValidation;
}

export const PasswordRequirementsList: React.FC<PasswordRequirementsListProps> = ({
  validation,
}) => {
  const requirements = [
    { id: "length", label: "Minimum of 8 characters", met: validation.hasMinLength },
    { id: "upper", label: "At least one uppercase letter (A-Z)", met: validation.hasUpper },
    { id: "lower", label: "At least one lowercase letter (a-z)", met: validation.hasLower },
    { id: "number", label: "At least one number (0-9)", met: validation.hasNumber },
    { id: "special", label: "At least one special character (!@#$%...)", met: validation.hasSpecial },
  ];

  return (
    <div className="space-y-1.5 pt-0.5">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        Password requirements:
      </div>

      <ul className="space-y-1 text-xs">
        {requirements.map((req) => (
          <li
            key={req.id}
            className={`transition-all select-none ${
              req.met
                ? "line-through text-slate-400 decoration-slate-400"
                : "text-slate-500"
            }`}
          >
            • {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
};