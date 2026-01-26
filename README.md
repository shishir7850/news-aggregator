# Daily News Aggregator

A TypeScript project that aggregates news from RSS feeds and APIs, runs daily via GitHub Actions, and outputs both Markdown and JSON files.

## Features

- Fetches news from multiple RSS feeds
- Deduplicates articles by URL
- Groups articles by category
- Outputs both Markdown and JSON formats
- Automated daily updates via GitHub Actions
- Discord webhook notifications

## Setup

### Prerequisites

- Node.js 20+
- pnpm

### Installation

```bash
pnpm install
```

### Running Locally

```bash
pnpm start
```

This will generate:
- `output/news.md` - Human-readable Markdown digest
- `output/news.json` - Structured JSON data

## Configuration

Edit `config/sources.json` to customize news sources:

```json
{
  "rss": [
    { "name": "Source Name", "url": "https://example.com/feed", "category": "tech" }
  ],
  "apis": [
    { "name": "HackerNews", "type": "hackernews", "category": "tech", "limit": 10 }
  ]
}
```

### Supported API Types

- `hackernews` - Fetches top stories from HackerNews

## Notifications (Discord)

Set the `DISCORD_WEBHOOK_URL` environment variable or GitHub secret.

To create a Discord webhook:
1. Go to your Discord server settings
2. Navigate to Integrations > Webhooks
3. Create a new webhook and copy the URL

```bash
# Local testing
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
pnpm start
```

## GitHub Actions

The workflow runs daily at 6 AM UTC. You can also trigger it manually from the Actions tab.

The workflow will:
1. Fetch news from all configured sources
2. Generate output files
3. Commit and push changes to the repository

## Project Structure

```
news-aggregator/
├── src/
│   ├── index.ts              # Main entry point
│   ├── sources/
│   │   ├── rss.ts            # RSS feed fetcher
│   │   └── api.ts            # API fetchers
│   ├── aggregator.ts         # Combines news from all sources
│   ├── notifiers/
│   │   ├── index.ts          # Notification orchestrator
│   │   └── discord.ts        # Discord webhook
│   └── output/
│       ├── markdown.ts       # Markdown generator
│       └── json.ts           # JSON generator
├── config/
│   └── sources.json          # News sources configuration
├── output/                   # Generated files
│   ├── news.md
│   └── news.json
├── .github/
│   └── workflows/
│       └── daily-news.yml    # GitHub Actions workflow
├── package.json
└── tsconfig.json
```

## License

MIT
