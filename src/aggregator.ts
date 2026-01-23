import { fetchAllRSSFeeds, type NewsItem, type RSSSource } from './sources/rss.js';
import { fetchAllAPIs, type APISource } from './sources/api.js';
import { filterEnglishContent } from './utils/language.js';
import { simplifyFinanceSummary, getFinanceEmoji } from './utils/finance.js';

export interface SourcesConfig {
  rss: RSSSource[];
  apis: APISource[];
}

export interface AggregatedNews {
  items: NewsItem[];
  byCategory: Record<string, NewsItem[]>;
  generatedAt: Date;
  totalCount: number;
}

function deduplicateByUrl(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const normalized = item.url.toLowerCase().replace(/\/$/, '');
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

function sortByDate(items: NewsItem[]): NewsItem[] {
  return [...items].sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  );
}

function groupByCategory(items: NewsItem[]): Record<string, NewsItem[]> {
  return items.reduce(
    (acc, item) => {
      const category = item.category || 'uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, NewsItem[]>
  );
}

export async function aggregateNews(config: SourcesConfig): Promise<AggregatedNews> {
  console.log('Fetching news from all sources...');

  const [rssItems, apiItems] = await Promise.all([
    fetchAllRSSFeeds(config.rss || []),
    fetchAllAPIs(config.apis || []),
  ]);

  console.log(`Fetched ${rssItems.length} items from RSS feeds`);
  console.log(`Fetched ${apiItems.length} items from APIs`);

  const allItems = [...rssItems, ...apiItems];

  // Filter to English content only
  const englishOnly = filterEnglishContent(allItems);
  console.log(`English content: ${englishOnly.length} (filtered ${allItems.length - englishOnly.length} non-English)`);

  // Simplify finance news summaries
  const processed = englishOnly.map((item) => {
    if (item.category === 'finance') {
      return {
        ...item,
        title: `${getFinanceEmoji(item.title)} ${item.title}`,
        summary: item.summary ? simplifyFinanceSummary(item.summary) : undefined,
      };
    }
    return item;
  });

  const deduplicated = deduplicateByUrl(processed);
  const sorted = sortByDate(deduplicated);

  // Limit to 100 articles max
  const limited = sorted.slice(0, 100);
  console.log(`Total unique items: ${limited.length} (limited from ${sorted.length})`);

  return {
    items: limited,
    byCategory: groupByCategory(limited),
    generatedAt: new Date(),
    totalCount: limited.length,
  };
}
