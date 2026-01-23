import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aggregateNews, type SourcesConfig } from './aggregator.js';
import { generateMarkdown } from './output/markdown.js';
import { generateJSON } from './output/json.js';
import { sendNotifications } from './notifiers/index.js';
import { generateAISummary, formatSummaryMarkdown } from './summarizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function main() {
  console.log('Starting news aggregation...\n');

  const configPath = join(rootDir, 'config', 'sources.json');
  const config: SourcesConfig = JSON.parse(readFileSync(configPath, 'utf-8'));

  console.log(`Loaded ${config.rss?.length || 0} RSS sources`);
  console.log(`Loaded ${config.apis?.length || 0} API sources\n`);

  const news = await aggregateNews(config);

  // Generate AI summary
  const aiSummary = await generateAISummary(news);

  const outputDir = join(rootDir, 'output');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Generate markdown with AI summary at the top
  let markdown = generateMarkdown(news);
  if (aiSummary) {
    const summarySection = formatSummaryMarkdown(aiSummary);
    // Insert AI summary after the header
    const headerEnd = markdown.indexOf('---') + 3;
    markdown = markdown.slice(0, headerEnd) + '\n\n' + summarySection + '\n' + markdown.slice(headerEnd);
  }

  const markdownPath = join(outputDir, 'news.md');
  writeFileSync(markdownPath, markdown, 'utf-8');
  console.log(`\nWritten: ${markdownPath}`);

  // Generate JSON with AI summary
  const json = generateJSON(news, aiSummary);
  const jsonPath = join(outputDir, 'news.json');
  writeFileSync(jsonPath, json, 'utf-8');
  console.log(`Written: ${jsonPath}`);

  // Send notifications (writes preview file if no webhook configured)
  await sendNotifications(news, aiSummary, { outputDir });

  console.log('\nNews aggregation complete!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
