import { useState, useEffect, useMemo } from 'react'
import Masonry from 'react-masonry-css'

// Color palette for feed sources - distinct, high-contrast colors (light enough for dark bg)
const FEED_COLORS = [
  '#ff6b6b', // red
  '#4ecdc4', // teal
  '#ffe66d', // yellow
  '#c084fc', // purple (lighter)
  '#ff9f43', // orange
  '#60a5fa', // blue
  '#a78bfa', // violet (lighter)
  '#22d3ee', // cyan
  '#f472b6', // pink
  '#34d399', // emerald
  '#fb923c', // amber
  '#2dd4bf', // teal light
]

// Hash a string to get a consistent index
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// Truncate HTML summary to a maximum length, preserving word boundaries
const MAX_SUMMARY_LENGTH = 500
function truncateSummary(html) {
  if (!html || html.length <= MAX_SUMMARY_LENGTH) return html
  // Strip HTML tags for length calculation
  const text = html.replace(/<[^>]*>/g, '')
  if (text.length <= MAX_SUMMARY_LENGTH) return html
  // Find last space before cutoff to preserve word boundary
  const truncated = text.slice(0, MAX_SUMMARY_LENGTH)
  const lastSpace = truncated.lastIndexOf(' ')
  const cutPoint = lastSpace > MAX_SUMMARY_LENGTH * 0.8 ? lastSpace : MAX_SUMMARY_LENGTH
  return text.slice(0, cutPoint) + '…'
}

