# CSS Presentation Deck

A slide deck built with native CSS scroll snapping. Use arrow down/up moves between sections, arrow left/right moves deeper within a section. Fullscreen is available too.

## Quick start

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

## How the deck works

The deck is a single `index.html` file. Slides are grouped into **rows** (major sections). Each row can contain one or more **slides**.

```
<main class="deck js-deck">
  <div class="deck-row js-deck-row">        ← vertical snap unit
    <section class="slide js-slide">        ← horizontal snap unit
    <section class="slide js-slide">
  </div>
  <div class="deck-row js-deck-row">
    <section class="slide js-slide">
  </div>
</main>
```

- **↓ / ↑** moves between rows (sections)
- **← / →** moves between slides within a row
- **Home / End** jumps to first / last section
- The nav bar at the bottom links to section intros

The scroll snapping is CSS-native (`scroll-snap-type: y mandatory` on the deck, `x mandatory` on each row). The JS just coordinates keyboard events, active-slide tracking, and URL hash updates.

## Adding or editing slides

### 1. Pick a template

Copy one of the HTML snippets from `templates/`:

| Template | Use for |
|----------|---------|
| `row.html` | Wrapper for a new section. Add `deck-row--multi` class if it contains more than one slide. |
| `slide-title.html` | Opening / cover slide with a large title and aside panel. |
| `slide-section.html` | Section divider — typically the first slide in each row. |
| `slide-two-col.html` | Prose on the left, bullet panel on the right. |
| `slide-code.html` | Code block on the left, annotation panel on the right. |
| `slide-compare.html` | Two side-by-side cards for contrasting concepts. |
| `slide-takeaway.html` | A single bold statement with supporting text. |
| `slide-qa.html` | Closing / Q&A slide. |

### 2. Paste into `index.html`

Place the slide inside a `deck-row` wrapper in `<main>`. Each template has `SLIDE_ID` placeholders — replace them with a unique id (used for hash navigation).

### 3. Set the accent colour

Each slide has a `data-accent` attribute. Options: `blue`, `green`, `purple`, `warning`, `danger`.

### 4. Update the nav bar (if adding a new section)

Add a link inside `<nav class="deck-nav">`:

```html
<a href="#your-section-intro-id" data-row="N">Label</a>
```

`data-row` is the zero-based row index — it controls which nav link highlights as active.

## File structure

```
index.html              ← the deck
assets/
  css/theme.css         ← all styles (deck mechanics + visual theme)
  js/main.js            ← keyboard nav, active tracking, hash updates
  js/code-block.js      ← <code-block> web component (Shiki syntax highlighting)
templates/              ← copy-paste slide blueprints
presentation.md         ← talk manuscript / speaker notes
```

## Code blocks

Code slides use a `<code-block>` web component powered by [Shiki](https://shiki.style/) with the `github-dark` theme. Wrap your code in a `<script type="text/plain">` to avoid HTML escaping:

```html
<code-block lang="css"><script type="text/plain">
.card:has(.badge--urgent) {
  border-color: var(--color-danger);
}
</script></code-block>
```

The `<script type="text/plain">` tag tells the browser to treat the content as raw text — no HTML parsing, so angle brackets and ampersands work without escaping. Supported languages: `css`, `html`, `javascript`, `typescript`, `json`, `text`.

## Building for production

```bash
npm run build
```

Output goes to `dist/`. It's static HTML/CSS/JS — host anywhere.
