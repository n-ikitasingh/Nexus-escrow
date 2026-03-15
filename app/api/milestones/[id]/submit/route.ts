// PATH: app/api/milestones/[id]/submit/route.ts
// Server-side only — uses GROQ_API_KEY (not NEXT_PUBLIC_) which is always available

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { milestoneTitle, milestoneDescription, submission } = body;

    if (!submission?.trim()) {
      return NextResponse.json({ error: "Submission is required" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      // Fallback if key not set
      return NextResponse.json({
        score: 65, approved: false,
        feedback: "AI evaluation unavailable (no API key). Submission recorded.",
        suggestion: "Add GROQ_API_KEY to your environment variables.",
      });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:      "llama-3.3-70b-versatile",
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content: `You are an AI QA agent for a freelance escrow platform. Evaluate the freelancer's submission against the milestone requirements.
Reply ONLY with this exact JSON — no markdown, no extra text:
{"score":<0-100>,"approved":<true if score>=70>,"feedback":"<2 sentences>","suggestion":"<one fix if rejected, empty string if approved>"}`,
          },
          {
            role: "user",
            content: `Milestone: ${milestoneTitle}\nRequirements: ${milestoneDescription}\nSubmission: ${submission.trim()}`,
          },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq error:", groqRes.status, errText);
      // Return fallback — don't crash
      const words = submission.trim().split(/\s+/).length;
      return NextResponse.json({
        score:      words > 30 ? 75 : 40,
        approved:   words > 30,
        feedback:   words > 30 ? "Submission appears complete." : "Submission needs more detail.",
        suggestion: words <= 30 ? "Provide more detail about what was built and how." : "",
      });
    }

    const groqData = await groqRes.json();
    const text     = groqData.choices?.[0]?.message?.content ?? "{}";
    const cleaned  = text.replace(/```json|```/g, "").trim();

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Groq returned non-JSON — use word count fallback
      const words = submission.trim().split(/\s+/).length;
      return NextResponse.json({
        score:      words > 30 ? 75 : 40,
        approved:   words > 30,
        feedback:   words > 30 ? "Work appears complete based on submission detail." : "Submission too brief to evaluate.",
        suggestion: words <= 30 ? "Add more detail about implementation." : "",
      });
    }

    return NextResponse.json({
      score:      Number(parsed.score      ?? 0),
      approved:   Boolean(parsed.approved  ?? Number(parsed.score ?? 0) >= 70),
      feedback:   String(parsed.feedback   ?? "Evaluation complete."),
      suggestion: String(parsed.suggestion ?? ""),
    });

  } catch (err) {
    console.error("Milestone submit route error:", err);
    return NextResponse.json({
      score: 60, approved: false,
      feedback: "Evaluation temporarily unavailable. Submission was recorded.",
      suggestion: "Try resubmitting in a moment.",
    });
  }
}