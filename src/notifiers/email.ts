import { createTransport } from 'nodemailer';
import type { AggregatedNews } from '../aggregator.js';
import type { NewsSummary } from '../summarizer.js';

const CATEGORY_EMOJI: Record<string, string> = {
  world: '&#127758;',
  finance: '&#128185;',
  tech: '&#128187;',
  vc: '&#128176;',
};

const CATEGORY_COLOR: Record<string, string> = {
  world: '#3498db',
  finance: '#2ecc71',
  tech: '#9b59b6',
  vc: '#e74c3c',
};

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtmlEmail(news: AggregatedNews, summary: NewsSummary | null): string {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; color: #333; }
  .container { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .header { background: #5865f2; color: #fff; padding: 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; }
  .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
  .section { padding: 20px 24px; border-bottom: 1px solid #eee; }
  .section:last-child { border-bottom: none; }
  .section-title { font-size: 18px; font-weight: 600; margin: 0 0 12px; }
  .summary-block { background: #fffbea; border-left: 4px solid #f1c40f; padding: 12px 16px; margin-bottom: 12px; border-radius: 0 4px 4px 0; }
  .summary-block h3 { margin: 0 0 6px; font-size: 14px; color: #666; }
  .summary-block p { margin: 0; font-size: 14px; line-height: 1.5; }
  .takeaways { background: #fff3e0; border-left: 4px solid #e67e22; padding: 12px 16px; border-radius: 0 4px 4px 0; }
  .takeaways ol { margin: 0; padding-left: 20px; }
  .takeaways li { font-size: 14px; line-height: 1.6; }
  .category-header { padding: 8px 12px; color: #fff; border-radius: 4px; margin-bottom: 12px; font-weight: 600; }
  .article { margin-bottom: 10px; padding-left: 8px; }
  .article a { color: #1a73e8; text-decoration: none; font-weight: 500; font-size: 14px; }
  .article a:hover { text-decoration: underline; }
  .article .source { color: #888; font-size: 12px; font-style: italic; }
  .footer { text-align: center; padding: 16px; font-size: 12px; color: #999; background: #fafafa; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Daily News Digest</h1>
    <p>${escapeHtml(date)} &middot; ${news.totalCount} articles from world, finance, tech &amp; VC</p>
  </div>`;

  // AI Summary
  if (summary) {
    html += `
  <div class="section">
    <div class="section-title">AI Summary</div>
    <div class="summary-block">
      <h3>Overview</h3>
      <p>${escapeHtml(summary.overview)}</p>
    </div>
    <div class="summary-block">
      <h3>World</h3>
      <p>${escapeHtml(summary.world)}</p>
    </div>
    <div class="summary-block">
      <h3>Finance</h3>
      <p>${escapeHtml(summary.finance)}</p>
    </div>
    <div class="summary-block">
      <h3>Tech</h3>
      <p>${escapeHtml(summary.tech)}</p>
    </div>
    <div class="summary-block">
      <h3>Venture Capital</h3>
      <p>${escapeHtml(summary.vc)}</p>
    </div>
    <div class="takeaways">
      <h3 style="margin:0 0 6px;font-size:14px;color:#666;">Key Takeaways</h3>
      <ol>
        ${summary.keyTakeaways.map((t) => `<li>${escapeHtml(t)}</li>`).join('\n        ')}
      </ol>
    </div>
  </div>`;
  }

  // Articles by category
  const categoryOrder = ['world', 'finance', 'tech', 'vc'];
  for (const category of categoryOrder) {
    const items = news.byCategory[category];
    if (!items || items.length === 0) continue;

    const emoji = CATEGORY_EMOJI[category] || '';
    const color = CATEGORY_COLOR[category] || '#99aab5';
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

    html += `
  <div class="section">
    <div class="category-header" style="background:${color};">${emoji} ${categoryName} News</div>`;

    for (const [i, item] of items.slice(0, 5).entries()) {
      const cleanTitle = item.title.replace(/^[📈📉🏦₿⛽🥇💰]\s*/, '');
      html += `
    <div class="article">
      <strong>${i + 1}.</strong> <a href="${escapeHtml(item.url)}">${escapeHtml(truncate(cleanTitle, 80))}</a>
      <span class="source">&mdash; ${escapeHtml(item.source)}</span>
    </div>`;
    }

    html += `
  </div>`;
  }

  html += `
  <div class="footer">
    News Aggregator &middot; Updated daily at 6 AM UTC
  </div>
</div>
</body>
</html>`;

  return html;
}

function buildPlainTextEmail(news: AggregatedNews, summary: NewsSummary | null): string {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const lines: string[] = [
    `DAILY NEWS DIGEST`,
    `${date} - ${news.totalCount} articles`,
    '',
    '='.repeat(50),
    '',
  ];

  if (summary) {
    lines.push('AI SUMMARY', '');
    lines.push(`Overview: ${summary.overview}`, '');
    lines.push(`World: ${summary.world}`, '');
    lines.push(`Finance: ${summary.finance}`, '');
    lines.push(`Tech: ${summary.tech}`, '');
    lines.push(`Venture Capital: ${summary.vc}`, '');
    lines.push('Key Takeaways:');
    summary.keyTakeaways.forEach((t, i) => lines.push(`  ${i + 1}. ${t}`));
    lines.push('', '='.repeat(50), '');
  }

  const categoryOrder = ['world', 'finance', 'tech', 'vc'];
  for (const category of categoryOrder) {
    const items = news.byCategory[category];
    if (!items || items.length === 0) continue;

    const categoryName = category.toUpperCase();
    lines.push(`--- ${categoryName} NEWS ---`, '');

    items.slice(0, 5).forEach((item, i) => {
      const cleanTitle = item.title.replace(/^[📈📉🏦₿⛽🥇💰]\s*/, '');
      lines.push(`  ${i + 1}. ${cleanTitle}`);
      lines.push(`     ${item.url}`);
      lines.push(`     Source: ${item.source}`);
      lines.push('');
    });
  }

  lines.push('---', 'News Aggregator - Updated daily at 6 AM UTC');
  return lines.join('\n');
}

export async function sendEmail(
  news: AggregatedNews,
  summary: NewsSummary | null
): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;
  const to = process.env.EMAIL_TO;

  if (!host || !user || !pass || !from || !to) {
    console.log('Email not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_TO)');
    return false;
  }

  try {
    const transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const subject = `Daily News Digest - ${date} (${news.totalCount} articles)`;

    await transporter.sendMail({
      from,
      to,
      subject,
      text: buildPlainTextEmail(news, summary),
      html: buildHtmlEmail(news, summary),
    });

    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email: ${error}`);
    return false;
  }
}
