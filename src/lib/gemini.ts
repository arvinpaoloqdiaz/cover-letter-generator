import { GoogleGenAI, Type } from "@google/genai";
import { ResumeProfile } from "./resumeParser";

const jobAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    job_title: {
      type: Type.STRING,
      description: "Title of the position, or empty string if missing",
    },
    company_name: {
      type: Type.STRING,
      description: "Name of the hiring company, or empty string if missing",
    },
    location: {
      type: Type.STRING,
      description: "Job location, or empty string if missing",
    },
    employment_type: {
      type: Type.STRING,
      description: "e.g. Full-time, Contract, Part-time, Remote, or empty string",
    },
    required_skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Array of required skills",
    },
    preferred_skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Array of preferred/nice-to-have skills",
    },
    required_qualifications: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Array of required qualifications",
    },
    preferred_qualifications: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Array of preferred qualifications",
    },
    responsibilities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Array of responsibilities",
    },
    years_experience: {
      type: Type.STRING,
      description: "Experience requirements, or empty string",
    },
    keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Array of search keywords",
    },
    missing_fields: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Array of required fields that are missing in the job posting text. If company_name is not found, add 'company_name'. If job_title is not found, add 'job_title'.",
    },
    optional_missing_fields: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Array of fields that are helpful but optional and missing in the text, e.g., 'hiring_manager', 'team_name', 'department', 'salary_range'.",
    },
    detected_context: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Contextual clues, e.g., 'startup_environment', 'fast_paced', 'remote_first_company'",
    },
    generation_notes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Structural guidelines and notes for cover letter generation, e.g., 'Highlight React and TypeScript expertise'",
    },
  },
  required: [
    "job_title",
    "company_name",
    "location",
    "employment_type",
    "required_skills",
    "preferred_skills",
    "required_qualifications",
    "preferred_qualifications",
    "responsibilities",
    "years_experience",
    "keywords",
    "missing_fields",
    "optional_missing_fields",
    "detected_context",
    "generation_notes",
  ],
};

/**
 * Returns the Gemini client configured for Job Description Analysis.
 * Throws a descriptive error if JD_ANALYSIS_API_KEY is missing.
 */
export function getJdAnalysisClient(): GoogleGenAI {
  const apiKey = process.env.JD_ANALYSIS_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "JD_ANALYSIS_API_KEY is not configured in your .env file. Please add JD_ANALYSIS_API_KEY to configure the Job Description Analysis stage."
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Returns the Gemini client configured for Cover Letter Generation.
 * Throws a descriptive error if COVER_LETTER_API_KEY is missing.
 */
export function getCoverLetterClient(): GoogleGenAI {
  const apiKey = process.env.COVER_LETTER_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "COVER_LETTER_API_KEY is not configured in your .env file. Please add COVER_LETTER_API_KEY to configure the Cover Letter Generation stage."
    );
  }
  return new GoogleGenAI({ apiKey });
}

export interface JobAnalysis {
  job_title: string;
  company_name: string;
  location: string;
  employment_type: string;
  required_skills: string[];
  preferred_skills: string[];
  required_qualifications: string[];
  preferred_qualifications: string[];
  responsibilities: string[];
  years_experience: string;
  keywords: string[];
  missing_fields: string[];
  optional_missing_fields: string[];
  detected_context: string[];
  generation_notes: string[];
}

/**
 * Analyzes the job description and outputs structured JSON data.
 */
export async function analyzeJobDescription(jobDescription: string): Promise<JobAnalysis> {
  const ai = getJdAnalysisClient();
  const model = process.env.JD_ANALYSIS_MODEL || "gemini-2.5-flash";

  const prompt = `Analyze the following job description and extract key structured information.
Your response MUST be a valid JSON object matching the output schema.
Do not include markdown tags like \`\`\`json or \`\`\`. Output ONLY the raw JSON content.

OUTPUT SCHEMA:
{
  "job_title": "string, title of the position, or empty string if missing",
  "company_name": "string, name of the hiring company, or empty string if missing",
  "location": "string, job location, or empty string if missing",
  "employment_type": "string, e.g. Full-time, Contract, Part-time, Remote, or empty string",
  "required_skills": ["array of strings"],
  "preferred_skills": ["array of strings"],
  "required_qualifications": ["array of strings"],
  "preferred_qualifications": ["array of strings"],
  "responsibilities": ["array of strings"],
  "years_experience": "string, experience requirements, or empty string",
  "keywords": ["array of strings of search keywords"],
  "missing_fields": ["array of required fields that are missing in the job posting text. If company_name is not found, add \\"company_name\\". If job_title is not found, add \\"job_title\\". If both are found, this array can be empty."],
  "optional_missing_fields": ["array of fields that are helpful but optional and missing in the text, e.g., \\"hiring_manager\\", \\"team_name\\", \\"department\\", \\"salary_range\\". Only list fields if they are missing."],
  "detected_context": ["array of strings representing contextual clues, e.g., \\"startup_environment\\", \\"cross_functional_collaboration\\", \\"customer_facing_role\\", \\"remote_first_company\\", \\"fast_paced\\""],
  "generation_notes": ["array of structural guidelines and notes for cover letter generation, e.g., \\"Emphasize collaboration\\", \\"Highlight React and TypeScript expertise\\""]
}

JOB DESCRIPTION:
${jobDescription}`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: jobAnalysisSchema,
      },
    });

    const text = response.text || "{}";
    const cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleanText) as JobAnalysis;

    // Basic structure validation
    return {
      job_title: data.job_title || "",
      company_name: data.company_name || "",
      location: data.location || "",
      employment_type: data.employment_type || "",
      required_skills: data.required_skills || [],
      preferred_skills: data.preferred_skills || [],
      required_qualifications: data.required_qualifications || [],
      preferred_qualifications: data.preferred_qualifications || [],
      responsibilities: data.responsibilities || [],
      years_experience: data.years_experience || "",
      keywords: data.keywords || [],
      missing_fields: data.missing_fields || [],
      optional_missing_fields: data.optional_missing_fields || [],
      detected_context: data.detected_context || [],
      generation_notes: data.generation_notes || [],
    };
  } catch (error: any) {
    console.error("Failed to analyze job description using Gemini:", error);
    throw new Error(`Failed to analyze job description: ${error.message || error}`);
  }
}

