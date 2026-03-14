import OpenAI from 'openai';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function generateMilestones(description: string, budget: number) {
  const prompt = `
You are an AI project manager. Given a project description and total budget, generate a list of milestones with titles, brief descriptions, and suggested percentage of budget for each. Return a JSON array with objects containing "title", "description", and "percentage". Ensure the percentages sum to 100. The milestones should be logical steps to complete the project.

Project description: "${description}"
Total budget: $${budget}

Return only the JSON array, no other text.
  `;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Updated model
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from Groq');
    
    return JSON.parse(content);
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
}

export async function evaluateMilestone(milestoneDescription: string, submission: string) {
  const prompt = `
You are an AI quality assurance agent. Given a milestone description and the freelancer's submission, determine if the work is fully completed, partially completed, or unmet. Provide a brief feedback. Return a JSON object with "status" (one of "completed", "partial", "unmet") and "feedback".

Milestone description: "${milestoneDescription}"
Freelancer submission: "${submission}"

Return only the JSON object.
  `;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Same updated model
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from Groq');
    
    return JSON.parse(content);
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
}