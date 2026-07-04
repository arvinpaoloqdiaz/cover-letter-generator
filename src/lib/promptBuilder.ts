/**
 * Utility to construct prompts for the Gemini API.
 */

export function buildCoverLetterPrompt(resumeText: string, jobDescription: string): string {
  return `You are an expert career coach and recruiter.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Instructions:
1. Write a professional cover letter.
2. Tailor the content to the job requirements.
3. Highlight relevant experience.
4. Do not invent qualifications.
5. Keep the tone professional.
6. Keep the length between 300 and 450 words.
7. Use specific examples from the resume whenever possible.

Output only the cover letter.`;
}

export function buildMetadataExtractionPrompt(jobDescription: string): string {
  return `Analyze the following job description and extract:
1. The company name (if mentioned, otherwise return "Company Unknown").
2. The job title (if mentioned, otherwise return "Position Unknown").

Format your output strictly as a JSON object with keys "companyName" and "jobTitle". Do not include markdown formatting like \`\`\`json or \`\`\`.

JOB DESCRIPTION:
${jobDescription}`;
}
