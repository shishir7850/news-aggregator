import type { NewsItem } from './rss.js';

export interface APISource {
  name: string;
  type: string;
  category: string;
  limit?: number;
}

interface HNStory {
  id: number;
  title: string;
  url?: string;
  time: number;
  score: number;
  by: string;
}

async function fetchHackerNews(source: APISource): Promise<NewsItem[]> {
  const limit = source.limit || 10;

  try {
    const topStoriesRes = await fetch(
      'https://hacker-news.firebaseio.com/v0/topstories.json'
    );
    const topStoryIds: number[] = await topStoriesRes.json();

    const storyPromises = topStoryIds.slice(0, limit).map(async (id) => {
      const res = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`
      );
      return res.json() as Promise<HNStory>;
    });

    const stories = await Promise.all(storyPromises);

    return stories
      .filter((story) => story && story.url)
      .map((story) => ({
        title: story.title,
        url: story.url!,
        source: source.name,
        category: source.category,
        publishedAt: new Date(story.time * 1000),
        summary: `Score: ${story.score} | By: ${story.by}`,
      }));
  } catch (error) {
    console.error(`Failed to fetch from HackerNews API: ${error}`);
    return [];
  }
}

export async function fetchFromAPI(source: APISource): Promise<NewsItem[]> {
  switch (source.type) {
    case 'hackernews':
      return fetchHackerNews(source);
    default:
      console.warn(`Unknown API type: ${source.type}`);
      return [];
  }
}

export async function fetchAllAPIs(sources: APISource[]): Promise<NewsItem[]> {
  const results = await Promise.all(sources.map(fetchFromAPI));
  return results.flat();
}
