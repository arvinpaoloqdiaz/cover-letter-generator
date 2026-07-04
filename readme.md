# Antigravity Cover Letter Generator

> AI-powered cover letter generation pipeline tailored to your resume profile and job description, built with Next.js and Google Gemini.

---

## Features

- 📄 **Structured Resume System** — Upload a resume (PDF, DOCX, TXT) or create one from scratch. Text is automatically parsed into a structured candidate profile.
- ✏️ **Inline Resume Editor** — A premium inline editor allowing you to review, edit, and save all fields of your structured resume profile (Basic Info, Summary, Skills, Work Experience, Education, Projects, and Certifications).
- 🔍 **Job Description Analysis (Stage 1)** — Extracts required and preferred skills, qualifications, responsibilities, years of experience, keywords, contextual clues, and structure recommendations from any job posting.
- ⚠️ **Missing Information Validation** — Detects missing required fields (e.g. Company Name, Job Title) and blocks generation using a modal prompt, ensuring high-quality outputs.
- 💡 **Optional Fields & User Remarks** — Collects additional recruitment details (e.g. Hiring Manager, Team, Department) and incorporates custom user remarks ("Additional Notes") to shape tone and focus.
- 🔢 **Output Character Limit** *(optional)* — Set a target character count for the generated letter. The AI will aim to stay within the limit.
- 🤖 **Two-Stage Model Isolation** — Uses separate models and credentials for JD Analysis and Cover Letter Generation to balance quotas and optimize performance.
- 🗂️ **Application History** — Saved cover letters are stored securely and accessible from the history log.

---

## Technology Stack

| Layer        | Technology                                    |
|--------------|-----------------------------------------------|
| Framework    | [Next.js 16](https://nextjs.org/) (App Router) |
| Language     | TypeScript                                    |
| Styling      | Tailwind CSS v4                               |
| AI Provider  | Google Gemini 2.5 (`@google/genai`)           |
| ORM          | Prisma 7 (`@prisma/adapter-mariadb`)          |
| Database     | MySQL (local) / PostgreSQL (production)       |
| File Parsing | `@cedrugs/pdf-parse`, `mammoth`               |

---

## Prerequisites

- **Node.js** v18+
- **npm** v9+
- A running **MySQL** instance (e.g., [Laragon](https://laragon.org/) on Windows)
- **Google Gemini API Credentials** — get yours at [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## Environment Variables

The system enforces strict credentials separation for different pipeline stages. Fill in these keys in your `.env` file:

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | - | MySQL or PostgreSQL connection string |
| `JD_ANALYSIS_API_KEY` | ✅ | - | Gemini API key specifically for Job Description Analysis |
| `JD_ANALYSIS_MODEL` | ❌ | `gemini-2.5-flash` | Gemini model to use for job description analysis |
| `COVER_LETTER_API_KEY` | ✅ | - | Gemini API key specifically for Cover Letter Generation |
| `COVER_LETTER_MODEL` | ❌ | `gemini-2.5-flash` | Gemini model to use for cover letter generation |

> [!WARNING]
> Both `JD_ANALYSIS_API_KEY` and `COVER_LETTER_API_KEY` must be set. The system will throw a warning error if either is missing, preventing generation fallback.

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd cover-letter
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the MySQL database

Using your MySQL client or Laragon's phpMyAdmin / HeidiSQL:

```sql
CREATE DATABASE cover_letter_generator;
```

### 4. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="mysql://root:@localhost:3306/cover_letter_generator"
JD_ANALYSIS_API_KEY="your_api_key_here"
JD_ANALYSIS_MODEL="gemini-2.5-flash"
COVER_LETTER_API_KEY="your_api_key_here"
COVER_LETTER_MODEL="gemini-2.5-flash"
```

### 5. Run database migrations

```bash
npx prisma migrate dev --name init
```

This will create the `Resume` and `Application` tables in your MySQL database.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Pipeline Workflow Guide

### Stage 1: Resume Profile Entry
1. **Upload or Create** — Upload a resume (PDF, DOCX, TXT) or click **"build a resume profile manually"**.
2. **Review & Edit** — A rule-based parser pre-populates your profile fields. Click **"Edit Profile Details"** to refine your Summary, Skills, Work Experience, Education, Projects, and Certifications.
3. **Save** — Finalized data is stored as a structured JSON object in the database (this is the single source of truth).

### Stage 2: Job Analysis
1. **Paste Job Description** — Paste the job post into the input area.
2. **Analyze** — Click **"Analyze Job Posting"**. The system executes Call 1 using `JD_ANALYSIS_API_KEY`.
3. **Required Validation** — If key fields are missing (e.g. `company_name`, `job_title`), a blocking modal prompts you to enter them.
4. **Optional Inputs** — Optional fields detected (e.g. `hiring_manager`, `team_name`) are shown as text boxes inline.

### Stage 3: Cover Letter Generation
1. **Remarks** — Provide any specific notes, directives, or tone modifiers in **"Additional Notes for Cover Letter"**.
2. **Generate** — Click **"Generate Cover Letter"**. The system executes Call 2 using `COVER_LETTER_API_KEY` and constructs the letter using ONLY the candidate facts.
3. **Review & Save** — Copy the output to your clipboard, modify inputs to regenerate, or browse past letters in the application history.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                        # Main dashboard page
│   └── api/
│       ├── resume/upload/route.ts      # POST: Upload & parse resume
│       ├── resume/update/route.ts      # PUT: Edit profile | POST: Create manual profile
│       ├── cover-letter/analyze/route.ts  # POST: Analyze job description
│       ├── cover-letter/generate/route.ts  # POST: Tailor and generate letter
│       └── applications/route.ts       # GET: History | DELETE: Remove entry
│
├── components/
│   ├── ResumeUploader.tsx              # Uploader zone + manual create triggers
│   ├── ResumeEditor.tsx                # Inline tabs editor for resume profile
│   ├── JobDescriptionForm.tsx          # Multi-stage input, missing fields & remarks
│   ├── CoverLetterViewer.tsx           # Letter viewer, copy, and regenerate
│   └── ApplicationHistory.tsx          # Saved cover letters sidebar list
│
└── lib/
    ├── prisma.ts                       # Prisma client singleton
    ├── resumeParser.ts                 # Text extraction & rule-based parser
    └── gemini.ts                       # Model credentials and generation prompts
```

---

## Scripts

| Command               | Description                          |
|-----------------------|--------------------------------------|
| `npm run dev`         | Start local development server       |
| `npm run build`       | Build production bundle              |
| `npm run start`       | Start production server              |
| `npm run lint`        | Run ESLint checks                    |
| `npx prisma studio`   | Open Prisma database browser         |
| `npx prisma migrate dev` | Apply schema changes locally      |

---

## Security Notes

- API Keys are strictly kept server-side and never exposed to the client.
- File uploads are validated to enforce a 10 MB size limit.
- Database access is parameterized via Prisma to prevent SQL injection.
- Resume profiling utilizes factual context matching to avoid AI hallucinations.

---

## License

MIT
