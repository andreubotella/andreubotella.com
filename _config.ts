import lume from "lume/mod.ts";

const site = lume({
  dest: "./out",
  location: new URL("https://andreubotella.com"),
  watcher: {
    ignore: ["./server"],
  },
});

site.copy("static", ".");

export default site;