/**
 * Tailors a cover letter using Gemini.
 * Uses structured resume and job analysis data.
 */
export async function generateCoverLetter(
  resumeProfile: ResumeProfile,
  jobAnalysis: JobAnalysis,
  userRemarks: string,
  userSuppliedMissingFields: Record<string, string>,
  charLimit?: number | null
): Promise<string> {
  const ai = getCoverLetterClient();
  const model = process.env.COVER_LETTER_MODEL || "gemini-2.5-flash";

  // Merge structured details with user-supplied answers
  const companyName = userSuppliedMissingFields.company_name || jobAnalysis.company_name || "Company";
  const jobTitle = userSuppliedMissingFields.job_title || jobAnalysis.job_title || "Position";
  const hiringManager = userSuppliedMissingFields.hiring_manager || "";
  const teamName = userSuppliedMissingFields.team_name || "";
  const department = userSuppliedMissingFields.department || "";
  const salaryRange = userSuppliedMissingFields.salary_range || "";

  const lengthInstruction = charLimit
    ? `Limit length: Keep the total character count as close to ${charLimit} characters as possible without exceeding it.`
    : `Limit length: Keep the length between 300 and 450 words.`;

  // Build structured profile string representation
  const resumeStr = `
Candidate Name: ${resumeProfile.name}
Email: ${resumeProfile.email}
Phone: ${resumeProfile.phone}
Location: ${resumeProfile.location}

Summary:
${resumeProfile.summary}

Skills:
${resumeProfile.skills.join(", ")}

Work Experience:
${resumeProfile.experience.map(e => `- ${e.role} at ${e.company} (${e.duration}):\n  ${e.description}`).join("\n")}

Education:
${resumeProfile.education.map(ed => `- ${ed.degree} from ${ed.institution} (${ed.duration})`).join("\n")}

Projects:
${resumeProfile.projects.map(p => `- ${p.name}:\n  ${p.description}`).join("\n")}

Certifications:
${resumeProfile.certifications.join("\n")}
`;

  // Build analysis metadata string representation
  const analysisStr = `
Target Company: ${companyName}
Target Job Title: ${jobTitle}
Job Location: ${jobAnalysis.location}
Employment Type: ${jobAnalysis.employment_type}
Years of Experience Required: ${jobAnalysis.years_experience}
Required Skills: ${jobAnalysis.required_skills.join(", ")}
Preferred Skills: ${jobAnalysis.preferred_skills.join(", ")}
Required Qualifications: ${jobAnalysis.required_qualifications.join("\n")}
Responsibilities: ${jobAnalysis.responsibilities.join("\n")}
Context/Vibe: ${jobAnalysis.detected_context.join(", ")}
Internal Notes: ${jobAnalysis.generation_notes.join("\n")}
${hiringManager ? `Hiring Manager: ${hiringManager}` : ""}
${teamName ? `Team Name: ${teamName}` : ""}
${department ? `Department: ${department}` : ""}
${salaryRange ? `Salary Range: ${salaryRange}` : ""}
`;

  const prompt = `You are an expert career coach and professional writer.
Write a tailored, high-converting cover letter based strictly on the structured candidate profile and target job analysis provided below.

CANDIDATE PROFILE:
${resumeStr}

JOB ANALYSIS:
${analysisStr}

${userRemarks ? `ADDITIONAL USER REMARKS / CONTEXT:\n${userRemarks}\n` : ""}

CRITICAL WRITING RULES:
1. Rely ONLY on the candidate profile facts. Do NOT invent or assume any experiences, certifications, projects, tools, or dates not explicitly stated in the CANDIDATE PROFILE.
2. Address the letter to "${hiringManager || "Hiring Manager"}" or "${companyName} Team" as appropriate.
3. Explicitly reference the job title "${jobTitle}" and company name "${companyName}".
4. Align the candidate's actual work experience, skills, and projects with the required skills and responsibilities in the JOB ANALYSIS.
5. If user remarks are provided, weave them naturally into the tone or emphasis of the letter.
6. Professional Tone: Maintain a confident, authentic, and professional tone. Avoid generic clichés and filler words.
7. ${lengthInstruction}

Output only the completed cover letter. Do not include any introductory remarks, salutations like "Sure, here is your cover letter", or markdown blocks.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "";
  } catch (error: any) {
    console.error("Failed to generate cover letter using Gemini:", error);
    throw new Error(`Failed to generate cover letter: ${error.message || error}`);
  }
}
