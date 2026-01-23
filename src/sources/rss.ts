import Parser from 'rss-parser';

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  category: string;
  publishedAt: Date;
  summary?: string;
}

export interface RSSSource {
  name: string;
  url: string;
  category: string;
}

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'NewsAggregator/1.0',
  },
});

export async function fetchRSSFeed(source: RSSSource): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(source.url);

    return (feed.items || []).map((item) => ({
      title: item.title || 'Untitled',
      url: item.link || '',
      source: source.name,
      category: source.category,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      summary: item.contentSnippet?.slice(0, 200) || item.content?.slice(0, 200),
    }));
  } catch (error) {
    console.error(`Failed to fetch RSS feed from ${source.name}: ${error}`);
    return [];
  }
}

export async function fetchAllRSSFeeds(sources: RSSSource[]): Promise<NewsItem[]> {
  const results = await Promise.all(sources.map(fetchRSSFeed));
  return results.flat();
}
