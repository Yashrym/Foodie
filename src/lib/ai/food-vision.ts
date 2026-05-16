import OpenAI from "openai";
import { z } from "zod";

// Coerce a value that might be a comma-separated string or an array
// into a string[]. Tolerates the common LLM mistake of returning a
// plain string for "ingredients" / "dietaryTags".
const stringArray = z
  .union([z.string(), z.array(z.any())])
  .transform((v) => {
    if (Array.isArray(v)) {
      return v
        .map((x) => String(x ?? "").trim())
        .filter(Boolean);
    }
    return v
      .split(/[,\n;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  })
  .default([]);

// Normalise free-form urgency strings ("High", "URGENT", "needs pickup
// soon", etc.) into our internal enum.
const urgencyField = z
  .union([z.string(), z.null()])
  .transform((v): "low" | "medium" | "critical" => {
    const norm = String(v ?? "").toLowerCase();
    if (
      norm.includes("crit") ||
      norm.includes("urgent") ||
      norm.includes("high") ||
      norm.includes("immediate")
    )
      return "critical";
    if (norm.includes("med") || norm.includes("mod")) return "medium";
    return "low";
  });

// Robust to LLMs that return "60" (string), 60.0, or null.
const number0to95 = z.coerce.number().min(0).max(95);
const number0to48Hours = z.coerce.number().min(0.1).max(48);
const number0to1 = z
  .union([z.coerce.number(), z.literal("")])
  .transform((v) => (typeof v === "number" ? v : 0.7))
  .pipe(z.number().min(0).max(1));

const ANALYSIS_SCHEMA = z.object({
  category: z.string().default("meals"),
  title: z.string().default("Surplus food"),
  description: z.string().default(""),
  ingredients: stringArray,
  dietaryTags: stringArray,
  suggestedDiscountPct: number0to95.default(40),
  suggestedPickupHours: number0to48Hours.default(2),
  urgency: urgencyField,
  confidence: number0to1.default(0.7),
  rationale: z.string().default(""),
});

export type FoodAnalysis = z.infer<typeof ANALYSIS_SCHEMA>;

export interface AnalyzeInput {
  imageDataUrl?: string;
  imageUrl?: string;
  foodName?: string;
  ingredients?: string;
  quantity?: number;
  originalPrice?: number;
  createdMinutesAgo?: number;
  location?: string;
  notes?: string;
}

const SYSTEM_PROMPT = `
You are the AI assistant for Foodie, a food-waste rescue marketplace.
You receive a food image and/or short seller notes. Return a STRICT JSON
object that helps generate a marketplace listing. Reason about freshness,
spoilage risk, and a fair discount that will move the item before close.

Rules:
- "category" must be one of: meals, sandwiches, bakery, desserts, drinks,
  produce, dairy, snacks, other.
- "dietaryTags" must be a subset of: vegetarian, vegan, halal, kosher,
  gluten-free, dairy-free, nut-free. Empty array if unknown.
- "suggestedDiscountPct": 20–80 typical, higher when urgency=critical.
- "suggestedPickupHours": tighter for items that spoil fast.
- "urgency": "critical" if needs pickup within ~1h, "medium" if within 3h,
  "low" otherwise.
- "confidence": 0..1, your overall confidence in the analysis.
- Keep the title under 60 characters and the description under 220.
Respond with JSON only. No markdown, no commentary.
`.trim();

/**
 * Analyze a food upload with the OpenAI Vision API.
 * Falls back to a deterministic heuristic when OPENAI_API_KEY isn't set,
 * so the UX still works in local/dev mode.
 */
export async function analyzeFoodUpload(
  input: AnalyzeInput,
): Promise<FoodAnalysis & { model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[ai/analyze] OPENAI_API_KEY is not set in process.env — " +
        "returning heuristic fallback. If you just added the key to " +
        ".env.local, restart `npm run dev` so Next.js reloads env vars.",
    );
    return {
      ...heuristic(input, "OPENAI_API_KEY not set on the server"),
      model: "heuristic-fallback",
    };
  }

  const client = new OpenAI({ apiKey });
  const userParts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {
      type: "text",
      text: buildUserPrompt(input),
    },
  ];

  const imageSrc = input.imageDataUrl ?? input.imageUrl;
  if (imageSrc) {
    userParts.push({
      type: "image_url",
      image_url: { url: imageSrc, detail: "low" },
    });
  }

  try {
    console.log(
      `[ai/analyze] Calling OpenAI gpt-4o-mini (image=${Boolean(imageSrc)})`,
    );
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userParts },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let asJson: unknown;
    try {
      asJson = JSON.parse(raw);
    } catch (parseErr) {
      console.error(
        "[ai/analyze] OpenAI returned non-JSON content:",
        raw.slice(0, 400),
      );
      return {
        ...heuristic(input, "OpenAI response was not valid JSON"),
        model: "heuristic-fallback",
      };
    }

    const parsed = ANALYSIS_SCHEMA.safeParse(asJson);
    if (!parsed.success) {
      console.error(
        "[ai/analyze] OpenAI JSON did not match schema:",
        parsed.error.issues,
      );
      return {
        ...heuristic(input, "OpenAI JSON did not match expected schema"),
        model: "heuristic-fallback",
      };
    }
    console.log(
      `[ai/analyze] OK · category=${parsed.data.category} discount=${parsed.data.suggestedDiscountPct}% urgency=${parsed.data.urgency}`,
    );
    return { ...parsed.data, model: "gpt-4o-mini" };
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status;
    const code = err?.code ?? err?.error?.code;
    const msg = err?.message ?? String(err);
    console.error(
      `[ai/analyze] OpenAI call failed (status=${status} code=${code}): ${msg}`,
    );
    return {
      ...heuristic(
        input,
        `OpenAI call failed: ${status ? `HTTP ${status} ` : ""}${msg}`,
      ),
      model: "heuristic-fallback",
    };
  }
}

