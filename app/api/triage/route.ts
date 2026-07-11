import { NextRequest } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const CATEGORIES = [
  "Electrical",
  "Mechanical",
  "Plumbing",
  "HVAC",
  "IT/Network",
  "Furniture",
  "Structural",
  "General",
  "Other",
];

const PRIORITIES = ["Low", "Medium", "High", "Critical"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { complaint, assetContext } = body;

    if (!complaint) {
      return Response.json({ error: "Complaint is required" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return Response.json(
        generateFallbackTriage(complaint, assetContext),
        { status: 200 }
      );
    }

    const prompt = buildPrompt(complaint, assetContext);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!res.ok) {
      return Response.json(
        generateFallbackTriage(complaint, assetContext),
        { status: 200 }
      );
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    try {
      const parsed = JSON.parse(text);
      return Response.json(validateAndSanitize(parsed), { status: 200 });
    } catch {
      return Response.json(
        generateFallbackTriage(complaint, assetContext),
        { status: 200 }
      );
    }
  } catch {
    return Response.json(
      generateFallbackTriage("", null),
      { status: 200 }
    );
  }
}

function buildPrompt(complaint: string, assetContext: Record<string, string> | null): string {
  let contextStr = "No asset context available.";
  if (assetContext) {
    contextStr = `
Asset Name: ${assetContext.name || "Unknown"}
Category: ${assetContext.category || "Unknown"}
Condition: ${assetContext.condition || "Unknown"}
Location: ${assetContext.location || "Unknown"}
Model: ${assetContext.model || "Unknown"}
`;
  }

  return `You are a professional maintenance issue triage system. Analyze the following complaint and asset context, then provide structured output.

Asset Context:
${contextStr}

User Complaint:
"${complaint}"

Respond in valid JSON with exactly these fields:
{
  "title": "Professional issue title (concise, descriptive)",
  "category": "One of: ${CATEGORIES.join(", ")}",
  "priority": "One of: ${PRIORITIES.join(", ")}",
  "possibleCauses": ["cause1", "cause2", "cause3"],
  "initialChecks": ["check1", "check2", "check3"],
  "safetyNote": "Brief safety recommendation if applicable, or empty string"
}

Rules:
- Title must be professional and concise
- Priority: Critical for safety hazards or complete failures; High for significant disruption; Medium for noticeable issues; Low for minor/cosmetic
- Possible causes should be realistic and specific
- Initial checks should be safe for a non-technical person
- Safety note should warn about electrical, fire, or physical hazards
- Do NOT provide repair instructions that could be dangerous
- Return ONLY the JSON, no other text`;
}

function generateFallbackTriage(
  complaint: string,
  assetContext: Record<string, string> | null
): Record<string, unknown> {
  const lowerComplaint = complaint.toLowerCase();
  const assetCategory = assetContext?.category?.toLowerCase() || "";

  let category = "General";
  if (
    lowerComplaint.includes("electric") ||
    lowerComplaint.includes("power") ||
    lowerComplaint.includes("wire") ||
    assetCategory.includes("electr")
  ) {
    category = "Electrical";
  } else if (
    lowerComplaint.includes("leak") ||
    lowerComplaint.includes("pipe") ||
    lowerComplaint.includes("water") ||
    assetCategory.includes("plumb")
  ) {
    category = "Plumbing";
  } else if (
    lowerComplaint.includes("ac") ||
    lowerComplaint.includes("cool") ||
    lowerComplaint.includes("heat") ||
    lowerComplaint.includes("hvac")
  ) {
    category = "HVAC";
  } else if (
    lowerComplaint.includes("network") ||
    lowerComplaint.includes("internet") ||
    lowerComplaint.includes("wifi") ||
    lowerComplaint.includes("computer")
  ) {
    category = "IT/Network";
  } else if (
    lowerComplaint.includes("motor") ||
    lowerComplaint.includes("mechanical") ||
    lowerComplaint.includes("gear")
  ) {
    category = "Mechanical";
  } else if (
    lowerComplaint.includes("chair") ||
    lowerComplaint.includes("table") ||
    lowerComplaint.includes("desk")
  ) {
    category = "Furniture";
  }

  let priority: "Low" | "Medium" | "High" | "Critical" = "Medium";
  if (
    lowerComplaint.includes("danger") ||
    lowerComplaint.includes("fire") ||
    lowerComplaint.includes("spark") ||
    lowerComplaint.includes("gas")
  ) {
    priority = "Critical";
  } else if (
    lowerComplaint.includes("broken") ||
    lowerComplaint.includes("not working") ||
    lowerComplaint.includes("complete")
  ) {
    priority = "High";
  } else if (
    lowerComplaint.includes("minor") ||
    lowerComplaint.includes("small") ||
    lowerComplaint.includes("cosmetic")
  ) {
    priority = "Low";
  }

  const shortDesc =
    complaint.length > 60 ? complaint.substring(0, 60) + "..." : complaint;

  return {
    title: shortDesc || "Maintenance issue reported",
    category,
    priority,
    possibleCauses: [
      "Wear and tear from regular use",
      "Possible component failure",
      "Environmental factors",
    ],
    initialChecks: [
      "Check for visible damage",
      "Verify power/connection status",
      "Note any unusual sounds or smells",
    ],
    safetyNote:
      priority === "Critical"
        ? "Safety hazard detected. Do not attempt to fix. Contact a qualified technician immediately."
        : "",
  };
}

function validateAndSanitize(data: Record<string, unknown>): Record<string, unknown> {
  return {
    title:
      typeof data.title === "string" && data.title.length > 0
        ? data.title
        : "Issue reported",
    category: CATEGORIES.includes(data.category as string)
      ? data.category
      : "General",
    priority: PRIORITIES.includes(data.priority as string)
      ? data.priority
      : "Medium",
    possibleCauses: Array.isArray(data.possibleCauses)
      ? data.possibleCauses.filter((c): c is string => typeof c === "string")
      : [],
    initialChecks: Array.isArray(data.initialChecks)
      ? data.initialChecks.filter((c): c is string => typeof c === "string")
      : [],
    safetyNote: typeof data.safetyNote === "string" ? data.safetyNote : "",
  };
}
