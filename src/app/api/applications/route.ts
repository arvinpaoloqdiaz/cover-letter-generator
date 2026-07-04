import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Returns the application history.
 */
export async function GET() {
  try {
    const applications = await prisma.application.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        companyName: true,
        jobTitle: true,
        jobDescription: true,
        coverLetter: true,
        resumeId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(applications);
  } catch (error: any) {
    console.error("Fetch applications API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve application history." },
      { status: 500 }
    );
  }
}

/**
 * Deletes an application from history.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing application ID parameter." }, { status: 400 });
    }

    await prisma.application.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Application successfully removed from history." });
  } catch (error: any) {
    console.error("Delete application API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete application record." },
      { status: 500 }
    );
  }
}
