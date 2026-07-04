"use client";

import React from "react";

interface JobDescriptionFormProps {
  jobDescription: string;
  onJobDescriptionChange: (text: string) => void;
  charLimit: number | null;
  onCharLimitChange: (limit: number | null) => void;
  userRemarks: string;
  onUserRemarksChange: (text: string) => void;

  isAnalyzed: boolean;
  analyzing: boolean;
  generating: boolean;
  disabled: boolean;

  onAnalyze: () => void;
  onGenerate: () => void;
  onResetAnalysis: () => void;

  optionalFields: string[];
  userSuppliedFields: Record<string, string>;
  onUserSuppliedFieldChange: (field: string, value: string) => void;
}

export default function JobDescriptionForm({
  jobDescription,
  onJobDescriptionChange,
  charLimit,
  onCharLimitChange,
  userRemarks,
  onUserRemarksChange,
  isAnalyzed,
  analyzing,
  generating,
  disabled,
  onAnalyze,
  onGenerate,
  onResetAnalysis,
  optionalFields,
  userSuppliedFields,
  onUserSuppliedFieldChange,
}: JobDescriptionFormProps) {
  const charCount = jobDescription.length;

  const handleAnalyzeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobDescription.trim() && !analyzing && !disabled) {
      onAnalyze();
    }
  };

  const handleCharLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      onCharLimitChange(null);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onCharLimitChange(parsed);
    }
  };

  const getPlaceholderForField = (field: string) => {
    switch (field) {
      case "hiring_manager":
        return "e.g. John Doe (Hiring Manager)";
      case "team_name":
        return "e.g. Platform Engineering Team";
      case "department":
        return "e.g. Engineering, Marketing";
      case "salary_range":
        return "e.g. $120k - $140k";
      default:
        return `Enter ${field.replace("_", " ")}`;
    }
  };

  const getLabelForField = (field: string) => {
    return field
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="w-full">
      {!isAnalyzed ? (
        <form onSubmit={handleAnalyzeSubmit} className="flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <label htmlFor="jobDescription" className="text-sm font-semibold text-slate-700">
              Job Description
            </label>
            <span className={`text-xs ${charCount > 5000 ? "text-amber-600" : "text-slate-400"}`}>
              {charCount.toLocaleString()} chars
            </span>
          </div>

          <textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            placeholder="Paste the job description or role requirements here..."
            className="w-full min-h-[220px] max-h-[400px] p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm transition-all resize-y"
            disabled={analyzing}
          />

          {/* Character Limit Field */}
          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="charLimit" className="text-sm font-semibold text-slate-700 flex items-center space-x-1.5">
                <span>Output Character Limit</span>
                <span className="text-[10px] font-normal text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full">
                  optional
                </span>
              </label>
              {charLimit !== null && (
                <span className="text-xs text-emerald-650 font-medium">
                  ~{Math.round(charLimit / 5)} words
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="charLimit"
                type="number"
                min={100}
                max={10000}
                step={50}
                value={charLimit ?? ""}
                onChange={handleCharLimitChange}
                placeholder="e.g. 2000  (leave blank for default 300–450 words)"
                disabled={analyzing}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              {charLimit !== null && (
                <button
                  type="button"
                  onClick={() => onCharLimitChange(null)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                  title="Clear character limit"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={analyzing || disabled || !jobDescription.trim()}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              analyzing
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : disabled || !jobDescription.trim()
                ? "bg-slate-105 text-slate-400 border border-slate-200 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-550 active:scale-[0.98] text-white shadow-md border border-emerald-500/20"
            }`}
          >
            {analyzing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Analyzing Job Description...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Analyze Job Posting</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="flex flex-col space-y-4">
          {/* Analysis Header banner */}
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-emerald-650" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold text-emerald-800">Job Description Analyzed</span>
            </div>
            <button
              onClick={onResetAnalysis}
              className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
            >
              Change Job Description
            </button>
          </div>

          {/* Optional Fields inputs */}
          {optionalFields.length > 0 && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-655 flex items-center space-x-1.5">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Optional Recruitment Details</span>
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {optionalFields.map(field => (
                  <div key={field} className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-600">
                      {getLabelForField(field)}
                    </label>
                    <input
                      type="text"
                      value={userSuppliedFields[field] || ""}
                      onChange={e => onUserSuppliedFieldChange(field, e.target.value)}
                      placeholder={getPlaceholderForField(field)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                      disabled={generating}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Remarks System */}
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="userRemarks" className="text-sm font-semibold text-slate-700 flex items-center space-x-1.5">
              <span>Additional Notes for Cover Letter</span>
              <span className="text-[10px] font-normal text-slate-400 bg-slate-100 border border-slate-205 px-1.5 py-0.5 rounded-full">
                optional
              </span>
            </label>
            <textarea
              id="userRemarks"
              value={userRemarks}
              onChange={e => onUserRemarksChange(e.target.value)}
              placeholder="e.g. • Emphasize leadership experience&#10;• Focus on startup background&#10;• Mention AWS certifications&#10;• Use a more professional/formal tone"
              className="w-full min-h-[100px] p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs transition-all resize-y"
              disabled={generating}
            />
          </div>

          {/* Final Generate Button */}
          <button
            onClick={onGenerate}
            disabled={generating || disabled}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              generating
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : disabled
                ? "bg-slate-105 text-slate-400 border border-slate-205 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-550 active:scale-[0.98] text-white shadow-md border border-emerald-500/20"
            }`}
          >
            {generating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Generating Cover Letter...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <span>Generate Cover Letter</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
