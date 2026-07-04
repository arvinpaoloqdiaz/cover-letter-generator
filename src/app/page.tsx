"use client";

import React, { useState, useEffect } from "react";
import ResumeUploader from "@/components/ResumeUploader";
import JobDescriptionForm from "@/components/JobDescriptionForm";
import CoverLetterViewer from "@/components/CoverLetterViewer";
import ApplicationHistory from "@/components/ApplicationHistory";
import ResumeEditor from "@/components/ResumeEditor";
import { ResumeProfile } from "@/lib/resumeParser";
import { JobAnalysis } from "@/lib/gemini";

interface Application {
  id: string;
  companyName: string | null;
  jobTitle: string | null;
  coverLetter: string;
  jobDescription: string;
  resumeId: string;
  createdAt: string;
}

export default function Home() {
  // Resume state
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [resumeProfile, setResumeProfile] = useState<ResumeProfile | null>(null);

  // Resume Editor Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Job description & Analysis state
  const [jobDescription, setJobDescription] = useState("");
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);
  const [userRemarks, setUserRemarks] = useState("");

  // Fields filled in by user (missing required/optional info)
  const [userSuppliedFields, setUserSuppliedFields] = useState<Record<string, string>>({});
  const [blockingFields, setBlockingFields] = useState<string[]>([]);
  const [isBlockingModalOpen, setIsBlockingModalOpen] = useState(false);

  // Output cover letter state
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState<string | null>(null);

  // Application history state
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

  // Loading/Error states
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charLimit, setCharLimit] = useState<number | null>(null);

  // Fetch application history on load
  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch("/api/applications");
        if (response.ok) {
          const data = await response.json();
          setApplications(data);
        }
      } catch (err) {
        console.error("Failed to load application history:", err);
      }
    }
    fetchHistory();
  }, []);

  // Handle uploaded resume
  const handleResumeUploaded = (id: string, fileName: string, content: string) => {
    setResumeId(id);
    setResumeName(fileName);
    try {
      const parsed = JSON.parse(content) as ResumeProfile;
      setResumeProfile(parsed);
    } catch (err) {
      console.warn("Uploaded content is not structured JSON, creating mock empty profile.", err);
      setResumeProfile({
        name: "Uploaded Candidate",
        email: "",
        phone: "",
        location: "",
        summary: content.slice(0, 300),
        skills: [],
        experience: [],
        education: [],
        projects: [],
        certifications: [],
      });
    }
  };

  const handleClearResume = () => {
    setResumeId(null);
    setResumeName(null);
    setResumeProfile(null);
  };

  // Open Resume Editor for modification
  const handleEditProfile = () => {
    setIsEditorOpen(true);
  };

  // Create Resume Profile manually
  const handleManualCreate = () => {
    setResumeProfile(null); // Triggers empty profile creation in editor
    setIsEditorOpen(true);
  };

  // Save Resume Profile (updates DB)
  const handleSaveProfile = async (updatedProfile: ResumeProfile) => {
    try {
      const isNew = !resumeId;
      const response = await fetch("/api/resume/update", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isNew ? { profile: updatedProfile } : { id: resumeId, profile: updatedProfile }
        ),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save profile.");
      }

      setResumeId(data.id);
      setResumeName(data.fileName);
      setResumeProfile(updatedProfile);
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || "Failed to update profile details.");
    }
  };

  // Step 1: Analyze Job Description
  const handleAnalyzeJobDescription = async () => {
    if (!resumeId) {
      setError("Please upload or build a resume profile first.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please paste a job description.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setApiKeyMissing(false);
    setJobAnalysis(null);
    setUserSuppliedFields({});

    try {
      const response = await fetch("/api/cover-letter/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error && data.error.includes("JD_ANALYSIS_API_KEY")) {
          setApiKeyMissing(true);
        }
        throw new Error(data.error || "Failed to analyze job description.");
      }

      setJobAnalysis(data);

      // Check for required missing fields: specifically company_name and job_title
      const requiredMissing: string[] = [];
      if (!data.company_name && data.missing_fields?.includes("company_name")) {
        requiredMissing.push("company_name");
      }
      if (!data.job_title && data.missing_fields?.includes("job_title")) {
        requiredMissing.push("job_title");
      }

      if (requiredMissing.length > 0) {
        setBlockingFields(requiredMissing);
        setIsBlockingModalOpen(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze job description.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle saving fields from blocking modal
  const handleSaveBlockingFields = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate that all required fields are filled
    const allFilled = blockingFields.every(field => userSuppliedFields[field]?.trim());
    if (allFilled) {
      setIsBlockingModalOpen(false);
    } else {
      alert("Please fill in all required fields.");
    }
  };

  // Step 2: Generate Cover Letter
  const handleGenerateCoverLetter = async () => {
    if (!resumeId || !jobAnalysis) return;

    setGenerating(true);
    setError(null);
    setApiKeyMissing(false);

    try {
      const response = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId,
          jobAnalysis,
          userRemarks,
          userSuppliedMissingFields: userSuppliedFields,
          charLimit,
          jobDescription, // send raw text for history archiving
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error && data.error.includes("COVER_LETTER_API_KEY")) {
          setApiKeyMissing(true);
        }
        throw new Error(data.error || "Failed to generate cover letter.");
      }

      setCoverLetter(data.coverLetter);
      setCompanyName(data.companyName);
      setJobTitle(data.jobTitle);
      setSelectedApplicationId(data.applicationId);

      // Refresh history list
      const historyRes = await fetch("/api/applications");
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setApplications(historyData);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate cover letter.");
    } finally {
      setGenerating(false);
    }
  };

  const handleResetAnalysis = () => {
    setJobAnalysis(null);
    setUserSuppliedFields({});
  };

  const handleSelectApplication = (app: Application) => {
    setCoverLetter(app.coverLetter);
    setCompanyName(app.companyName);
    setJobTitle(app.jobTitle);
    setJobDescription(app.jobDescription);
    setSelectedApplicationId(app.id);
    setResumeId(app.resumeId);
    setResumeName("Linked Resume (Historical)");

    // Since we're viewing a historical letter, set it as already analyzed to show fields
    setJobAnalysis({
      job_title: app.jobTitle || "",
      company_name: app.companyName || "",
      location: "",
      employment_type: "",
      required_skills: [],
      preferred_skills: [],
      required_qualifications: [],
      preferred_qualifications: [],
      responsibilities: [],
      years_experience: "",
      keywords: [],
      missing_fields: [],
      optional_missing_fields: [],
      detected_context: [],
      generation_notes: [],
    });
  };

  const handleDeleteApplication = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this cover letter from history?")) {
      return;
    }

    try {
      const response = await fetch(`/api/applications?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setApplications((prev) => prev.filter((app) => app.id !== id));
        if (selectedApplicationId === id) {
          setCoverLetter(null);
          setCompanyName(null);
          setJobTitle(null);
          setSelectedApplicationId(null);
        }
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete application.");
      }
    } catch (err) {
      console.error("Delete application error:", err);
      alert("An error occurred while deleting the application.");
    }
  };

  const handleUserSuppliedFieldChange = (field: string, value: string) => {
    setUserSuppliedFields(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Subtle background blur textures */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-100/60 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-teal-100/40 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl shadow-md shadow-emerald-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800">
                Antigravity Cover Letter
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">
                AI-Powered Generator
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-500 font-medium">Single User Mode</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 flex flex-col md:grid md:grid-cols-12 gap-8 relative z-0">
        {/* Left Column: Inputs */}
        <section className="md:col-span-5 flex flex-col space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-base font-semibold text-slate-700 border-b border-slate-100 pb-3 flex items-center space-x-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Application Details</span>
            </h2>

            <ResumeUploader
              onResumeUploaded={handleResumeUploaded}
              currentResumeName={resumeName}
              onClearResume={handleClearResume}
              onEditProfile={handleEditProfile}
              onManualCreate={handleManualCreate}
            />

            <JobDescriptionForm
              jobDescription={jobDescription}
              onJobDescriptionChange={setJobDescription}
              charLimit={charLimit}
              onCharLimitChange={setCharLimit}
              userRemarks={userRemarks}
              onUserRemarksChange={setUserRemarks}
              isAnalyzed={jobAnalysis !== null}
              analyzing={analyzing}
              generating={generating}
              disabled={!resumeId}
              onAnalyze={handleAnalyzeJobDescription}
              onGenerate={handleGenerateCoverLetter}
              onResetAnalysis={handleResetAnalysis}
              optionalFields={jobAnalysis?.optional_missing_fields || []}
              userSuppliedFields={userSuppliedFields}
              onUserSuppliedFieldChange={handleUserSuppliedFieldChange}
            />

            {error && !apiKeyMissing && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-600 flex items-start space-x-2">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* History Panel */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <ApplicationHistory
              applications={applications}
              onSelectApplication={handleSelectApplication}
              selectedApplicationId={selectedApplicationId}
              onDeleteApplication={handleDeleteApplication}
            />
          </div>
        </section>

        {/* Right Column: Generated Letter */}
        <section className="md:col-span-7 flex flex-col min-h-[500px]">
          <CoverLetterViewer
            coverLetter={coverLetter}
            companyName={companyName}
            jobTitle={jobTitle}
            loading={generating}
            onRegenerate={handleGenerateCoverLetter}
            apiKeyMissing={apiKeyMissing}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/60 py-5 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 space-y-2 sm:space-y-0">
          <p>© {new Date().getFullYear()} Antigravity Cover Letter Generator.</p>
          <div className="flex space-x-4">
            <span className="font-mono">Models: Environment Separate</span>
            <span className="font-mono">DB: MySQL via Prisma</span>
          </div>
        </div>
      </footer>

      {/* Inline Resume Editor Drawer Modal */}
      <ResumeEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        initialProfile={resumeProfile}
        onSave={handleSaveProfile}
      />

      {/* Blocking Modal for Required Fields */}
      {isBlockingModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Required Information Missing</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                The job description analysis is missing some key details. Please fill them in to proceed.
              </p>
            </div>

            <form onSubmit={handleSaveBlockingFields} className="space-y-3">
              {blockingFields.map(field => (
                <div key={field} className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {field === "company_name" ? "Company Name *" : field === "job_title" ? "Job Title *" : field}
                  </label>
                  <input
                    type="text"
                    required
                    value={userSuppliedFields[field] || ""}
                    onChange={e => handleUserSuppliedFieldChange(field, e.target.value)}
                    placeholder={field === "company_name" ? "e.g. Google" : "e.g. Frontend Engineer"}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              ))}

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-emerald-650 hover:bg-emerald-600 transition-colors cursor-pointer"
                >
                  Save and Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
