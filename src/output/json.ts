import type { AggregatedNews } from '../aggregator.js';
import type { NewsSummary } from '../summarizer.js';

export interface JSONOutput {
  generatedAt: string;
  totalCount: number;
  totalPoints: number;
  categories: string[];
  aiSummary?: NewsSummary;
  items: Array<{
    title: string;
    url: string;
    source: string;
    category: string;
    publishedAt: string;
    points: number;
    summary?: string;
  }>;
  byCategory: Record<
    string,
    Array<{
      title: string;
      url: string;
      source: string;
      publishedAt: string;
      points: number;
      summary?: string;
    }>
  >;
}

export function generateJSON(news: AggregatedNews, aiSummary?: NewsSummary | null): string {
  const totalPoints = news.items.reduce((sum, item) => sum + item.points, 0);
  
  const output: JSONOutput = {
    generatedAt: news.generatedAt.toISOString(),
    totalCount: news.totalCount,
    totalPoints: totalPoints,
    categories: Object.keys(news.byCategory).sort(),
    aiSummary: aiSummary || undefined,
    items: news.items.map((item) => ({
      title: item.title,
      url: item.url,
      source: item.source,
      category: item.category,
      publishedAt: item.publishedAt.toISOString(),
      points: item.points,
      summary: item.summary,
    })),
    byCategory: Object.fromEntries(
      Object.entries(news.byCategory).map(([category, items]) => [
        category,
        items.map((item) => ({
          title: item.title,
          url: item.url,
          source: item.source,
          publishedAt: item.publishedAt.toISOString(),
          points: item.points,
          summary: item.summary,
        })),
      ])
    ),
  };

  return JSON.stringify(output, null, 2);
}
