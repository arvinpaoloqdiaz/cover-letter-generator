"use client";

import React, { useState } from "react";

interface CoverLetterViewerProps {
  coverLetter: string | null;
  companyName: string | null;
  jobTitle: string | null;
  loading: boolean;
  onRegenerate: () => void;
  apiKeyMissing?: boolean;
}

export default function CoverLetterViewer({
  coverLetter,
  companyName,
  jobTitle,
  loading,
  onRegenerate,
  apiKeyMissing = false,
}: CoverLetterViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!coverLetter) return;
    try {
      await navigator.clipboard.writeText(coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col p-6 rounded-xl bg-white border border-slate-200 min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded w-48 animate-pulse"></div>
            <div className="h-3 bg-slate-100 rounded w-32 animate-pulse"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-9 bg-slate-100 rounded w-20 animate-pulse"></div>
            <div className="h-9 bg-slate-100 rounded w-24 animate-pulse"></div>
          </div>
        </div>

        <div className="flex-1 space-y-4 py-2">
          <div className="h-3 bg-slate-100 rounded w-full animate-pulse"></div>
          <div className="h-3 bg-slate-100 rounded w-5/6 animate-pulse"></div>
          <div className="h-3 bg-slate-100 rounded w-4/5 animate-pulse"></div>
          <div className="h-3 bg-slate-100 rounded w-full animate-pulse"></div>
          <div className="h-3 bg-slate-100 rounded w-11/12 animate-pulse"></div>
          <div className="h-3 bg-slate-100 rounded w-full animate-pulse"></div>
          <div className="h-3 bg-slate-100 rounded w-3/4 animate-pulse"></div>
          <div className="h-3 bg-slate-100 rounded w-full animate-pulse"></div>
          <div className="h-3 bg-slate-100 rounded w-5/6 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (apiKeyMissing) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 rounded-xl bg-rose-50/30 border border-rose-100 text-center min-h-[400px]">
        <div className="p-4 bg-rose-100 rounded-full text-rose-600 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-8v6m0 5h.01M4.93 19h14.14a2 2 0 001.73-3L13.73 4a2 2 0 00-3.46 0L3.2 16a2 2 0 001.73 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Gemini API Key Missing</h3>
        <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
          It looks like your <code className="text-rose-700 bg-rose-100/60 px-1.5 py-0.5 rounded font-mono text-xs">GEMINI_API_KEY</code> is not configured.
          Please open the <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">.env</code> file in the project root and enter your API key to enable generation.
        </p>
        <div className="p-3 bg-slate-50 rounded-lg text-left text-xs font-mono text-slate-500 border border-slate-200 max-w-sm w-full">
          GEMINI_API_KEY=your_api_key_here
        </div>
      </div>
    );
  }

  if (!coverLetter) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 rounded-xl bg-slate-50/50 border border-slate-200 border-dashed text-center min-h-[400px]">
        <div className="p-3 bg-slate-100 rounded-xl text-slate-405 mb-3">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-slate-705 mb-1">No Cover Letter Generated</h3>
        <p className="text-xs text-slate-450 max-w-xs leading-relaxed">
          Upload your resume and paste a job description on the left to generate your tailored cover letter.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            {jobTitle !== "Position Unknown" ? jobTitle : "Tailored Cover Letter"}
          </h3>
          <p className="text-xs text-slate-500">
            {companyName !== "Company Unknown" ? `for ${companyName}` : "AI Generated"}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              copied
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-slate-50 hover:bg-slate-100 text-slate-750 border border-slate-200"
            }`}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={onRegenerate}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 hover:border-emerald-250 transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
            </svg>
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-6 overflow-y-auto max-h-[500px] text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-wrap select-text">
        {coverLetter}
      </div>
    </div>
  );
}
