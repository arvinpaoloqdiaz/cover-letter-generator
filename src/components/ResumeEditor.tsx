"use client";

import React, { useState, useEffect } from "react";
import { ResumeProfile, Experience, Education, Project } from "@/lib/resumeParser";

interface ResumeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile: ResumeProfile | null;
  onSave: (updatedProfile: ResumeProfile) => Promise<void>;
}

const emptyProfile = (): ResumeProfile => ({
  name: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
});

export default function ResumeEditor({ isOpen, onClose, initialProfile, onSave }: ResumeEditorProps) {
  const [profile, setProfile] = useState<ResumeProfile>(emptyProfile());
  const [activeTab, setActiveTab] = useState<"basic" | "experience" | "education" | "projects" | "skills">("basic");
  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
    } else {
      setProfile(emptyProfile());
    }
  }, [initialProfile, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof ResumeProfile, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Skills
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      handleInputChange("skills", [...profile.skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (indexToRemove: number) => {
    handleInputChange(
      "skills",
      profile.skills.filter((_, idx) => idx !== indexToRemove)
    );
  };

  // Certifications
  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCert.trim() && !profile.certifications.includes(newCert.trim())) {
      handleInputChange("certifications", [...profile.certifications, newCert.trim()]);
      setNewCert("");
    }
  };

  const handleRemoveCert = (indexToRemove: number) => {
    handleInputChange(
      "certifications",
      profile.certifications.filter((_, idx) => idx !== indexToRemove)
    );
  };

  // Experience Items
  const handleExperienceChange = (index: number, key: keyof Experience, value: string) => {
    const updated = [...profile.experience];
    updated[index] = { ...updated[index], [key]: value };
    handleInputChange("experience", updated);
  };

  const handleAddExperience = () => {
    handleInputChange("experience", [
      ...profile.experience,
      { company: "", role: "", duration: "", description: "" },
    ]);
  };

  const handleRemoveExperience = (index: number) => {
    handleInputChange(
      "experience",
      profile.experience.filter((_, idx) => idx !== index)
    );
  };

  // Education Items
  const handleEducationChange = (index: number, key: keyof Education, value: string) => {
    const updated = [...profile.education];
    updated[index] = { ...updated[index], [key]: value };
    handleInputChange("education", updated);
  };

  const handleAddEducation = () => {
    handleInputChange("education", [
      ...profile.education,
      { institution: "", degree: "", duration: "" },
    ]);
  };

  const handleRemoveEducation = (index: number) => {
    handleInputChange(
      "education",
      profile.education.filter((_, idx) => idx !== index)
    );
  };

  // Projects Items
  const handleProjectChange = (index: number, key: keyof Project, value: string) => {
    const updated = [...profile.projects];
    updated[index] = { ...updated[index], [key]: value };
    handleInputChange("projects", updated);
  };

  const handleAddProject = () => {
    handleInputChange("projects", [
      ...profile.projects,
      { name: "", description: "" },
    ]);
  };

  const handleRemoveProject = (index: number) => {
    handleInputChange(
      "projects",
      profile.projects.filter((_, idx) => idx !== index)
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(profile);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save profile. Please check validation errors.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-800">Inline Resume Editor</h2>
            <p className="text-xs text-slate-400">Structured Profile is used to tailor Cover Letters</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-100 bg-white overflow-x-auto scrollbar-thin">
          {[
            { id: "basic", label: "Basic Info & Summary" },
            { id: "skills", label: "Skills & Certs" },
            { id: "experience", label: "Work Experience" },
            { id: "education", label: "Education" },
            { id: "projects", label: "Projects" },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
                activeTab === tab.id
                  ? "border-emerald-600 text-emerald-600 bg-emerald-50/20"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-600 flex items-start space-x-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {activeTab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={e => handleInputChange("name", e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={e => handleInputChange("email", e.target.value)}
                    placeholder="e.g. jane.doe@example.com"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600">Phone Number</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={e => handleInputChange("phone", e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600">Location</label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={e => handleInputChange("location", e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-slate-600">Professional Summary</label>
                <textarea
                  value={profile.summary}
                  onChange={e => handleInputChange("summary", e.target.value)}
                  placeholder="Summarize your professional background..."
                  className="w-full min-h-[120px] p-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {activeTab === "skills" && (
            <div className="space-y-6">
              {/* Skills Tags */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Skills & Core Competencies</label>
                <form onSubmit={handleAddSkill} className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    placeholder="e.g. Next.js"
                    className="flex-1 px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 cursor-pointer"
                  >
                    Add
                  </button>
                </form>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {profile.skills.length === 0 ? (
                    <span className="text-xs text-slate-400">No skills added yet.</span>
                  ) : (
                    profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-700"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                          className="ml-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Certifications Tags */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="text-xs font-bold text-slate-600">Certifications & Licenses</label>
                <form onSubmit={handleAddCert} className="flex gap-2">
                  <input
                    type="text"
                    value={newCert}
                    onChange={e => setNewCert(e.target.value)}
                    placeholder="e.g. AWS Solutions Architect"
                    className="flex-1 px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 cursor-pointer"
                  >
                    Add
                  </button>
                </form>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {profile.certifications.length === 0 ? (
                    <span className="text-xs text-slate-400">No certifications added yet.</span>
                  ) : (
                    profile.certifications.map((cert, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-xs font-medium text-emerald-800"
                      >
                        {cert}
                        <button
                          type="button"
                          onClick={() => handleRemoveCert(index)}
                          className="ml-1.5 text-emerald-650 hover:text-emerald-900 cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "experience" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-600">Work Experience</label>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100"
                >
                  + Add Experience
                </button>
              </div>

              {profile.experience.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                  No work experience entries yet. Add one to help target your letter.
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.experience.map((exp, index) => (
                    <div key={index} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 relative space-y-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(index)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-rose-600 cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors"
                        title="Delete position"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex flex-col space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Company Name</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={e => handleExperienceChange(index, "company", e.target.value)}
                            placeholder="e.g. Acme Corp"
                            className="px-3 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Job Title / Role</label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={e => handleExperienceChange(index, "role", e.target.value)}
                            placeholder="e.g. Software Engineer"
                            className="px-3 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Duration</label>
                          <input
                            type="text"
                            value={exp.duration}
                            onChange={e => handleExperienceChange(index, "duration", e.target.value)}
                            placeholder="e.g. 2021 - Present"
                            className="px-3 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Key Achievements / Description</label>
                        <textarea
                          value={exp.description}
                          onChange={e => handleExperienceChange(index, "description", e.target.value)}
                          placeholder="Describe your role, responsibilities, and achievements..."
                          className="p-3 rounded border border-slate-200 text-xs min-h-[80px] focus:outline-none focus:border-emerald-500 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "education" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-600">Education Details</label>
                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100"
                >
                  + Add Education
                </button>
              </div>

              {profile.education.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                  No education entries yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.education.map((edu, index) => (
                    <div key={index} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 relative grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveEducation(index)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-rose-600 cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors"
                        title="Delete education"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Institution / University</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={e => handleEducationChange(index, "institution", e.target.value)}
                          placeholder="e.g. Stanford University"
                          className="px-3 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Degree / Study Field</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={e => handleEducationChange(index, "degree", e.target.value)}
                          placeholder="e.g. B.S. Computer Science"
                          className="px-3 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Graduation Year / Period</label>
                        <input
                          type="text"
                          value={edu.duration}
                          onChange={e => handleEducationChange(index, "duration", e.target.value)}
                          placeholder="e.g. 2017 - 2021"
                          className="px-3 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-600">Projects</label>
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100"
                >
                  + Add Project
                </button>
              </div>

              {profile.projects.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                  No projects entries yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.projects.map((proj, index) => (
                    <div key={index} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 relative space-y-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveProject(index)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-rose-600 cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors"
                        title="Delete project"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Project Name</label>
                        <input
                          type="text"
                          value={proj.name}
                          onChange={e => handleProjectChange(index, "name", e.target.value)}
                          placeholder="e.g. E-Commerce Platform"
                          className="px-3 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Project Description</label>
                        <textarea
                          value={proj.description}
                          onChange={e => handleProjectChange(index, "description", e.target.value)}
                          placeholder="Describe the technologies used, your role, and what you built..."
                          className="p-3 rounded border border-slate-200 text-xs min-h-[80px] focus:outline-none focus:border-emerald-500 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 transition-all cursor-pointer"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFormSubmit}
            disabled={saving || !profile.name.trim()}
            className={`px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center space-x-1.5 text-white transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-500 ${
              saving || !profile.name.trim() ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving Profile...</span>
              </>
            ) : (
              <span>Save Resume Profile</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
