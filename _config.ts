import lume from "lume/mod.ts";
import metas from "lume/plugins/metas.ts";
import date from "lume/plugins/date.ts";
import slugifyUrls from "lume/plugins/slugify_urls.ts";
import readingtime from "lume-experimental-plugins/reading_time/mod.ts";
import { highlight as markdownHighlight } from "./_util/markdown-it-config.ts";

const site = lume({
  dest: "./_out",
  location: new URL("https://andreubotella.com"),
}, {
  markdown: {
    options: {
      typographer: true,
      highlight: markdownHighlight,
    },
  },
});

site.use(metas())
  .use(date())
  .use(slugifyUrls())
  .use(readingtime());

site.copy("static", ".");

export default site;
