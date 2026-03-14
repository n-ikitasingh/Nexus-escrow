import { NextResponse } from 'next/server';
import { generateMilestones } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { description, budget } = await req.json();
    if (!description || !budget) {
      return NextResponse.json({ error: 'Missing description or budget' }, { status: 400 });
    }
    const milestones = await generateMilestones(description, budget);
    return NextResponse.json(milestones);
  } catch (error) {
    console.error('API route error:', error); // Add this line to see the actual error
    return NextResponse.json({ error: 'Failed to generate milestones' }, { status: 500 });
  }
}