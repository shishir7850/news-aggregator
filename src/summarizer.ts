import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AggregatedNews } from './aggregator.js';

export interface NewsSummary {
  overview: string;
  world: string;
  finance: string;
  tech: string;
  keyTakeaways: string[];
}

export async function generateAISummary(news: AggregatedNews): Promise<NewsSummary | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('GEMINI_API_KEY not set, skipping AI summary');
    return null;
  }

  try {
    console.log('\nGenerating AI summary with Gemini...');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Prepare news data
    const newsData = Object.entries(news.byCategory)
      .map(([category, items]) => {
        const topItems = items.slice(0, 10).map((item) => `- ${item.title}`).join('\n');
        return `## ${category.toUpperCase()}\n${topItems}`;
      })
      .join('\n\n');

    const prompt = `You are a news analyst. Analyze these headlines and provide a brief, insightful summary.

TODAY'S NEWS HEADLINES:
${newsData}

Provide your analysis in this exact JSON format:
{
  "overview": "2-3 sentence overview of today's major themes across all categories",
  "world": "2-3 sentences summarizing key world events and their significance",
  "finance": "2-3 sentences on market trends and financial news in simple terms anyone can understand",
  "tech": "2-3 sentences on technology developments and their impact",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"]
}

Guidelines:
- Be concise and insightful
- For finance: explain in simple terms, avoid jargon
- Focus on what matters to regular people
- Highlight connections between stories if relevant
- Key takeaways should be actionable or thought-provoking

Return ONLY the JSON, no other text or markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // Clean up response (remove markdown code blocks if present)
    const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const summary = JSON.parse(cleanJson) as NewsSummary;
    console.log('AI summary generated successfully');
    return summary;
  } catch (error) {
    console.error(`Failed to generate AI summary: ${error}`);
    return null;
  }
}

export function formatSummaryMarkdown(summary: NewsSummary): string {
  const lines: string[] = [
    '## 🤖 AI-Powered Summary',
    '',
    '### Overview',
    summary.overview,
    '',
    '### 🌍 World',
    summary.world,
    '',
    '### 💹 Finance',
    summary.finance,
    '',
    '### 💻 Tech',
    summary.tech,
    '',
    '### 💡 Key Takeaways',
    ...summary.keyTakeaways.map((t) => `- ${t}`),
    '',
  ];

  return lines.join('\n');
}
