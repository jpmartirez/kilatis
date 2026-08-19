"use client";

import React from "react";

interface CaseDetailsSectionProps {
  caseNumber: string;
  setCaseNumber: (val: string) => void;
  caseTitle: string;
  setCaseTitle: (val: string) => void;
  investigatorName: string;
  setInvestigatorName: (val: string) => void;
  caseNotes: string;
  setCaseNotes: (val: string) => void;
}

export const CaseDetailsSection: React.FC<CaseDetailsSectionProps> = ({
  caseNumber,
  setCaseNumber,
  caseTitle,
  setCaseTitle,
  investigatorName,
  setInvestigatorName,
  caseNotes,
  setCaseNotes,
}) => {
  return (
    <section className="space-y-3">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2.5">
        <div className="flex items-center gap-2">
          {/* Numbered Step Circle */}
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-xs sm:text-xs text-slate-900 shrink-0">
            1
          </div>
          <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-wide uppercase">
            CASE DETAILS
          </h2>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
          Before uploading the evidence, please put the case information regarding the questioned image.
        </p>
      </div>

      {/* Card Body */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/80 space-y-4 sm:space-y-5">
        {/* Row 1: Case Number & Case Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Case Number */}
          <div>
            <label
              htmlFor="caseNumber"
              className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2"
            >
              CASE NUMBER{" "}
              <span className="text-[10px] text-red-500 font-bold ml-1 normal-case italic">
                *Required
              </span>
            </label>
            <input
              id="caseNumber"
              type="text"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="enter your case no. here e.g. KIL-1234-2026"
              className="w-full bg-[#edf2f7] hover:bg-[#e7eff6] focus:bg-white text-slate-900 placeholder:text-slate-400 placeholder:text-xs text-xs sm:text-sm font-medium rounded-full h-11 sm:h-12 px-5 border border-transparent focus:border-slate-300 focus:outline-none transition-all"
              required
            />
          </div>

          {/* Case Title */}
          <div>
            <label
              htmlFor="caseTitle"
              className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2"
            >
              CASE TITLE{" "}
              <span className="text-[10px] text-red-500 font-bold ml-1 normal-case italic">
                *Required
              </span>
            </label>
            <input
              id="caseTitle"
              type="text"
              value={caseTitle}
              onChange={(e) => setCaseTitle(e.target.value)}
              placeholder="enter your title here e.g. CYBER BULLYING DUPAY"
              className="w-full bg-[#edf2f7] hover:bg-[#e7eff6] focus:bg-white text-slate-900 placeholder:text-slate-400 placeholder:text-xs text-xs sm:text-sm font-medium rounded-full h-11 sm:h-12 px-5 border border-transparent focus:border-slate-300 focus:outline-none transition-all"
              required
            />
          </div>
        </div>

        {/* Row 2: Investigator Name */}
        <div>
          <label
            htmlFor="investigatorName"
            className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2"
          >
            INVESTIGATOR NAME{" "}
            <span className="text-[10px] text-red-500 font-bold ml-1 normal-case italic">
              *Required
            </span>
          </label>
          <input
            id="investigatorName"
            type="text"
            value={investigatorName}
            onChange={(e) => setInvestigatorName(e.target.value)}
            placeholder="PLT JOHN DOE"
            className="w-full bg-[#edf2f7] hover:bg-[#e7eff6] focus:bg-white text-slate-900 placeholder:text-slate-400 placeholder:text-xs text-xs sm:text-sm font-medium rounded-full h-11 sm:h-12 px-5 border border-transparent focus:border-slate-300 focus:outline-none transition-all"
            required
          />
        </div>

        {/* Row 3: Case Description / Notes */}
        <div>
          <label
            htmlFor="caseNotes"
            className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2"
          >
            CASE DESCRIPTION/NOTES{" "}
            <span className="text-[10px] text-red-500 font-bold ml-1 normal-case italic">
              *Required
            </span>
          </label>
          <textarea
            id="caseNotes"
            rows={4}
            value={caseNotes}
            onChange={(e) => setCaseNotes(e.target.value)}
            placeholder="enter your notes here e.g. student screenshot of images delivered a questioned image that may be AI generated."
            className="w-full bg-[#edf2f7] hover:bg-[#e7eff6] focus:bg-white text-slate-900 placeholder:text-slate-400 placeholder:text-xs text-xs sm:text-sm font-medium rounded-2xl p-4 sm:p-5 border border-transparent focus:border-slate-300 focus:outline-none transition-all resize-none leading-relaxed"
            required
          />
        </div>
      </div>
    </section>
  );
};
