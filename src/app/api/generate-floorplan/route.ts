import { NextResponse } from "next/server";
import { GEMINI_FLOORPLAN_SYSTEM_PROMPT } from "@/features/floorplan/ai/geminiSystemPrompt";
import { safeParseFloorPlan } from "@/features/floorplan/validation";

export const runtime = "nodejs";

interface GenerateFloorPlanPayload {
  areaSqft: number;
  roomCount: number;
  bathroomCount: number;
  style: "modern" | "minimal" | "traditional" | "contemporary";
  prompt: string;
}

interface GroqChatCompletionsResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const model = normalizeModelId(process.env.GROQ_MODEL ?? "openai/gpt-oss-20b");

    if (!apiKey) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY environment variable." }, { status: 500 });
    }

    const body = (await req.json()) as Partial<GenerateFloorPlanPayload>;
    const requestValidation = validatePayload(body);
    if (!requestValidation.ok) {
      return NextResponse.json({ error: requestValidation.error }, { status: 400 });
    }

    const userPrompt = createUserPrompt(requestValidation.value);

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: {
          type: "json_object"
        },
        messages: [
          {
            role: "system",
            content: GEMINI_FLOORPLAN_SYSTEM_PROMPT
          },
          {
            role: "user",
            content: userPrompt
          }
        ]
      })
    });

    if (!groqRes.ok) {
      const errorText = await groqRes.text();
      if (groqRes.status === 404) {
        return NextResponse.json(
          {
            error: `Groq model '${model}' was not found (404). Update GROQ_MODEL to a currently available model ID.`,
            details: errorText.slice(0, 1200)
          },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { error: `Groq API request failed (${groqRes.status}).`, details: errorText.slice(0, 1200) },
        { status: 502 }
      );
    }

    const data = (await groqRes.json()) as GroqChatCompletionsResponse;
    const rawText = data.choices?.[0]?.message?.content ?? "";

    if (!rawText.trim()) {
      return NextResponse.json({ error: "Groq returned empty output." }, { status: 502 });
    }

    const jsonText = extractJson(rawText);
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        { error: "Groq did not return valid JSON.", rawOutput: rawText.slice(0, 1200) },
        { status: 502 }
      );
    }

    const parsedPlan = safeParseFloorPlan(parsedJson);
    if (!parsedPlan.success) {
      return NextResponse.json(
        {
          error: "Generated JSON does not match FloorPlan schema.",
          validationIssues: parsedPlan.error.flatten()
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ floorPlan: parsedPlan.data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown server error." },
      { status: 500 }
    );
  }
}

function normalizeModelId(model: string): string {
  const trimmed = model.trim();
  if (trimmed.startsWith("models/")) {
    return trimmed.slice("models/".length);
  }
  return trimmed;
}

function validatePayload(body: Partial<GenerateFloorPlanPayload>): { ok: true; value: GenerateFloorPlanPayload } | { ok: false; error: string } {
  if (!body) return { ok: false, error: "Request body is required." };
  const areaSqft = body.areaSqft;
  const roomCount = body.roomCount;
  const bathroomCount = body.bathroomCount;

  if (!Number.isFinite(areaSqft) || (areaSqft ?? 0) <= 0) {
    return { ok: false, error: "areaSqft must be a positive number." };
  }
  if (!Number.isFinite(roomCount) || (roomCount ?? 0) <= 0) {
    return { ok: false, error: "roomCount must be a positive number." };
  }
  if (!Number.isFinite(bathroomCount) || (bathroomCount ?? -1) < 0) {
    return { ok: false, error: "bathroomCount must be 0 or a positive number." };
  }
  const style = body.style ?? "modern";
  if (!["modern", "minimal", "traditional", "contemporary"].includes(style)) {
    return { ok: false, error: "style is invalid." };
  }

  return {
    ok: true,
    value: {
      areaSqft: areaSqft as number,
      roomCount: roomCount as number,
      bathroomCount: bathroomCount as number,
      style,
      prompt: body.prompt?.trim() ?? ""
    }
  };
}

function createUserPrompt(input: GenerateFloorPlanPayload): string {
  return [
    "Generate one residential floor plan JSON.",
    `Total area target: ${input.areaSqft} sqft.`,
    `Target rooms: ${input.roomCount}.`,
    `Target bathrooms/toilets: ${input.bathroomCount}.`,
    `Architectural style: ${input.style}.`,
    "Use centimeters for all coordinates and dimensions.",
    "All rooms must be axis-aligned rectangles.",
    "Provide 4 walls per room (north,east,south,west) and include valid openings with in-range offsets.",
    input.prompt ? `Additional constraints: ${input.prompt}` : "No additional constraints."
  ].join("\n");
}

function extractJson(rawText: string): string {
  const cleaned = rawText
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}
