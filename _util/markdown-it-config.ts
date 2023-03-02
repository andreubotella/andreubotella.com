import markdownItFootnote from "npm:markdown-it-footnote";
import Prism from "npm:prismjs";
import { DOMParser, type Element } from "lume/deps/dom.ts";

import type Renderer from "npm:@types/markdown-it/lib/renderer.d.ts";
import type { Options } from "lume/plugins/markdown.ts";

// Syntax highlighting
function highlight(code: string, language: string): string {
  if (language === "") {
    language = "plaintext";
  }
  const highlight = Prism.highlight(
    code,
    Prism.languages[language],
    language,
  );

  const document = new DOMParser().parseFromString(
    // The pre needs class "highlight" because Firefox doesn't yet support
    // :has selectors.
    `<pre class="highlight"><code class="language-${language}">${highlight}`,
    "text/html",
  )!;

  // Remove elements with the title attribute (which represent HTML entities).
  for (const elementWithTitle of document.querySelectorAll("[title]")) {
    (elementWithTitle as Element).removeAttribute("title");
  }

  return document.body.innerHTML;
}

// Overrides for footnote HTML serialization.
const rules: Renderer.RenderRuleRecord = {
  footnote_ref: (tokens, idx, options, env, slf) => {
    const id = slf.rules.footnote_anchor_name!(tokens, idx, options, env, slf);
    const caption = slf.rules.footnote_caption!(tokens, idx, options, env, slf);
    let refid = id;

    if (tokens[idx].meta.subId > 0) {
      refid += ":" + tokens[idx].meta.subId;
    }

    return `<a class="footnote-ref" aria-label="Go to footnote ${id}" href="#fn${id}" id="fnref${refid}">${caption}</a></sup>`;
  },
  footnote_block_open: () => {
    return `<aside class="footnotes">\n` +
      `<h2 id="footnote-label">Footnotes</h2>\n` +
      `<ol class="footnotes-list">\n`;
  },
  footnote_block_close: () => `</ol>\n</aside>\n`,
  footnote_anchor: (tokens, idx, options, env, slf) => {
    let id = slf.rules.footnote_anchor_name!(tokens, idx, options, env, slf);

    if (tokens[idx].meta.subId > 0) {
      id += ":" + tokens[idx].meta.subId;
    }

    // ↩ with escape code to prevent display as Apple Emoji on iOS
    return ` <a class="footnote-backref" href="#fnref${id}" aria-label="Back to content">\u21a9\uFE0E</a>`;
  },
};

export default {
  plugins: [markdownItFootnote],
  rules,
  options: {
    typographer: true,
    highlight,
  },
} as Partial<Options>;
