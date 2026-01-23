import type { AggregatedNews } from '../aggregator.js';
import type { NewsSummary } from '../summarizer.js';
import { sendDiscordWithSummary, writeDiscordPreview } from './discord.js';

export interface NotificationConfig {
  discord?: {
    webhookUrl: string;
  };
  outputDir?: string;
}

export async function sendNotifications(
  news: AggregatedNews,
  summary: NewsSummary | null,
  config?: NotificationConfig
): Promise<void> {
  const discordWebhook = config?.discord?.webhookUrl || process.env.DISCORD_WEBHOOK_URL;

  if (discordWebhook) {
    const success = await sendDiscordWithSummary(discordWebhook, news, summary);
    console.log(`\nDiscord notification: ${success ? '✓ Sent' : '✗ Failed'}`);
  } else if (config?.outputDir) {
    writeDiscordPreview(news, summary, config.outputDir);
  } else {
    console.log('\nDiscord webhook not configured (set DISCORD_WEBHOOK_URL to enable)');
  }
}

export { sendDiscordWithSummary, writeDiscordPreview } from './discord.js';
