// @ts-ignore
import pdfParse from "@cedrugs/pdf-parse";
import mammoth from "mammoth";

export interface Experience {
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  duration: string;
}

export interface Project {
  name: string;
  description: string;
}

export interface ResumeProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: string[];
}

/**
 * Extracts raw text from a PDF or DOCX file buffer.
 * Falls back to plain text decoding if a text file is uploaded.
 */
export async function parseResume(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    if (mimeType === "application/pdf") {
      const data = await pdfParse(buffer);
      return data.text || "";
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    } else if (mimeType.startsWith("text/")) {
      return buffer.toString("utf8");
    } else {
      throw new Error(`Unsupported file type: ${mimeType}. Please upload a PDF, DOCX, or TXT file.`);
    }
  } catch (error: any) {
    console.error("Error parsing resume document:", error);
    throw new Error(`Failed to parse resume document: ${error.message || error}`);
  }
}

/**
 * Parses raw extracted resume text into a structured profile JSON format.
 * Uses heuristics and regular expressions (non-AI rule-based parsing).
 */
export function parseResumeToProfile(rawText: string): ResumeProfile {
  const profile: ResumeProfile = {
    name: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
  };

  if (!rawText) return profile;

  // Normalize newlines and clean lines
  const cleanText = rawText.replace(/\r\n/g, "\n");
  const lines = cleanText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // 1. Basic Fields Parsing (Email, Phone, Location, Name)
  // Email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
  const emailMatch = cleanText.match(emailRegex);
  if (emailMatch) {
    profile.email = emailMatch[0];
  }

  // Phone
  const phoneRegex = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
  const phoneMatch = cleanText.match(phoneRegex);
  if (phoneMatch) {
    profile.phone = phoneMatch[0];
  }

  // Location (e.g. City, ST or City, Country)
  const locationRegex = /\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2,}|[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)\b/;
  const locationMatch = cleanText.match(locationRegex);
  if (locationMatch) {
    // Avoid matching typical headers
    const candidate = locationMatch[0];
    if (!/education|experience|skills|projects|summary|objective/i.test(candidate)) {
      profile.location = candidate;
    }
  }

  // Name: First line that doesn't look like contact details or a heading, under 40 chars
  for (const line of lines) {
    if (
      line.length > 2 &&
      line.length < 40 &&
      !line.includes("@") &&
      !line.includes("http") &&
      !line.includes("www") &&
      !/\d/.test(line) &&
      !/resume|cv|curriculum/i.test(line) &&
      !/education|experience|skills|projects|summary|objective/i.test(line)
    ) {
      profile.name = line;
      break;
    }
  }
  if (!profile.name) {
    profile.name = "Candidate Name";
  }

  // 2. Section Parsing (Group lines by headers)
  let currentSection = "summary"; // Default section for lines before any header
  const sectionLines: { [key: string]: string[] } = {
    summary: [],
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
  };

  const headersMap = [
    { key: "skills", regex: /\b(skills|technologies|technical skills|skills & expertise|tools)\b/i },
    { key: "experience", regex: /\b(experience|employment|work history|professional experience|career history|work experience|employment history)\b/i },
    { key: "education", regex: /\b(education|academic background|qualifications|academic details)\b/i },
    { key: "projects", regex: /\b(projects|key projects|academic projects|personal projects)\b/i },
    { key: "certifications", regex: /\b(certifications|certificates|licenses|credentials)\b/i },
    { key: "summary", regex: /\b(summary|objective|professional summary|about me|profile)\b/i },
  ];

  for (const line of lines) {
    // Check if the line matches any section header
    let matchedHeader = false;
    for (const header of headersMap) {
      if (header.regex.test(line) && line.length < 35) {
        currentSection = header.key;
        matchedHeader = true;
        break;
      }
    }
    // If it's not a header and we have a valid current section, add the line
    if (!matchedHeader) {
      sectionLines[currentSection].push(line);
    }
  }

  // Post-process sections
  // Summary
  // Remove names, email, phone, location from summary lines to avoid duplication
  const summaryLines = sectionLines.summary.filter(l => {
    return l !== profile.name && l !== profile.email && l !== profile.phone && l !== profile.location && !l.includes("@");
  });
  profile.summary = summaryLines.slice(0, 5).join(" "); // Take first 5 lines for summary

  // Skills
  const rawSkills = sectionLines.skills.join(" ");
  if (rawSkills) {
    // Split by common delimiters: comma, semicolon, bullet, vertical pipe, tab
    profile.skills = rawSkills
      .split(/[,;|•\t]|\s{3,}/)
      .map(s => s.trim().replace(/^[-•]\s*/, ""))
      .filter(s => s.length > 1 && s.length < 30 && !/skills|technologies|tools/i.test(s));
  }

  // Experiece
  // Heuristic: Group by date ranges. E.g. "2020 - Present" or "Jan 2018 - Dec 2020"
  const dateRangeRegex = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*\d{4}\s*[-–—]\s*(?:Present|Active|Current|\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\b/i;

  const expLines = sectionLines.experience;
  let currentExp: Experience | null = null;

  for (let i = 0; i < expLines.length; i++) {
    const line = expLines[i];
    const dateMatch = line.match(dateRangeRegex);

    if (dateMatch) {
      // Save previous if exists
      if (currentExp) {
        profile.experience.push(currentExp);
      }

      // Start new experience entry
      const duration = dateMatch[0];
      let companyRoleText = line.replace(duration, "").replace(/^[-•,]\s*|[-•,]\s*$/g, "").trim();
      
      // If the companyRoleText is empty, look at the line before
      if (!companyRoleText && i > 0) {
        companyRoleText = expLines[i - 1];
        // Remove it from previous entry description if it was added
        if (currentExp && currentExp.description.endsWith(companyRoleText)) {
          currentExp.description = currentExp.description.substring(0, currentExp.description.lastIndexOf(companyRoleText)).trim();
        }
      }

      // Try to split company and role on common splitters: " at ", "|", ",", "-"
      let company = "Company Name";
      let role = "Job Title";

      const splitters = [/\bat\b/i, /\|/, /,/, /-/];
      let splitDone = false;
      for (const splitter of splitters) {
        const parts = companyRoleText.split(splitter);
        if (parts.length >= 2) {
          role = parts[0].trim();
          company = parts[1].trim();
          splitDone = true;
          break;
        }
      }

      if (!splitDone && companyRoleText) {
        role = companyRoleText;
      }

      currentExp = {
        company,
        role,
        duration,
        description: "",
      };
    } else if (currentExp) {
      // Add line to description of current experience
      currentExp.description += (currentExp.description ? "\n" : "") + line.replace(/^[-•]\s*/, "");
    }
  }
  if (currentExp) {
    profile.experience.push(currentExp);
  }

  // Fallback: If no experience objects could be created via date heuristics, group by bullets/lines
  if (profile.experience.length === 0 && expLines.length > 0) {
    // Treat the section as a single experience entry
    profile.experience.push({
      company: "Various Experience",
      role: "Professional",
      duration: "Various dates",
      description: expLines.join("\n"),
    });
  }

  // Education
  const eduLines = sectionLines.education;
  let currentEdu: Education | null = null;

  for (let i = 0; i < eduLines.length; i++) {
    const line = eduLines[i];
    const dateMatch = line.match(/\b\d{4}\s*[-–—]\s*(?:\d{4}|Present)?\b/) || line.match(/\b(19|20)\d{2}\b/);

    if (dateMatch) {
      if (currentEdu) {
        profile.education.push(currentEdu);
      }

      const duration = dateMatch[0];
      const text = line.replace(duration, "").replace(/^[-•,]\s*|[-•,]\s*$/g, "").trim();

      let degree = text;
      let institution = "Institution";

      // Try to split on comma, dash, pipe
      const parts = text.split(/[,|-]/);
      if (parts.length >= 2) {
        degree = parts[0].trim();
        institution = parts[1].trim();
      }

      currentEdu = {
        institution,
        degree,
        duration,
      };
    } else if (currentEdu) {
      // Append additional details like GPA or relevant courses
      currentEdu.institution += ` (${line.replace(/^[-•]\s*/, "")})`;
    }
  }
  if (currentEdu) {
    profile.education.push(currentEdu);
  }

  if (profile.education.length === 0 && eduLines.length > 0) {
    profile.education.push({
      institution: "Institution Name",
      degree: eduLines[0],
      duration: "Various dates",
    });
  }

  // Projects
  const projLines = sectionLines.projects;
  let currentProj: Project | null = null;

  for (const line of projLines) {
    // A project heading can start with a bullet point or be a short line
    if (line.replace(/^[-•]\s*/, "").length < 40 && (line.startsWith("-") || line.startsWith("•") || line.length < 25)) {
      if (currentProj) {
        profile.projects.push(currentProj);
      }
      currentProj = {
        name: line.replace(/^[-•]\s*/, ""),
        description: "",
      };
    } else if (currentProj) {
      currentProj.description += (currentProj.description ? "\n" : "") + line.replace(/^[-•]\s*/, "");
    }
  }
  if (currentProj) {
    profile.projects.push(currentProj);
  }

  if (profile.projects.length === 0 && projLines.length > 0) {
    profile.projects.push({
      name: "Core Projects",
      description: projLines.join("\n"),
    });
  }

  // Certifications
  profile.certifications = sectionLines.certifications
    .map(c => c.replace(/^[-•]\s*/, ""))
    .filter(c => c.length > 2);

  return profile;
}