function buildUserPrompt(input: AnalyzeInput) {
  const lines: string[] = ["Seller's notes:"];
  if (input.foodName) lines.push(`- Name: ${input.foodName}`);
  if (input.ingredients) lines.push(`- Ingredients: ${input.ingredients}`);
  if (input.quantity) lines.push(`- Quantity: ${input.quantity}`);
  if (input.originalPrice) lines.push(`- Original price: ${input.originalPrice}`);
  if (input.createdMinutesAgo !== undefined)
    lines.push(`- Prepared ${input.createdMinutesAgo} minutes ago`);
  if (input.location) lines.push(`- Location: ${input.location}`);
  if (input.notes) lines.push(`- Notes: ${input.notes}`);
  lines.push(
    "Please generate the listing JSON object now. Do not wrap in markdown.",
  );
  return lines.join("\n");
}

/** Lightweight rules-only fallback so the app never blocks on AI. */
function heuristic(input: AnalyzeInput, reason?: string): FoodAnalysis {
  const name = (input.foodName ?? "Surplus food").trim();
  const minsAgo = input.createdMinutesAgo ?? 60;
  const urgency: FoodAnalysis["urgency"] =
    minsAgo > 240 ? "critical" : minsAgo > 120 ? "medium" : "low";
  const discount = urgency === "critical" ? 70 : urgency === "medium" ? 50 : 30;
  const hours = urgency === "critical" ? 1 : urgency === "medium" ? 2 : 4;

  const ingredients = (input.ingredients ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const lower = name.toLowerCase();
  const guessCategory = lower.includes("sandwich")
    ? "sandwiches"
    : lower.includes("bread") || lower.includes("croissant")
      ? "bakery"
      : lower.includes("juice") || lower.includes("smoothie")
        ? "drinks"
        : lower.includes("salad")
          ? "meals"
          : "meals";

  return {
    category: guessCategory,
    title: name.length > 60 ? name.slice(0, 58) + "…" : name,
    description: `${input.quantity ?? "Several"} portions of ${name.toLowerCase()} ready for pickup.`,
    ingredients,
    dietaryTags: [],
    suggestedDiscountPct: discount,
    suggestedPickupHours: hours,
    urgency,
    confidence: 0.4,
    rationale: reason
      ? `Heuristic fallback used: ${reason}. Adjust manually before publishing.`
      : "Heuristic fallback used. Adjust manually before publishing.",
  };
}
