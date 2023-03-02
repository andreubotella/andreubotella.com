import { DOMParser } from "lume/deps/dom.ts";

import type { Site } from "lume/core.ts";
import MarkdownIt from "npm:@types/markdown-it";

function mdToPlainText(markdown: string, mdEngine: MarkdownIt): string {
  const html = mdEngine.renderInline(markdown);
  const dom = new DOMParser().parseFromString(html, "text/html");
  return dom!.textContent.trim().replace(/(\s|\n|\r)+/g, " ");
}

function registerPlaintextMeta(site: Site) {
  let mdEngine: MarkdownIt;
  site.hooks.markdownIt((engine: MarkdownIt) => {
    mdEngine = engine;
  });

  site.preprocess([".md"], (page) => {
    if (page.data.title) {
      page.data.title_plaintext = mdToPlainText(page.data.title, mdEngine);
    }
    if (page.data.description) {
      page.data.description_plaintext = mdToPlainText(
        page.data.description,
        mdEngine,
      );
    }
  });
}

export default function () {
  return registerPlaintextMeta;
}
