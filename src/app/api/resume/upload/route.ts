import { NextRequest, NextResponse } from "next/server";
import { parseResume, parseResumeToProfile } from "@/lib/resumeParser";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded. Please select a resume file to upload." }, { status: 400 });
    }

    // Validate size (limit to 10MB as per specs)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 10MB limit. Please upload a smaller file." }, { status: 400 });
    }

    const fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type;

    // Extract text from the resume
    const textContent = await parseResume(buffer, mimeType);

    if (!textContent || textContent.trim() === "") {
      return NextResponse.json(
        { error: "Could not extract text from the file. Ensure it is not empty or password-protected." },
        { status: 400 }
      );
    }

    // Parse the raw text into structured JSON format
    const profile = parseResumeToProfile(textContent);
    const contentJsonString = JSON.stringify(profile);

    // Save the structured profile into the database
    const resume = await prisma.resume.create({
      data: {
        fileName,
        content: contentJsonString,
      },
    });

    return NextResponse.json({
      id: resume.id,
      content: resume.content,
      fileName: resume.fileName,
    });
  } catch (error: any) {
    console.error("Resume upload API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process and save resume." },
      { status: 500 }
    );
  }
}
