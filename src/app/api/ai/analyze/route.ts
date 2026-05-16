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
