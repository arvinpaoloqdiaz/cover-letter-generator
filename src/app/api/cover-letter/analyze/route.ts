import { NextRequest, NextResponse } from "next/server";
import { analyzeJobDescription } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const stageMetadata = { stage: "jd_analysis" };
  console.log(`[API Log] Starting request stage: ${stageMetadata.stage}`);

  try {
    const body = await request.json().catch(() => ({}));
    const { jobDescription } = body;

    if (!jobDescription || jobDescription.trim() === "") {
      return NextResponse.json({ error: "Please paste a job description." }, { status: 400 });
    }

    // Call the JD analysis LLM model
    const jobAnalysis = await analyzeJobDescription(jobDescription);

    console.log(`[API Log] Completed request stage: ${stageMetadata.stage} successfully`);

    return NextResponse.json(jobAnalysis);
  } catch (error: any) {
    console.error(`[API Log] Error in stage: ${stageMetadata.stage}:`, error);

    // If API Key is missing, include details
    if (error.message && error.message.includes("JD_ANALYSIS_API_KEY")) {
      return NextResponse.json(
        { error: "JD_ANALYSIS_API_KEY is not configured in the server .env. Please provide the required API credentials." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || "An error occurred during job description analysis." },
      { status: 500 }
    );
  }
}
