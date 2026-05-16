import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { analyzeFoodUpload } from "@/lib/ai/food-vision";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  console.log(
    `[ai/analyze] POST · user=${session.user.email} hasOpenAIKey=${hasKey}`,
  );

  const body = await req.json().catch(() => ({}));
  const result = await analyzeFoodUpload({
    imageDataUrl: body.imageDataUrl,
    imageUrl: body.imageUrl,
    foodName: body.foodName,
    ingredients: body.ingredients,
    quantity: body.quantity,
    originalPrice: body.originalPrice,
    createdMinutesAgo: body.createdMinutesAgo,
    location: body.location,
    notes: body.notes,
  });

  return NextResponse.json({ analysis: result });
}

export async function GET() {
  // Tiny diagnostic so you can verify the server has the key loaded
  // without making a real OpenAI call. Hit GET /api/ai/analyze.
  return NextResponse.json({
    ok: true,
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    keyPrefix: process.env.OPENAI_API_KEY?.slice(0, 7) ?? null,
  });
}
