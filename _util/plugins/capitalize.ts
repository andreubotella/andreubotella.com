import type { Site } from "lume/core.ts";

// Adds a "capitalize" filter, similar to the one built into Nunjucks, except
// that this one capitalizes the first (non-space) letter of the given string,
// _without lowercasing the rest_. This is important for the "WinterCG" tag,
// for example.
export default function () {
  return (site: Site) => {
    site.filter("capitalize", capitalize);
  };
}

function capitalize(string: string): string {
  const match = string.match(/\S/);
  if (match) {
    const upper = match[0].toUpperCase();
    return string.slice(0, match.index) + upper +
      string.slice(match.index! + match[0].length);
  }
  return string;
}
