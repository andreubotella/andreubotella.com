import lume from "lume/mod.ts";
import metas from "lume/plugins/metas.ts";
import slugifyUrls from "lume/plugins/slugify_urls.ts";
import readingtime from "lume-experimental-plugins/reading_time/mod.ts";
import markdownItConfig from "./_util/markdown-it-config.ts";
import blogAutodescriptor from "./_util/plugins/blog-autodesc.ts";
import capitalize from "./_util/plugins/capitalize.ts";
import plaintextMeta from "./_util/plugins/plaintext-meta.ts";
import date from "./_util/plugins/date.ts";
import inlineHighlight from "./_util/plugins/inline-highlight.ts";

const site = lume({
  dest: "./_out",
  location: new URL("https://andreubotella.com"),
}, {
  markdown: markdownItConfig,
});

site.use(metas())
  .use(date({
    timeZone: "Europe/Madrid",
  }))
  .use(slugifyUrls())
  .use(capitalize())
  .use(inlineHighlight())
  .use(readingtime())
  .use(blogAutodescriptor())
  .use(plaintextMeta());

site.copy("static", ".");

export default site;
