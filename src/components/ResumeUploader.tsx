"use client";

import React, { useState, useRef } from "react";

interface ResumeUploaderProps {
  onResumeUploaded: (id: string, fileName: string, content: string) => void;
  currentResumeName: string | null;
  onClearResume: () => void;
  onEditProfile: () => void;
  onManualCreate: () => void;
}

export default function ResumeUploader({
  onResumeUploaded,
  currentResumeName,
  onClearResume,
  onEditProfile,
  onManualCreate,
}: ResumeUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload and parse resume.");
      }

      onResumeUploaded(data.id, data.fileName, data.content);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-slate-700">Resume Upload</h3>
      </div>

      {currentResumeName ? (
        <div className="flex flex-col space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200 transition-all duration-300">
          <div className="flex items-center justify-between overflow-hidden">
            <div className="flex items-center space-x-3 overflow-hidden">
              {/* File Icon */}
              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-slate-800 truncate">{currentResumeName}</p>
                <p className="text-xs text-emerald-650 font-semibold animate-pulse">Structured Profile Ready</p>
              </div>
            </div>
            <button
              onClick={onClearResume}
              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors duration-200 cursor-pointer"
              title="Remove resume"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={onEditProfile}
              className="inline-flex items-center text-xs font-bold text-emerald-650 hover:text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-250 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Profile Details</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            className={`relative group flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
              dragActive
                ? "border-emerald-500 bg-emerald-50/50"
                : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={handleChange}
              disabled={loading}
            />

            {loading ? (
              <div className="flex flex-col items-center py-4">
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-medium text-slate-750">Parsing document...</p>
                <p className="text-xs text-slate-450 mt-1">Extracting structured fields</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-slate-100 rounded-xl mb-3 text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-all duration-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600">
                  <span className="text-emerald-600 font-bold">Click to upload</span> or drag & drop
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF, DOCX, or TXT (Max 10MB)</p>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onManualCreate}
              className="text-xs font-semibold text-emerald-650 hover:text-emerald-800 underline underline-offset-4 cursor-pointer"
            >
              Or, build a resume profile manually
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 flex items-start space-x-2">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
