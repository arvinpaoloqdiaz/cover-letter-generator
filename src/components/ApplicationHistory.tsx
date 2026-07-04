"use client";

import React from "react";

interface Application {
  id: string;
  companyName: string | null;
  jobTitle: string | null;
  coverLetter: string;
  jobDescription: string;
  resumeId: string;
  createdAt: string;
}

interface ApplicationHistoryProps {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  selectedApplicationId: string | null;
  onDeleteApplication: (id: string, e: React.MouseEvent) => void;
}

export default function ApplicationHistory({
  applications,
  onSelectApplication,
  selectedApplicationId,
  onDeleteApplication,
}: ApplicationHistoryProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Date unknown";
    }
  };

  return (
    <div className="w-full flex flex-col space-y-2">
      <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center justify-between">
        <span>History</span>
        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-normal border border-slate-200">
          {applications.length} letters
        </span>
      </h3>

      {applications.length === 0 ? (
        <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
          No previous generations. Your history will appear here.
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1">
          {applications.map((app) => {
            const isSelected = app.id === selectedApplicationId;
            return (
              <div
                key={app.id}
                onClick={() => onSelectApplication(app)}
                className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50 border-emerald-200 shadow-sm shadow-emerald-100"
                    : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex flex-col min-w-0 mr-3">
                  <span className={`text-xs font-semibold truncate ${isSelected ? "text-emerald-700" : "text-slate-700"}`}>
                    {app.jobTitle || "Position Unknown"}
                  </span>
                  <span className="text-xs text-slate-500 truncate mt-0.5">
                    {app.companyName || "Company Unknown"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {formatDate(app.createdAt)}
                  </span>
                </div>

                <button
                  onClick={(e) => onDeleteApplication(app.id, e)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-all duration-200 cursor-pointer shrink-0"
                  title="Delete from history"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
