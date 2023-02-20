import lume from "lume/mod.ts";
import metas from "lume/plugins/metas.ts";

const site = lume({
  dest: "./out",
  location: new URL("https://andreubotella.com"),
  watcher: {
    ignore: ["./server"],
  },
});

site.use(metas());

site.copy("static", ".");

export default site;
