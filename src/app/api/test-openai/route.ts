// src/app/api/test-openai/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "OPENAI_API_KEY is missing" }, { status: 500 });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Respond with JSON: {\"ping\":\"pong\"}" }],
      temperature: 0,
      max_tokens: 20,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: data }, { status: 500 });
  }

  const text = data?.choices?.[0]?.message?.content ?? "";
  return NextResponse.json({ ok: true, text });
}
