import Prism from "npm:prismjs";

import type { Site } from "lume/core.ts";
import type { Element } from "lume/deps/dom.ts";

function registerInlineHighlight(site: Site) {
  site.process([".md"], (page) => {
    for (const lang of page.document!.querySelectorAll("lang")) {
      const langEl = lang as Element;
      const attributes = langEl.getAttributeNames();
      if (
        attributes.length !== 1 || langEl.getAttribute(attributes[0]) !== ""
      ) {
        throw new Error("Used <lang> with invalid syntax.");
      }

      const language = attributes[0];
      const prismLanguage = Prism.languages[language];
      if (!prismLanguage) {
        throw new Error(`Used <lang> with an unknown language ${language}.`);
      }

      if (langEl.querySelector("pre")) {
        throw new Error("Found a code block inside <lang>.");
      }

      for (const code of langEl.querySelectorAll("code")) {
        const codeEl = code as Element;
        codeEl.setAttribute("class", `highlight language-${language}`);
        codeEl.innerHTML = Prism.highlight(
          codeEl.textContent,
          prismLanguage,
          language,
        );
      }

      langEl.replaceWith(...langEl.childNodes);
    }
  });
}

export default function () {
  return registerInlineHighlight;
}
