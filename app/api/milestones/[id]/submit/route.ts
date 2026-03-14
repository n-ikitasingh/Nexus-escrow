// PATH: app/api/milestones/[id]/submit/route.ts
// Does ONE thing only: takes milestone description + submission text, returns AI score.
// All DB writes happen client-side in the submit page.

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { milestoneTitle, milestoneDescription, submission } = await req.json();

    if (!submission?.trim()) {
      return NextResponse.json({ error: "Submission is required" }, { status: 400 });
    }

    // Call Groq
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content: `You are an AI QA agent for a freelance escrow platform. Evaluate the freelancer's work submission against the milestone requirements. Reply ONLY with this exact JSON — no markdown, no extra text:
{"score":<0-100>,"approved":<true if score>=70>,"feedback":"<2 sentences explaining your decision>","suggestion":"<one specific improvement if rejected, empty string if approved>"}`,
          },
          {
            role: "user",
            content: `Milestone: ${milestoneTitle}
Requirements: ${milestoneDescription}
Submission: ${submission.trim()}`,
          },
        ],
      }),
    });

    if (!groqRes.ok) {
      throw new Error(`Groq API error: ${groqRes.status}`);
    }

    const groqData = await groqRes.json();
    const text     = groqData.choices?.[0]?.message?.content ?? "{}";
    const cleaned  = text.replace(/```json|```/g, "").trim();
    const parsed   = JSON.parse(cleaned);

    return NextResponse.json({
      score:      Number(parsed.score ?? 0),
      approved:   Boolean(parsed.approved ?? Number(parsed.score ?? 0) >= 70),
      feedback:   String(parsed.feedback   ?? "Evaluation complete."),
      suggestion: String(parsed.suggestion ?? ""),
    });

  } catch (err) {
    console.error("AI eval error:", err);
    // Fallback evaluation — never crash the user
    return NextResponse.json({
      score:      60,
      approved:   false,
      feedback:   "AI evaluation temporarily unavailable. Please review manually.",
      suggestion: "Try resubmitting in a moment.",
    });
  }
}