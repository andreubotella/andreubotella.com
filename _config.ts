import lume from "lume/mod.ts";
import metas from "lume/plugins/metas.ts";

const site = lume({
  dest: "./_out",
  location: new URL("https://andreubotella.com"),
});

site.use(metas());

site.copy("static", ".");

export default site;
