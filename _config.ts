import lume from "lume/mod.ts";
import metas from "lume/plugins/metas.ts";
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

site.use(metas());

site.copy("static", ".");

export default site;
