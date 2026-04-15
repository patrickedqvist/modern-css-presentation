import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

const THEME = 'github-dark';

const highlighterPromise = createHighlighterCore({
  themes: [import('@shikijs/themes/github-dark')],
  langs: [
    import('@shikijs/langs/css'),
    import('@shikijs/langs/html'),
    import('@shikijs/langs/javascript'),
    import('@shikijs/langs/typescript'),
    import('@shikijs/langs/json'),
  ],
  engine: createJavaScriptRegexEngine(),
});

class CodeBlock extends HTMLElement {
  static observedAttributes = ['lang'];

  connectedCallback() {
    this.#highlight();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) {
      this.#highlight();
    }
  }

  async #highlight() {
    const lang = this.getAttribute('lang') || 'text';
    const code = this.#extractCode();

    const highlighter = await highlighterPromise;

    if (!highlighter.getLoadedLanguages().includes(lang)) {
      try {
        await highlighter.loadLanguage(lang);
      } catch {
        // Fall back to plaintext if language isn't available
      }
    }

    const html = highlighter.codeToHtml(code, {
      lang: highlighter.getLoadedLanguages().includes(lang) ? lang : 'text',
      theme: THEME,
    });

    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    const root = this.shadowRoot;
    root.adoptedStyleSheets = [stylesheet];

    const container = document.createElement('div');
    container.classList.add('code-block');

    // Shiki returns a <pre> with inline styles for the background/color.
    // We parse it safely via DOMParser to avoid innerHTML on shadow root.
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const pre = parsed.body.firstElementChild;
    if (pre) {
      container.appendChild(document.importNode(pre, true));
    }

    root.replaceChildren(container);
  }

  #extractCode() {
    const script = this.querySelector('script[type="text/plain"]');
    if (script) {
      return dedent(script.textContent || '');
    }
    return dedent(this.textContent || '');
  }
}

function dedent(str) {
  // Strip leading/trailing blank lines
  const lines = str
    .replace(/^\n+/, '')
    .replace(/\n+\s*$/, '')
    .split('\n');
  // Find minimum indentation (ignoring empty lines)
  const indent = lines
    .filter((l) => l.trim().length > 0)
    .reduce((min, l) => {
      const match = l.match(/^(\s*)/);
      return Math.min(min, match ? match[1].length : 0);
    }, Infinity);
  if (!Number.isFinite(indent) || indent === 0) return lines.join('\n');
  return lines.map((l) => l.slice(indent)).join('\n');
}

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(`
  :host {
    display: block;
  }
  .code-block {
    margin: 0;
    border: 1px solid var(--color-code-border, #2d3642);
    border-radius: var(--radius-md, 18px);
    overflow: hidden;
  }
  .code-block pre {
    margin: 0;
    padding: 1.3rem 1.5rem;
    font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
    font-size: clamp(0.9rem, 1.3vw, 1.1rem);
    line-height: 1.6;
    overflow-x: auto;
  }
  .code-block code {
    font-family: inherit;
  }
`);

customElements.define('code-block', CodeBlock);
