import Prism from "npm:prismjs";
import { DOMParser, type Element } from "lume/deps/dom.ts";

// Syntax highlighting
export function highlight(code: string, language: string): string {
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
