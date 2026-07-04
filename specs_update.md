# Cover Letter Generation Pipeline Specification

## Overview

This specification defines the workflow for generating cover letters using:

* Parsed Resume Data (user-reviewed and stored)
* AI-assisted Job Description Analysis
* User-provided Remarks / Additional Context
* Missing Information Validation

The goal is to improve cover letter quality while minimizing unnecessary AI usage and keeping users in control of their data.

---

# Architecture

```text
Resume Upload
    ↓
Resume Parser
    ↓
Inline Resume Editor
    ↓
Save Resume Profile

Job Description Input
    ↓
JD Analysis (AI)
    ↓
Missing Information Validation
    ↓
Optional User Enhancements
    ↓
Cover Letter Generation
```

---

# Resume System

## Resume Parsing

The system should use a parser (not AI) to extract resume content.

Supported sources:

* PDF
* DOCX
* Manual Entry

## User Review

After parsing:

* Display extracted data in an inline editor.
* Allow users to edit all fields.
* Save finalized profile to database.

## Stored Resume Structure

Example:

```json
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "summary": "",
  "skills": [],
  "experience": [],
  "education": [],
  "projects": [],
  "certifications": []
}
```

The stored resume profile becomes the source of truth.

The system should not repeatedly re-parse resumes for every cover letter generation.

---

# Job Description Analysis

## Purpose

Analyze the job description and convert it into structured data.

This is not a summarization step.

The goal is to extract useful information for:

* Cover Letter Generation
* Validation
* ATS Matching
* User Review

---
# AI Model Separation Strategy

## Overview

The system will use separate AI API credentials for different stages of the workflow.

This separation is intended to:

* Isolate workloads.
* Prevent JD analysis requests from impacting cover letter generation requests.
* Improve quota management.
* Allow future use of different models per task.
* Support independent monitoring and rate limiting.

---

## Model Assignments

### Job Description Analysis Model

Purpose:

* Job description extraction
* Missing field detection
* Context detection
* Keyword extraction
* Generation note creation

Configuration:

```text
Service: Gemini 2.5
API Key: JD_ANALYSIS_API_KEY
```

Responsibilities:

* Convert raw job descriptions into structured JSON.
* Detect required missing information.
* Detect optional missing information.
* Generate contextual insights.
* Produce generation notes.

The output of this model should never generate the final cover letter.

Its sole responsibility is structured analysis.

---

### Cover Letter Generation Model

Purpose:

* Cover letter writing
* Tone adaptation
* Candidate-to-job alignment

Configuration:

```text
Service: Gemini 2.5
API Key: COVER_LETTER_API_KEY
```

Responsibilities:

* Generate the final cover letter.
* Use structured resume data.
* Use structured JD analysis data.
* Use user remarks.
* Use user-supplied missing fields.

This model should not receive the raw job description when structured analysis data is available.

---

## Data Flow

```text
Raw Job Description
        ↓
JD Analysis Model
(JD_ANALYSIS_API_KEY)
        ↓
Structured Job Analysis JSON
        ↓
Validation + User Input
        ↓
Cover Letter Generation Model
(COVER_LETTER_API_KEY)
        ↓
Final Cover Letter
```

---

## Future Flexibility

The architecture should allow independent model selection.

Examples:

```text
JD Analysis
    ↓
Gemini Flash
```

```text
Cover Letter Generation
    ↓
Gemini Pro
```

or

```text
JD Analysis
    ↓
Gemini
```

```text
Cover Letter Generation
    ↓
Alternative LLM Provider
```

The system should not assume both stages use the same provider or model.

Model configuration should be environment-driven.

Example:

```env
JD_ANALYSIS_API_KEY=
JD_ANALYSIS_MODEL=

COVER_LETTER_API_KEY=
COVER_LETTER_MODEL=
```

---

## Implementation Notes

* API keys must be stored server-side.
* API keys must never be exposed to the client.
* Each stage should have independent error handling.
* Failures in JD analysis should not consume cover letter generation requests.
* Logging and monitoring should identify which model handled each request.

Suggested request metadata:

```json
{
  "stage": "jd_analysis"
}
```

```json
{
  "stage": "cover_letter_generation"
}
```

This allows future analytics on usage, latency, failures, and quota consumption per workflow stage.

## AI Prompt Goal

The AI should:

* Extract structured job information.
* Detect missing important information.
* Detect contextual clues.
* Suggest additional information the user may want to provide.

---

## Output Schema

```json
{
  "job_title": "",
  "company_name": "",
  "location": "",
  "employment_type": "",

  "required_skills": [],
  "preferred_skills": [],

  "required_qualifications": [],
  "preferred_qualifications": [],

  "responsibilities": [],

  "years_experience": "",

  "keywords": [],

  "missing_fields": [],

  "optional_missing_fields": [],

  "detected_context": [],

  "generation_notes": []
}
```

---

# Missing Information Validation

## Required Missing Fields

These fields should trigger a blocking modal.

Examples:

* company_name
* job_title

If missing:

```json
{
  "missing_fields": [
    "company_name"
  ]
}
```

Show:

```text
Required Information Missing

Company Name *
```

The user must provide the value before proceeding.

---

# Optional Information Collection

The AI may identify useful but non-required information.

Examples:

* hiring_manager
* department
* team_name
* salary_range

Output:

```json
{
  "optional_missing_fields": [
    "hiring_manager",
    "team_name"
  ]
}
```

Display optional inputs.

These should never block generation.

---

# User Remarks System

## Purpose

Allow users to provide context not available in the resume or job description.

Examples:

* Emphasize leadership experience.
* Mention startup experience.
* Focus on React expertise.
* Highlight customer-facing work.
* Mention referral connection.
* Use a formal tone.

---

## UI

Add a multiline text area:

```text
Additional Notes for Cover Letter

[________________________________]

Examples:

• Emphasize leadership experience
• Focus on startup background
• Mention AWS certifications
• Use a more professional tone
```

---

## Storage

Remarks should be attached to the current generation request only.

Do not modify the saved resume profile.

---

# Context Detection

The AI should detect contextual clues from the JD.

Examples:

```json
{
  "detected_context": [
    "startup_environment",
    "cross_functional_collaboration",
    "customer_facing_role",
    "remote_first_company"
  ]
}
```

These should be passed to the cover letter generation prompt.

---

# Generation Notes

The AI may provide recommendations.

Example:

```json
{
  "generation_notes": [
    "Emphasize collaboration experience.",
    "Highlight React and TypeScript expertise.",
    "Mention experience working remotely."
  ]
}
```

These notes should be hidden from the user and used internally.

---

# Cover Letter Generation Inputs

The generator should receive:

```json
{
  "resume_profile": {},
  "job_analysis": {},
  "user_remarks": "",
  "user_supplied_missing_fields": {}
}
```

---

# Cover Letter Generation Requirements

The generator should:

* Use resume facts only.
* Never invent experience.
* Mention company name.
* Mention job title.
* Emphasize matching skills.
* Highlight relevant achievements.
* Consider detected context.
* Consider user remarks.
* Maintain professional tone.
* Avoid generic filler language.

---

# Future Enhancements

Potential future modules:

## ATS Match Score

Generate:

```json
{
  "overall_match_score": 85,
  "matching_skills": [],
  "missing_skills": []
}
```

---

## Resume Tailoring

Generate resume recommendations based on job requirements.

---

## Interview Preparation

Generate:

* Interview questions
* Talking points
* Skill gaps
* Research suggestions

Using the same structured resume and job analysis data.
