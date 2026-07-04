# AI Cover Letter Generator - Technical Specification

## Project Overview

Build a personal web application that helps generate tailored cover letters from a resume and job description.

The application is initially intended for a single user running locally but should be designed so it can later be deployed as a SaaS-style web application with minimal architectural changes.

---

# Goals

The system should:

1. Allow a user to upload a resume (PDF or DOCX).
2. Extract and store the resume text.
3. Allow a user to paste a job description.
4. Generate a tailored cover letter using Google Gemini.
5. Store generated cover letters for future reference.
6. Allow regeneration of cover letters.
7. Support future expansion to:

   * Resume/job match scoring
   * Skill gap analysis
   * Resume improvement suggestions
   * Multi-user authentication

---

# Non-Goals (MVP)

Do NOT implement:

* User authentication
* Multi-user support
* Payments
* Team collaboration
* Resume AI parsing into structured fields
* Complex workflow engines

Store the resume as raw text.

---

# Recommended Technology Stack

## Frontend

* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS

## Backend

* Next.js API Routes
* Server Actions where appropriate

## AI Provider

Google Gemini API

Model:

* gemini-2.5-flash

Environment Variable:

```env
GEMINI_API_KEY=
```

## Database

Development:

* SQLite

Production:

* PostgreSQL

## ORM

Prisma

## File Processing

PDF:

* pdf-parse

DOCX:

* mammoth

---

# Application Architecture

```text
User Upload Resume
        |
        V
Document Extraction
        |
        V
Store Resume Text
        |
        V
Paste Job Description
        |
        V
Prompt Builder
        |
        V
Gemini API
        |
        V
Cover Letter
        |
        V
Store Result
```

---

# Database

## Development

* MySQL (Laragon)

## Production

Option A (recommended)

* MySQL

Option B

* PostgreSQL

The application should be designed using Prisma ORM so that switching database providers later requires minimal code changes.

---

# Local Database Configuration

Expected local environment:

```env
DATABASE_URL="mysql://root:@localhost:3306/cover_letter_generator"
```

Laragon defaults:

```text
Host: localhost
Port: 3306
Username: root
Password:
Database: cover_letter_generator
```

Create the database before running Prisma migrations:

```sql
CREATE DATABASE cover_letter_generator;
```

---

# ORM

Use Prisma.

Install:

```bash
npm install prisma @prisma/client
npx prisma init
```

Datasource configuration:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

---

# Database Schema

## Resume

Stores uploaded resume content.

```prisma
model Resume {
  id            String        @id @default(cuid())

  fileName      String

  content       LongText

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  applications  Application[]
}
```

---

## Application

Represents a generated cover letter tied to a job description.

```prisma
model Application {
  id              String      @id @default(cuid())

  companyName     String?

  jobTitle        String?

  jobDescription  LongText

  coverLetter     LongText

  resumeId        String

  resume          Resume      @relation(fields: [resumeId], references: [id])

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}
```

---

# MySQL Considerations

Because resumes and cover letters may become large, use MySQL TEXT/LONGTEXT storage.

Recommended Prisma mapping:

```prisma
model Resume {
  id        String   @id @default(cuid())

  fileName  String

  content   String   @db.LongText

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

```prisma
model Application {
  id              String   @id @default(cuid())

  companyName     String?

  jobTitle        String?

  jobDescription  String   @db.LongText

  coverLetter     String   @db.LongText

  resumeId        String

  resume          Resume   @relation(fields: [resumeId], references: [id])

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

# Initial Prisma Commands

Generate migration:

```bash
npx prisma migrate dev --name init
```

Generate client:

```bash
npx prisma generate
```

Open database viewer:

```bash
npx prisma studio
```

---

# Future Expansion

Potential future tables:

```text
Resume
Application
MatchAnalysis
ResumeSuggestion
User
```

For MVP only implement:

* Resume
* Application

```
```


---

# Folder Structure

```text
src/
|
├── app/
│   ├── page.tsx
│   ├── applications/
│   └── api/
│
├── components/
│   ├── ResumeUploader.tsx
│   ├── JobDescriptionForm.tsx
│   ├── CoverLetterViewer.tsx
│   └── ApplicationHistory.tsx
│
├── lib/
│   ├── prisma.ts
│   ├── gemini.ts
│   ├── resumeParser.ts
│   ├── promptBuilder.ts
│   └── validations.ts
│
├── types/
│
└── prisma/
    └── schema.prisma
```

---

# Resume Processing

## PDF Upload

Use:

```bash
npm install pdf-parse
```

Extract raw text.

Do not attempt AI parsing.

---

## DOCX Upload

Use:

```bash
npm install mammoth
```

Extract raw text.

Store extracted text directly.

---

# Prompt Engineering

The AI should receive:

1. Resume text
2. Job description

Prompt Template:

```text
You are an expert career coach and recruiter.

RESUME:

{{resume_text}}

JOB DESCRIPTION:

{{job_description}}

Instructions:

1. Write a professional cover letter.
2. Tailor the content to the job requirements.
3. Highlight relevant experience.
4. Do not invent qualifications.
5. Keep the tone professional.
6. Keep the length between 300 and 450 words.
7. Use specific examples from the resume whenever possible.

Output only the cover letter.
```

---

# API Endpoints

## POST /api/resume/upload

Purpose:

Upload resume and extract text.

Response:

```json
{
  "id": "resume_id",
  "content": "resume text"
}
```

---

## POST /api/cover-letter/generate

Request:

```json
{
  "resumeId": "resume_id",
  "jobDescription": "job description text"
}
```

Response:

```json
{
  "applicationId": "application_id",
  "coverLetter": "generated content"
}
```

---

## GET /api/applications

Returns application history.

Response:

```json
[
  {
    "id": "...",
    "companyName": "...",
    "jobTitle": "...",
    "createdAt": "..."
  }
]
```

---

# User Interface Requirements

## Main Layout

Two-column responsive layout.

Desktop:

```text
-----------------------------------------
| Inputs          | Generated Letter    |
-----------------------------------------
```

Mobile:

```text
Inputs
↓

Generated Letter
```

---

## Resume Section

Features:

* Upload PDF
* Upload DOCX
* Show upload status
* Show filename
* Allow replacing resume

---

## Job Description Section

Features:

* Large textarea
* Character counter
* Generate button

---

## Cover Letter Section

Features:

* Read-only editor
* Copy to clipboard button
* Regenerate button
* Save automatically

---

## Application History

Display:

* Date
* Job title
* Company
* View generated letter

---

# Future Enhancements

## Match Score

Prompt:

```text
Compare the resume and job description.

Return:

- Match Score (0-100)
- Strengths
- Missing Skills
- Recommendations
```

Store results in database.

---

## Resume Suggestions

Prompt:

```text
Review the resume.

Suggest improvements that would increase the match for this role.
```

---

## Multi-Resume Support

Allow multiple resumes:

* Software Engineering
* Product Management
* Consulting

User selects which resume to use.

---

# Performance Requirements

* Resume upload < 5 seconds
* Cover letter generation < 15 seconds
* Support files up to 10 MB
* Responsive UI
* Mobile-friendly

---

# Security Requirements

* Validate file types
* Validate file size
* Sanitize user input
* Never expose Gemini API key to frontend
* Execute Gemini requests only on the server

---

# MVP Definition

The MVP is complete when:

* User uploads resume.
* Resume text is extracted.
* User pastes job description.
* Gemini generates a cover letter.
* Cover letter is displayed.
* Cover letter is saved.
* Previous cover letters can be viewed.
