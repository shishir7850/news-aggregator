import type { AggregatedNews } from '../aggregator.js';
import type { NewsSummary } from '../summarizer.js';
import { sendEmail } from './email.js';

export interface NotificationConfig {
  outputDir?: string;
}

export async function sendNotifications(
  news: AggregatedNews,
  summary: NewsSummary | null,
  config?: NotificationConfig
): Promise<void> {
  const success = await sendEmail(news, summary);
  console.log(`\nEmail notification: ${success ? '✓ Sent' : '✗ Failed or not configured'}`);
}

export { sendEmail } from './email.js';
