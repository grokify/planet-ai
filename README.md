# Signal AI

Aggregated AI and development blog posts, powered by [Signal](https://github.com/grokify/signal).

## Features

- Aggregates RSS/Atom feeds into JSON Feed 1.1 format
- Supports hand-curated priority articles
- Displays HackerNews/Reddit discussion links
- Filter by source, tag, or month
- Dark/light mode support
- Grid and masonry layouts

## Feeds

- [Peter Steinberger](https://steipete.me) - iOS, AI, Apple ecosystem
- [Steve Yegge](https://medium.com/@steve-yegge) - Software engineering, AI
- [Siddhant Khare](https://siddhantkhare.com) - Tech, development
- [Stripe Dev Blog](https://stripe.dev/blog) - Engineering, payments, infrastructure

## Local Development

### Generate feed data

```bash
# Install Signal
go install github.com/grokify/signal/cmd/signal@latest

# Generate JSON feeds with priority articles
signal aggregate \
  --opml feeds.json \
  --priority priority.json \
  --output-dir data \
  --monthly \
  --atom data/atom.xml \
  -v
```

### Run frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Build for production

```bash
cd frontend
npm run build
cp -r ../data dist/data
```

## Deployment

This site is automatically updated hourly via GitHub Actions and deployed to GitHub Pages.

## Output Files

| File | Description |
|------|-------------|
| `data/feeds.json` | Latest 3 months (JSON Feed 1.1) |
| `data/feeds-YYYY-MM.json` | Monthly archives |
| `data/index.json` | Index of monthly files |
| `data/atom.xml` | Atom feed for RSS readers |

## Signal Extensions

Signal adds custom fields to JSON Feed 1.1:

| Field | Description |
|-------|-------------|
| `_signal_feed_title` | Source feed name |
| `_signal_feed_url` | Source feed URL |
| `_signal_priority` | Hand-curated priority article |
| `_signal_rank` | Priority ordering (lower = higher) |
| `_signal_discussions` | Links to HN/Reddit discussions |
| `_signal_generated` | Feed generation timestamp |

## Adding Feeds

Edit `feeds.json` to add or remove feeds:

```json
{
  "outlines": [
    {
      "text": "Blog Name",
      "xmlUrl": "https://example.com/rss.xml",
      "htmlUrl": "https://example.com",
      "categories": ["AI", "Tech"]
    }
  ]
}
```

## Adding Priority Articles

Edit `priority.json` to add hand-curated articles with discussion links:

```json
{
  "links": [
    {
      "title": "Article Title",
      "url": "https://example.com/article",
      "author": "Author Name",
      "date": "2026-02-20T00:00:00Z",
      "tags": ["AI", "Engineering"],
      "summary": "Brief description",
      "rank": 1,
      "discussions": [
        {
          "platform": "hackernews",
          "url": "https://news.ycombinator.com/item?id=12345678",
          "id": "12345678"
        }
      ]
    }
  ]
}
```

## License

MIT
