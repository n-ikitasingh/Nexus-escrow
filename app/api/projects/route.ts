import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Parse body
    const body = await req.json();
    const { title, description, total_budget, milestones, employer_id } = body;

    // Validate employer_id
    if (!employer_id) {
      return NextResponse.json({ error: "Missing employer_id" }, { status: 400 });
    }

    // Verify that the employer profile exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", employer_id)
      .single();

    if (profileError || !profile) {
      console.error("Employer profile not found:", employer_id);
      return NextResponse.json(
        { error: "Employer profile not found. Please ensure you have signed up as an employer." },
        { status: 400 }
      );
    }

    // Validate other fields
    if (!title?.trim() || !description?.trim() || !total_budget || !milestones?.length) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, total_budget, milestones" },
        { status: 400 }
      );
    }

    if (typeof total_budget !== "number" || total_budget <= 0) {
      return NextResponse.json({ error: "Invalid budget" }, { status: 400 });
    }

    // Validate milestone percentages sum to ~100
    const totalPct = milestones.reduce(
      (sum: number, m: { percentage: number }) => sum + m.percentage, 0
    );
    if (Math.abs(totalPct - 100) > 1) {
      return NextResponse.json(
        { error: `Milestone percentages must sum to 100 (got ${totalPct})` },
        { status: 400 }
      );
    }

    // Insert project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        title: title.trim(),
        description: description.trim(),
        total_budget,
        employer_id,
        status: "draft",
        escrow_balance: 0,
      })
      .select()
      .single();

    if (projectError || !project) {
      console.error("Project insert error details:", projectError);
      // Return the actual Supabase error message for debugging
      return NextResponse.json(
        { error: projectError?.message || "Failed to create project" },
        { status: 500 }
      );
    }

    // Insert milestones
    const milestoneRows = milestones.map((m: {
      title: string;
      description: string;
      percentage: number;
    }) => ({
      project_id: project.id,
      title: m.title.trim(),
      description: m.description.trim(),
      amount: parseFloat(((m.percentage / 100) * total_budget).toFixed(2)),
      status: "pending",
    }));

    const { error: msError } = await supabase
      .from("milestones")
      .insert(milestoneRows);

    if (msError) {
      console.error("Milestones insert error details:", msError);
      // Roll back the project
      await supabase.from("projects").delete().eq("id", project.id);
      return NextResponse.json(
        { error: msError.message || "Failed to create milestones" },
        { status: 500 }
      );
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    console.error("Unexpected error in POST /api/projects:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}