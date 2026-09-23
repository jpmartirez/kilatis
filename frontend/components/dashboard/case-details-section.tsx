import React from "react";
import { RefreshCw } from "lucide-react";

interface CaseDetailsSectionProps {
  caseNumber: string;
  setCaseNumber: (val: string) => void;
  caseTitle: string;
  setCaseTitle: (val: string) => void;
  caseDate?: string;
  setCaseDate?: (val: string) => void;
  caseTime?: string;
  setCaseTime?: (val: string) => void;
  caseLocation?: string;
  setCaseLocation?: (val: string) => void;
  investigatorName: string;
  setInvestigatorName: (val: string) => void;
  caseNotes: string;
  setCaseNotes: (val: string) => void;
  isGeneratingCaseNumber?: boolean;
  onRegenerateCaseNumber?: () => void;
}

export const CaseDetailsSection: React.FC<CaseDetailsSectionProps> = ({
  caseNumber,
  setCaseNumber,
  caseTitle,
  setCaseTitle,
  caseDate = "",
  setCaseDate,
  caseTime = "",
  setCaseTime,
  caseLocation = "",
  setCaseLocation,
  investigatorName,
  setInvestigatorName,
  caseNotes,
  setCaseNotes,
  isGeneratingCaseNumber = false,
  onRegenerateCaseNumber,
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
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="caseNumber"
                className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider"
              >
                <span>CASE NUMBER</span>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Automated
                </span>
              </label>

              {onRegenerateCaseNumber && (
                <button
                  type="button"
                  onClick={onRegenerateCaseNumber}
                  disabled={isGeneratingCaseNumber}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                  title="Generate new sequential case number"
                >
                  <RefreshCw className={`w-3 h-3 ${isGeneratingCaseNumber ? "animate-spin" : ""}`} />
                  <span>{isGeneratingCaseNumber ? "Generating..." : "New Number"}</span>
                </button>
              )}
            </div>

            <input
              id="caseNumber"
              type="text"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="Generating automated case number..."
              className="w-full bg-[#edf2f7] hover:bg-[#e7eff6] focus:bg-white text-slate-900 placeholder:text-slate-400 placeholder:text-xs text-xs sm:text-sm font-semibold tracking-wide rounded-full h-11 sm:h-12 px-5 border border-transparent focus:border-slate-300 focus:outline-none transition-all"
              required
            />
            <p className="text-[10px] text-slate-400 mt-1 pl-2">
              Auto-generated based on sequential KILATIS docket records (editable if needed).
            </p>
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

        {/* Row 2: Incident Date, Time & Location (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Incident Date */}
          <div>
            <label
              htmlFor="caseDate"
              className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2"
            >
              DATE OF INCIDENT{" "}
              <span className="text-[10px] text-slate-400 font-bold ml-1 normal-case italic">
                (Optional)
              </span>
            </label>
            <input
              id="caseDate"
              type="date"
              value={caseDate}
              onChange={(e) => setCaseDate?.(e.target.value)}
              className="w-full bg-[#edf2f7] hover:bg-[#e7eff6] focus:bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium rounded-full h-11 sm:h-12 px-5 border border-transparent focus:border-slate-300 focus:outline-none transition-all"
            />
          </div>

          {/* Incident Time */}
          <div>
            <label
              htmlFor="caseTime"
              className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2"
            >
              TIME OF INCIDENT{" "}
              <span className="text-[10px] text-slate-400 font-bold ml-1 normal-case italic">
                (Optional)
              </span>
            </label>
            <input
              id="caseTime"
              type="time"
              value={caseTime}
              onChange={(e) => setCaseTime?.(e.target.value)}
              className="w-full bg-[#edf2f7] hover:bg-[#e7eff6] focus:bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium rounded-full h-11 sm:h-12 px-5 border border-transparent focus:border-slate-300 focus:outline-none transition-all"
            />
          </div>

          {/* Incident Location */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label
              htmlFor="caseLocation"
              className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2"
            >
              WHERE IT HAPPENED{" "}
              <span className="text-[10px] text-slate-400 font-bold ml-1 normal-case italic">
                (Optional)
              </span>
            </label>
            <input
              id="caseLocation"
              type="text"
              value={caseLocation}
              onChange={(e) => setCaseLocation?.(e.target.value)}
              placeholder="e.g. Quezon City, Metro Manila"
              className="w-full bg-[#edf2f7] hover:bg-[#e7eff6] focus:bg-white text-slate-900 placeholder:text-slate-400 placeholder:text-xs text-xs sm:text-sm font-medium rounded-full h-11 sm:h-12 px-5 border border-transparent focus:border-slate-300 focus:outline-none transition-all"
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
