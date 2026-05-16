import OpenAI from "openai";
import { z } from "zod";

const ANALYSIS_SCHEMA = z.object({
  category: z.string(),
  title: z.string(),
  description: z.string(),
  ingredients: z.array(z.string()),
  dietaryTags: z.array(z.string()),
  suggestedDiscountPct: z.number().min(0).max(95),
  suggestedPickupHours: z.number().min(0.25).max(24),
  urgency: z.enum(["low", "medium", "critical"]),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
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
    return { ...heuristic(input), model: "heuristic-fallback" };
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
    const parsed = ANALYSIS_SCHEMA.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return { ...heuristic(input), model: "heuristic-fallback" };
    }
    return { ...parsed.data, model: "gpt-4o-mini" };
  } catch (err) {
    console.error("OpenAI vision analysis failed", err);
    return { ...heuristic(input), model: "heuristic-fallback" };
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
function heuristic(input: AnalyzeInput): FoodAnalysis {
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
    rationale:
      "Heuristic fallback used because OPENAI_API_KEY isn't set or the AI call failed. Adjust manually before publishing.",
  };
}
