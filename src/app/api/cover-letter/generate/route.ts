import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateCoverLetter } from "@/lib/gemini";
import { ResumeProfile } from "@/lib/resumeParser";

export async function POST(request: NextRequest) {
  const stageMetadata = { stage: "cover_letter_generation" };
  console.log(`[API Log] Starting request stage: ${stageMetadata.stage}`);

  try {
    const body = await request.json().catch(() => ({}));
    const {
      resumeId,
      jobAnalysis,
      userRemarks = "",
      userSuppliedMissingFields = {},
      charLimit,
      jobDescription = "",
    } = body;

    const parsedCharLimit: number | null =
      typeof charLimit === "number" && charLimit > 0 ? Math.round(charLimit) : null;

    if (!resumeId) {
      return NextResponse.json({ error: "Please select or upload a resume first." }, { status: 400 });
    }
    if (!jobAnalysis) {
      return NextResponse.json({ error: "Job analysis data is missing." }, { status: 400 });
    }

    // Fetch the resume from DB
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      return NextResponse.json({ error: "Selected resume could not be found in the database." }, { status: 404 });
    }

    // Parse the stored JSON resume profile
    let resumeProfile: ResumeProfile;
    try {
      resumeProfile = JSON.parse(resume.content);
    } catch (parseError) {
      console.warn("Saved resume content is not structured JSON. Converting raw text...", parseError);
      // Fallback for legacy resumes that contain raw text
      const { parseResumeToProfile } = require("@/lib/resumeParser");
      resumeProfile = parseResumeToProfile(resume.content);
    }

    // Generate cover letter using Gemini
    let coverLetter = "";
    try {
      coverLetter = await generateCoverLetter(
        resumeProfile,
        jobAnalysis,
        userRemarks,
        userSuppliedMissingFields,
        parsedCharLimit
      );
    } catch (apiError: any) {
      console.error("Gemini API Error:", apiError);
      if (apiError.message && apiError.message.includes("COVER_LETTER_API_KEY")) {
        return NextResponse.json(
          { error: "COVER_LETTER_API_KEY is not configured in the server .env. Please provide the required API credentials." },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: apiError.message || "Failed to generate cover letter. Ensure your API keys are configured." },
        { status: 500 }
      );
    }

    // Extract company name and job title from structured data / user inputs
    const companyName = userSuppliedMissingFields.company_name || jobAnalysis.company_name || "Company Unknown";
    const jobTitle = userSuppliedMissingFields.job_title || jobAnalysis.job_title || "Position Unknown";

    // Save application history to database
    const application = await prisma.application.create({
      data: {
        companyName,
        jobTitle,
        jobDescription: jobDescription || JSON.stringify(jobAnalysis),
        coverLetter,
        resumeId,
      },
    });

    console.log(`[API Log] Completed request stage: ${stageMetadata.stage} successfully`);

    return NextResponse.json({
      applicationId: application.id,
      coverLetter: application.coverLetter,
      companyName: application.companyName,
      jobTitle: application.jobTitle,
    });
  } catch (error: any) {
    console.error(`[API Log] Error in stage: ${stageMetadata.stage}:`, error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during cover letter generation." },
      { status: 500 }
    );
  }
}
