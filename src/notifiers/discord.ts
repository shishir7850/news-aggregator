import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AggregatedNews } from '../aggregator.js';
import type { NewsSummary } from '../summarizer.js';

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  timestamp?: string;
  footer?: { text: string };
}

interface DiscordWebhookPayload {
  content?: string;
  embeds?: DiscordEmbed[];
}

const CATEGORY_EMOJI: Record<string, string> = {
  world: '🌍',
  finance: '💹',
  tech: '💻',
};

const CATEGORY_COLOR: Record<string, number> = {
  world: 0x3498db,
  finance: 0x2ecc71,
  tech: 0x9b59b6,
};

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export async function sendDiscordWithSummary(
  webhookUrl: string,
  news: AggregatedNews,
  summary: NewsSummary | null
): Promise<boolean> {
  if (!webhookUrl) {
    console.log('Discord webhook URL not configured, skipping notification');
    return false;
  }

  try {
    const embeds: DiscordEmbed[] = [];
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Main header embed
    embeds.push({
      title: `📰 Daily News Digest`,
      description: `**${date}**\n${news.totalCount} articles from world, finance & tech`,
      color: 0x5865f2,
    });

    // AI Summary embed (if available) - THIS COMES FIRST
    if (summary) {
      embeds.push({
        title: '🤖 AI Summary',
        color: 0xf1c40f,
        fields: [
          { name: '📋 Overview', value: summary.overview, inline: false },
          { name: '🌍 World', value: summary.world, inline: false },
          { name: '💹 Finance', value: summary.finance, inline: false },
          { name: '💻 Tech', value: summary.tech, inline: false },
        ],
      });

      // Key takeaways as separate embed
      embeds.push({
        title: '💡 Key Takeaways',
        description: summary.keyTakeaways.map((t, i) => `${i + 1}. ${t}`).join('\n'),
        color: 0xe67e22,
      });
    }

    // Articles by category - COMES AFTER SUMMARY
    const categoryOrder = ['world', 'finance', 'tech'];
    for (const category of categoryOrder) {
      const items = news.byCategory[category];
      if (!items || items.length === 0) continue;

      const emoji = CATEGORY_EMOJI[category] || '📰';
      const color = CATEGORY_COLOR[category] || 0x99aab5;
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

      // Clean article list - just numbered titles with links
      const articleList = items.slice(0, 5).map((item, i) => {
        const cleanTitle = item.title.replace(/^[📈📉🏦₿⛽🥇💰]\s*/, '');
        return `**${i + 1}.** [${truncate(cleanTitle, 55)}](${item.url}) — *${item.source}*`;
      }).join('\n');

      embeds.push({
        title: `${emoji} ${categoryName} News`,
        description: articleList,
        color,
      });
    }

    // Footer on last embed
    if (embeds.length > 0) {
      embeds[embeds.length - 1].timestamp = news.generatedAt.toISOString();
      embeds[embeds.length - 1].footer = { text: 'News Aggregator • Updated daily at 6 AM UTC' };
    }

    const payload: DiscordWebhookPayload = {
      embeds,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Discord webhook failed: ${response.status} - ${error}`);
      return false;
    }

    console.log('Discord notification sent successfully');
    return true;
  } catch (error) {
    console.error(`Failed to send Discord notification: ${error}`);
    return false;
  }
}

export function writeDiscordPreview(
  news: AggregatedNews,
  summary: NewsSummary | null,
  outputDir: string
): void {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const lines: string[] = [
    `# 📰 Daily News Digest`,
    `**${date}** • ${news.totalCount} articles`,
    '',
    '---',
    '',
  ];

  // AI Summary first
  if (summary) {
    lines.push('## 🤖 AI Summary');
    lines.push('');
    lines.push(`### 📋 Overview`);
    lines.push(summary.overview);
    lines.push('');
    lines.push(`### 🌍 World`);
    lines.push(summary.world);
    lines.push('');
    lines.push(`### 💹 Finance`);
    lines.push(summary.finance);
    lines.push('');
    lines.push(`### 💻 Tech`);
    lines.push(summary.tech);
    lines.push('');
    lines.push('### 💡 Key Takeaways');
    summary.keyTakeaways.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // Articles by category
  const categoryOrder = ['world', 'finance', 'tech'];
  for (const category of categoryOrder) {
    const items = news.byCategory[category];
    if (!items || items.length === 0) continue;

    const emoji = CATEGORY_EMOJI[category] || '📰';
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

    lines.push(`## ${emoji} ${categoryName} News`);
    lines.push('');

    items.slice(0, 5).forEach((item, i) => {
      const cleanTitle = item.title.replace(/^[📈📉🏦₿⛽🥇💰]\s*/, '');
      lines.push(`**${i + 1}.** [${cleanTitle}](${item.url})`);
      lines.push(`   *Source: ${item.source}*`);
      lines.push('');
    });
  }

  const content = lines.join('\n');
  const filePath = join(outputDir, 'discord-preview.md');
  writeFileSync(filePath, content, 'utf-8');
  console.log(`Discord preview written: ${filePath}`);
}
