import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Updates an existing resume profile (PUT).
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, profile } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing resume ID parameter." }, { status: 400 });
    }

    if (!profile) {
      return NextResponse.json({ error: "Missing resume profile content." }, { status: 400 });
    }

    // Convert profile object to string if it is an object
    const contentString = typeof profile === "string" ? profile : JSON.stringify(profile);

    const updatedResume = await prisma.resume.update({
      where: { id },
      data: {
        content: contentString,
      },
    });

    return NextResponse.json({
      id: updatedResume.id,
      fileName: updatedResume.fileName,
      content: updatedResume.content,
    });
  } catch (error: any) {
    console.error("Resume update API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update resume profile." },
      { status: 500 }
    );
  }
}

/**
 * Creates a new manual resume profile (POST).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { profile } = body;

    if (!profile) {
      return NextResponse.json({ error: "Missing resume profile content." }, { status: 400 });
    }

    // Convert profile object to string if it is an object
    const contentString = typeof profile === "string" ? profile : JSON.stringify(profile);

    const newResume = await prisma.resume.create({
      data: {
        fileName: "Manual Profile",
        content: contentString,
      },
    });

    return NextResponse.json({
      id: newResume.id,
      fileName: newResume.fileName,
      content: newResume.content,
    });
  } catch (error: any) {
    console.error("Manual resume creation API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create manual resume profile." },
      { status: 500 }
    );
  }
}