function App() {
  const [feed, setFeed] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSources, setSelectedSources] = useState([])  // empty = all
  const [selectedTags, setSelectedTags] = useState([])  // empty = all
  const [selectedMonths, setSelectedMonths] = useState([])  // empty = all
  const [showAllMonths, setShowAllMonths] = useState(false)
  const [layout, setLayout] = useState(() => localStorage.getItem('layout') || 'grid')

  // Persist layout preference
  const toggleLayout = () => {
    const newLayout = layout === 'grid' ? 'masonry' : 'grid'
    setLayout(newLayout)
    localStorage.setItem('layout', newLayout)
  }

  // Toggle a source in the selection
  const toggleSource = (source) => {
    setSelectedSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    )
  }

  // Toggle a tag in the selection
  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  // Toggle a month in the selection
  const toggleMonth = (month) => {
    setSelectedMonths(prev =>
      prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month]
    )
  }

  useEffect(() => {
    fetch('./data/feeds.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load feed')
        return res.json()
      })
      .then(data => {
        setFeed(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Must call all hooks before any early returns
  const items = feed?.items || []
  const feeds = [...new Set(items.map(item => item._signal_feed_title).filter(Boolean))]

  // Extract all unique tags, sorted by frequency
  const tagCounts = useMemo(() => {
    const counts = {}
    items.forEach(item => {
      (item.tags || []).forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1
      })
    })
    return counts
  }, [items])

  const tags = useMemo(() => {
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])  // Sort by count descending
      .map(([tag]) => tag)
  }, [tagCounts])

  // Extract all unique months, sorted by date descending
  const monthCounts = useMemo(() => {
    const counts = {}
    items.forEach(item => {
      if (item.date_published) {
        const date = new Date(item.date_published)
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        counts[month] = (counts[month] || 0) + 1
      }
    })
    return counts
  }, [items])

  const months = useMemo(() => {
    return Object.keys(monthCounts).sort((a, b) => b.localeCompare(a))  // Sort descending (newest first)
  }, [monthCounts])

  // Format month for display (e.g., "2026-02" -> "Feb 2026")
  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(year, parseInt(month) - 1)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Get item's month string
  const getItemMonth = (item) => {
    if (!item.date_published) return null
    const date = new Date(item.date_published)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  const feedColors = useMemo(() => {
    const colors = {}
    feeds.forEach(f => {
      colors[f] = FEED_COLORS[hashString(f) % FEED_COLORS.length]
    })
    return colors
  }, [feeds.join(',')])  // Use string join for stable dependency

  const tagColors = useMemo(() => {
    const colors = {}
    tags.forEach(t => {
      colors[t] = FEED_COLORS[hashString(t + 'tag') % FEED_COLORS.length]
    })
    return colors
  }, [tags.join(',')])

  // Filter items by source, tag, and/or month - must be before early returns
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSource = selectedSources.length === 0 || selectedSources.includes(item._signal_feed_title)
      const matchesTag = selectedTags.length === 0 || (item.tags || []).some(t => selectedTags.includes(t))
      const matchesMonth = selectedMonths.length === 0 || selectedMonths.includes(getItemMonth(item))
      return matchesSource && matchesTag && matchesMonth
    })
  }, [items, selectedSources, selectedTags, selectedMonths])

  if (loading) {
    return (
      <div className="container">
        <header>
          <h1>Planet AI</h1>
        </header>
        <main>
          <p className="loading">Loading feeds...</p>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <header>
          <h1>Planet AI</h1>
        </header>
        <main>
          <p className="error">Error: {error}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="container">
      <header>
        <h1>Planet AI</h1>
        <p className="subtitle">Aggregated AI & Development Blog Posts · Curated by John Wang</p>

        <div className="filter-section">
          <span className="filter-label">Sources:</span>
          <nav className="feeds">
            <button
              className={selectedSources.length === 0 ? 'active' : ''}
              onClick={() => setSelectedSources([])}
            >
              All ({items.length})
            </button>
            {feeds.map(f => (
              <button
                key={f}
                className={selectedSources.includes(f) ? 'active' : ''}
                onClick={() => toggleSource(f)}
                style={{
                  '--feed-color': feedColors[f],
                  borderColor: feedColors[f],
                  color: selectedSources.includes(f) ? '#fff' : feedColors[f],
                  backgroundColor: selectedSources.includes(f) ? feedColors[f] : 'transparent'
                }}
              >
                {f} ({items.filter(i => i._signal_feed_title === f).length})
              </button>
            ))}
            {selectedSources.length > 0 && (
              <button
                className="clear-btn"
                onClick={() => setSelectedSources([])}
              >
                None
              </button>
            )}
          </nav>
        </div>

        <div className="filter-section">
          <span className="filter-label">Tags:</span>
          <nav className="tags-filter">
            <button
              className={selectedTags.length === 0 ? 'active' : ''}
              onClick={() => setSelectedTags([])}
            >
              All
            </button>
            {tags.slice(0, 15).map(t => (
              <button
                key={t}
                className={selectedTags.includes(t) ? 'active' : ''}
                onClick={() => toggleTag(t)}
                style={{
                  '--tag-color': tagColors[t],
                  borderColor: tagColors[t],
                  color: selectedTags.includes(t) ? '#fff' : tagColors[t],
                  backgroundColor: selectedTags.includes(t) ? tagColors[t] : 'transparent'
                }}
              >
                {t} ({tagCounts[t]})
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                className="clear-btn"
                onClick={() => setSelectedTags([])}
              >
                None
              </button>
            )}
          </nav>
        </div>

        <div className="filter-section">
          <span className="filter-label">Months:</span>
          <nav className="months-filter">
            <button
              className={selectedMonths.length === 0 ? 'active' : ''}
              onClick={() => setSelectedMonths([])}
            >
              All
            </button>
            {(showAllMonths ? months : months.slice(0, 6)).map(m => (
              <button
                key={m}
                className={selectedMonths.includes(m) ? 'active' : ''}
                onClick={() => toggleMonth(m)}
              >
                {formatMonth(m)} ({monthCounts[m]})
              </button>
            ))}
            {months.length > 6 && (
              <button
                className="more-btn"
                onClick={() => setShowAllMonths(!showAllMonths)}
              >
                {showAllMonths ? 'Less' : `+${months.length - 6} more`}
              </button>
            )}
            {selectedMonths.length > 0 && (
              <button
                className="clear-btn"
                onClick={() => setSelectedMonths([])}
              >
                None
              </button>
            )}
          </nav>
        </div>

        {(selectedSources.length > 0 || selectedTags.length > 0 || selectedMonths.length > 0) && (
          <div className="active-filters">
            <span>Showing {filteredItems.length} articles</span>
            {selectedSources.map(source => (
              <span key={source} className="filter-chip" style={{ backgroundColor: feedColors[source] }}>
                {source}
                <button onClick={() => toggleSource(source)}>×</button>
              </span>
            ))}
            {selectedTags.map(tag => (
              <span key={tag} className="filter-chip" style={{ backgroundColor: tagColors[tag] }}>
                {tag}
                <button onClick={() => toggleTag(tag)}>×</button>
              </span>
            ))}
            {selectedMonths.map(month => (
              <span key={month} className="filter-chip month-chip">
                {formatMonth(month)}
                <button onClick={() => toggleMonth(month)}>×</button>
              </span>
            ))}
            <button className="clear-all" onClick={() => { setSelectedSources([]); setSelectedTags([]); setSelectedMonths([]); }}>
              Clear all
            </button>
          </div>
        )}

        <div className="meta">
          <a href="./data/atom.xml" className="feed-link">Atom Feed</a>
          <span className="separator">·</span>
          <a href="./data/feeds.json" className="feed-link">JSON Feed</a>
          <span className="separator">·</span>
          <button className="layout-toggle" onClick={toggleLayout} title={`Switch to ${layout === 'grid' ? 'masonry' : 'grid'} layout`}>
            {layout === 'grid' ? '⊞ Grid' : '⧉ Masonry'}
          </button>
        </div>
      </header>

      {layout === 'masonry' ? (
        <Masonry
          breakpointCols={{ default: 4, 1400: 4, 1000: 3, 700: 2, 500: 1 }}
          className="masonry-grid"
          columnClassName="masonry-column"
        >
          {filteredItems.map(item => {
            const color = feedColors[item._signal_feed_title] || FEED_COLORS[0]
            return (
            <article key={item.id} className={item._signal_priority ? 'priority' : ''}>
              <h2>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color }}
                >
                  {item.title}
                </a>
              </h2>
              <div className="meta">
                <span className="source" style={{ color }}>{item._signal_feed_title}</span>
                <span className="separator">·</span>
                <time dateTime={item.date_published}>
                  {new Date(item.date_published).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </time>
                {item.authors?.[0]?.name && (
                  <>
                    <span className="separator">·</span>
                    <span className="author">{item.authors[0].name}</span>
                  </>
                )}
              </div>
              {item.image && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="image-link">
                  <img src={item.image} alt={item.title} className="entry-image" />
                </a>
              )}
              {item.summary && (
                <p className="summary" dangerouslySetInnerHTML={{ __html: truncateSummary(item.summary) }} />
              )}
              {item.tags?.length > 0 && (
                <div className="tags">
                  {item.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              )}
              {item._signal_discussions?.length > 0 && (
                <div className="discussions">
                  <span className="discuss-label">Discuss:</span>
                  {item._signal_discussions.map((d, idx) => (
                    <a
                      key={idx}
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`discuss-link discuss-${d.platform}`}
                      title={`${d.score ? d.score + ' points' : ''}${d.score && d.comments ? ', ' : ''}${d.comments ? d.comments + ' comments' : ''}`}
                    >
                      {d.platform === 'hackernews' && 'HN'}
                      {d.platform === 'reddit' && 'Reddit'}
                      {d.platform === 'lobsters' && 'Lobsters'}
                      {!['hackernews', 'reddit', 'lobsters'].includes(d.platform) && d.platform}
                      {(d.score || d.comments) && (
                        <span className="discuss-meta">
                          {d.score ? `${d.score}↑` : ''}{d.score && d.comments ? ' ' : ''}{d.comments ? `${d.comments}💬` : ''}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </article>
            )
          })}
        </Masonry>
      ) : (
        <main className="grid">
          {filteredItems.map(item => {
            const color = feedColors[item._signal_feed_title] || FEED_COLORS[0]
            return (
            <article key={item.id} className={item._signal_priority ? 'priority' : ''}>
              <h2>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color }}
                >
                  {item.title}
                </a>
              </h2>
              <div className="meta">
                <span className="source" style={{ color }}>{item._signal_feed_title}</span>
                <span className="separator">·</span>
                <time dateTime={item.date_published}>
                  {new Date(item.date_published).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </time>
                {item.authors?.[0]?.name && (
                  <>
                    <span className="separator">·</span>
                    <span className="author">{item.authors[0].name}</span>
                  </>
                )}
              </div>
              {item.image && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="image-link">
                  <img src={item.image} alt={item.title} className="entry-image" />
                </a>
              )}
              {item.summary && (
                <p className="summary" dangerouslySetInnerHTML={{ __html: truncateSummary(item.summary) }} />
              )}
              {item.tags?.length > 0 && (
                <div className="tags">
                  {item.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              )}
              {item._signal_discussions?.length > 0 && (
                <div className="discussions">
                  <span className="discuss-label">Discuss:</span>
                  {item._signal_discussions.map((d, idx) => (
                    <a
                      key={idx}
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`discuss-link discuss-${d.platform}`}
                      title={`${d.score ? d.score + ' points' : ''}${d.score && d.comments ? ', ' : ''}${d.comments ? d.comments + ' comments' : ''}`}
                    >
                      {d.platform === 'hackernews' && 'HN'}
                      {d.platform === 'reddit' && 'Reddit'}
                      {d.platform === 'lobsters' && 'Lobsters'}
                      {!['hackernews', 'reddit', 'lobsters'].includes(d.platform) && d.platform}
                      {(d.score || d.comments) && (
                        <span className="discuss-meta">
                          {d.score ? `${d.score}↑` : ''}{d.score && d.comments ? ' ' : ''}{d.comments ? `${d.comments}💬` : ''}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </article>
            )
          })}
        </main>
      )}

      <footer>
        <p>
          Generated {feed._signal_generated ? new Date(feed._signal_generated).toLocaleString() : 'recently'}
          {' · '}
          Powered by <a href="https://github.com/grokify/signal">Signal</a>
        </p>
      </footer>
    </div>
  )
}

export default App
