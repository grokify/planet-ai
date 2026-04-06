# CLAUDE.md

Project-specific instructions for Claude Code.

## Project Overview

**Planet AI** is a feed aggregator site tracking AI and development blogs. It uses [Signal](https://github.com/grokify/signal) CLI to aggregate RSS/Atom feeds into JSON Feed format, with a React frontend for browsing.

- **Live site**: https://grokify.github.io/planet-ai/
- **Generator**: Signal CLI
- **Frontend**: React + Vite

## Project Structure

```
planet-ai/
├── feeds.json          # OPML feed sources (JSON format)
├── priority.json       # Hand-curated priority articles
├── data/               # Generated feed data (JSON Feed 1.1)
├── frontend/           # React + Vite application
│   ├── src/App.jsx     # Main React component
│   └── public/data     # Symlink to ../data for dev server
└── .github/workflows/  # CI/CD (runs every 6 hours)
```

## Local Development

### Prerequisites

- Node.js 20+
- Signal CLI: `go install github.com/grokify/signal/cmd/signal@latest`

### Run Locally

```bash
# Ensure data symlink exists for dev server
ln -sf ../../data frontend/public/data

# Start Vite dev server
cd frontend && npm run dev
```

Opens at http://localhost:5173 (or next available port).

### Pull Fresh Feeds

```bash
signal aggregate \
  --opml feeds.json \
  --priority priority.json \
  --output-dir data \
  --monthly \
  --latest-months 24 \
  --title "Planet AI" \
  -v
```

## Adding Content

### Add a Feed Source

Edit `feeds.json` to add a new feed:

```json
{
  "text": "Author Name",
  "title": "Author Name",
  "type": "rss",
  "xmlUrl": "https://example.com/feed.xml",
  "htmlUrl": "https://example.com",
  "description": "Brief description",
  "categories": ["AI", "Development"]
}
```

### Add a Priority Article

Edit `priority.json` to add a curated article:

```json
{
  "title": "Article Title",
  "url": "https://example.com/article",
  "author": "Author Name",
  "date": "2026-04-01T00:00:00Z",
  "tags": ["AI", "Topic"],
  "summary": "Brief summary of the article.",
  "rank": 1,
  "feedTitle": "Source Name",
  "feedUrl": "https://example.com",
  "discussions": [
    {
      "platform": "hackernews",
      "url": "https://news.ycombinator.com/item?id=12345",
      "id": "12345",
      "score": 100
    },
    {
      "platform": "frontierpulse",
      "url": "https://grokify.github.io/frontierpulse/articles/..."
    }
  ]
}
```

Supported discussion platforms: `hackernews`, `reddit`, `lobsters`, `frontierpulse`.

## Deployment

Push to `main` triggers GitHub Actions which:

1. Installs Signal CLI
2. Fetches fresh feeds
3. Builds React frontend
4. Deploys to GitHub Pages

Manual trigger: GitHub Actions → "Update Feeds & Deploy" → "Run workflow"

## Related Projects

- [Signal](https://github.com/grokify/signal) - Feed aggregation CLI
- [Frontier Pulse](https://github.com/grokify/frontierpulse) - Discussion analysis site (linked in priority articles)
