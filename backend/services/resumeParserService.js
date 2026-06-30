const pdfParse = require("pdf-parse");

const SECTION_ALIASES = {
  skills: [
    "skills",
    "technical skills",
    "technologies",
    "technology",
    "tools",
    "core competencies",
  ],
  education: [
    "education",
    "academic background",
    "academics",
    "qualifications",
  ],
  projects: [
    "projects",
    "personal projects",
    "academic projects",
    "selected projects",
  ],
  experience: [
    "experience",
    "work experience",
    "professional experience",
    "internship",
    "internships",
    "employment",
  ],
  certifications: [
    "certifications",
    "certificates",
    "licenses",
    "achievements",
    "courses",
  ],
};

const SECTION_HEADINGS = Object.values(SECTION_ALIASES).flat();
const BULLET_RE = /^[\s•*\-–—]+/;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(?=(?:\D*\d){10,15})(?:\+?\d[\d().\s-]{8,}\d)/;
const YEAR_RE =
  /(?:19|20)\d{2}(?:\s*[-–—]\s*(?:present|current|(?:19|20)\d{2}))?/i;

function normalizeText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getLines(text) {
  return normalizeText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanLine(line) {
  return String(line || "")
    .replace(BULLET_RE, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeading(line) {
  return cleanLine(line)
    .replace(/[:|]+$/g, "")
    .toLowerCase();
}

function getSectionKey(line) {
  const heading = normalizeHeading(line);
  return (
    Object.entries(SECTION_ALIASES).find(([, aliases]) =>
      aliases.includes(heading),
    )?.[0] || null
  );
}

function isSectionHeading(line) {
  return SECTION_HEADINGS.includes(normalizeHeading(line));
}

function splitSections(lines) {
  const sections = {};
  let current = "header";

  for (const line of lines) {
    const sectionKey = getSectionKey(line);
    if (sectionKey) {
      current = sectionKey;
      sections[current] = sections[current] || [];
      continue;
    }

    sections[current] = sections[current] || [];
    sections[current].push(line);
  }

  return sections;
}

function uniqueStrings(values) {
  const seen = new Set();
  return values
    .map(cleanLine)
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function parseName(lines) {
  const headerLines = lines.slice(0, 8);
  const nameLine = headerLines.find((line) => {
    const cleaned = cleanLine(line);
    if (!cleaned || EMAIL_RE.test(cleaned) || PHONE_RE.test(cleaned))
      return false;
    if (/linkedin|github|portfolio|http|www\./i.test(cleaned)) return false;
    const words = cleaned.split(/\s+/);
    return (
      words.length >= 2 &&
      words.length <= 6 &&
      /^[A-Za-z][A-Za-z .'-]+$/.test(cleaned)
    );
  });

  return nameLine ? cleanLine(nameLine) : "";
}

function parseEmail(text) {
  return text.match(EMAIL_RE)?.[0] || "";
}

function parsePhone(text) {
  const match = text.match(PHONE_RE)?.[0] || "";
  return match.replace(/\s+/g, " ").trim();
}

function parseSkills(sectionLines = []) {
  const tokens = sectionLines
    .filter((line) => !isSectionHeading(line))
    .flatMap((line) => cleanLine(line).split(/[,|•;]+/))
    .map((skill) =>
      skill.replace(
        /^(languages|frameworks|tools|databases|technologies)\s*[:-]/i,
        "",
      ),
    );

  return uniqueStrings(tokens).filter((skill) => skill.length <= 60);
}

function groupEntries(sectionLines = []) {
  const entries = [];
  let current = [];

  for (const rawLine of sectionLines) {
    const line = cleanLine(rawLine);
    if (!line || isSectionHeading(line)) continue;

    const startsNewEntry =
      current.length > 0 &&
      !BULLET_RE.test(rawLine) &&
      (/\|/.test(line) ||
        YEAR_RE.test(line) ||
        /^[A-Z][A-Za-z0-9 .,&'()/-]{2,}$/.test(line));

    if (startsNewEntry) {
      entries.push(current);
      current = [];
    }

    current.push(line);
  }

  if (current.length) entries.push(current);
  return entries;
}

function parseEducation(sectionLines = []) {
  return groupEntries(sectionLines)
    .map((entry) => {
      const joined = entry.join(" ");
      const year = joined.match(YEAR_RE)?.[0] || "";
      const degreeLine =
        entry.find((line) =>
          /b\.?tech|bachelor|master|m\.?tech|degree|diploma|school|college|university/i.test(
            line,
          ),
        ) ||
        entry[0] ||
        "";
      const institutionLine =
        entry.find((line) =>
          /college|university|institute|school|academy/i.test(line),
        ) ||
        entry[1] ||
        "";

      return {
        degree: cleanLine(degreeLine.replace(YEAR_RE, "")),
        institution: cleanLine(institutionLine.replace(YEAR_RE, "")),
        year,
      };
    })
    .filter((item) => item.degree || item.institution || item.year);
}

function parseProjects(sectionLines = []) {
  return groupEntries(sectionLines)
    .map((entry) => {
      const [title = "", ...details] = entry;
      const techLine =
        details.find((line) =>
          /tech|stack|tools|built with|using/i.test(line),
        ) || "";
      const techStack = techLine
        ? uniqueStrings(
            techLine
              .replace(
                /^(tech stack|technologies|tools|built with|using)\s*[:-]?/i,
                "",
              )
              .split(/[,|•;]+/),
          )
        : [];

      return {
        name: cleanLine(title.replace(YEAR_RE, "")),
        description: cleanLine(
          details.filter((line) => line !== techLine).join(" "),
        ),
        techStack,
      };
    })
    .filter((project) => project.name || project.description);
}

function parseExperience(sectionLines = []) {
  return groupEntries(sectionLines)
    .map((entry) => {
      const [title = "", ...details] = entry;
      const titleParts = title
        .split(/\s+[-–—|]\s+/)
        .map(cleanLine)
        .filter(Boolean);
      const date = entry.join(" ").match(YEAR_RE)?.[0] || "";

      return {
        role: titleParts[0] || cleanLine(title.replace(YEAR_RE, "")),
        company: titleParts[1] || "",
        description: cleanLine(details.join(" ")),
        date,
      };
    })
    .filter((item) => item.role || item.company || item.description);
}

function parseCertifications(sectionLines = []) {
  return uniqueStrings(sectionLines.filter((line) => !isSectionHeading(line)));
}

function parseResumeText(rawText) {
  const text = normalizeText(rawText);
  const lines = getLines(text);
  const sections = splitSections(lines);

  return {
    name: parseName(lines),
    email: parseEmail(text),
    phone: parsePhone(text),
    skills: parseSkills(sections.skills || []),
    education: parseEducation(sections.education || []),
    projects: parseProjects(sections.projects || []),
    experience: parseExperience(sections.experience || []),
    certifications: parseCertifications(sections.certifications || []),
  };
}

/**
 * @param {Buffer} fileBuffer - raw bytes of the uploaded PDF
 * @returns {Promise<string>} plain text extracted from the PDF
 */
async function extractTextFromPdf(fileBuffer) {
  const data = await pdfParse(fileBuffer);
  const text = normalizeText(data.text || "");

  if (!text) {
    const err = new Error(
      "Could not extract any text from that PDF. Make sure it's a text-based resume, not a scanned image.",
    );
    err.statusCode = 422;
    throw err;
  }

  return text;
}

async function parseResumePdf(fileBuffer) {
  const rawText = await extractTextFromPdf(fileBuffer);
  return {
    rawText,
    ...parseResumeText(rawText),
  };
}

module.exports = {
  extractTextFromPdf,
  parseCertifications,
  parseEducation,
  parseEmail,
  parseExperience,
  parseName,
  parsePhone,
  parseProjects,
  parseResumePdf,
  parseResumeText,
  parseSkills,
};
