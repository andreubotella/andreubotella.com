import lume from "lume/mod.ts";
import metas from "lume/plugins/metas.ts";
import date from "lume/plugins/date.ts";
import slugifyUrls from "lume/plugins/slugify_urls.ts";
import readingtime from "lume-experimental-plugins/reading_time/mod.ts";
import markdownItConfig from "./_util/markdown-it-config.ts";
import blogAutodescriptor from "./_util/plugins/blog-autodesc.ts";
import capitalize from "./_util/plugins/capitalize.ts";
import plaintextMeta from "./_util/plugins/plaintext-meta.ts";

const site = lume({
  dest: "./_out",
  location: new URL("https://andreubotella.com"),
}, {
  markdown: markdownItConfig,
});

site.use(metas())
  .use(date())
  .use(slugifyUrls())
  .use(capitalize())
  .use(readingtime())
  .use(blogAutodescriptor())
  .use(plaintextMeta());

site.copy("static", ".");

export default site;
