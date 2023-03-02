import type { Site } from "lume/core.ts";

function registerBlogAutodescriptor(site: Site) {
  site.preprocess([".md"], (page) => {
    if (page.data.blog && !page.data.description) {
      if (typeof page.data.content !== "string") {
        return;
      }

      const lines = page.data.content.split(/\n|\n?\r/g);

      let firstLine: number | undefined;
      let endOfFirstParagraph: number | undefined;
      for (let i = 0; i < lines.length; i++) {
        if (firstLine === undefined) {
          if (lines[i].trim() !== "") {
            firstLine = i;
          }
        } else if (lines[i].trim() === "") {
          endOfFirstParagraph = i;
          break;
        }
      }

      if (firstLine !== undefined) {
        const firstParagraph = lines.slice(firstLine, endOfFirstParagraph).map(
          (line) => line.trim(),
        ).join("\n");
        page.data.description =
          `Autogenerated post description: ${firstParagraph} [...]`;
      }
    }
  });
}

export default function () {
  return registerBlogAutodescriptor;
}
