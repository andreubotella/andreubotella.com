import { serve } from "https://deno.land/std@0.176.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.176.0/http/file_server.ts";

const GITHUB_IO_REDIRECTS = [
  "csswg-auto-build",
  "csswg-drafts",
  "multipart-form-data",
];

serve((req) => {
  const url = new URL(req.url);
  const firstPathComponent = url.pathname.split("/")[1];

  const replaceHost = (host: string) => {
    return new URL(url.pathname + url.search, host);
  };

  // www redirect, etc. We make an exception for localhost, and for
  // preview Deno Deploy deployments.
  if (
    url.hostname !== "localhost" &&
    url.origin !== "https://andreubotella.com" &&
    !/^https:\/\/andreubotella-com-[0-9a-z]+\.deno\.dev$/.test(url.origin)
  ) {
    return Response.redirect(
      replaceHost("https://andreubotella.com"),
    );
  }

  if (GITHUB_IO_REDIRECTS.includes(firstPathComponent)) {
    return Response.redirect(
      replaceHost("https://andreubotella.github.io"),
    );
  }

  // Mastodon webfinger redirect
  if (url.pathname === "/.well-known/webfinger") {
    // We don't use Response.redirect because we need CORS headers.
    return new Response(null, {
      status: 301,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Location": replaceHost("https://mastodon.andreubotella.com").href,
      },
    });
  }

  return serveDir(req, {
    fsRoot: "./out",
    showDirListing: false,
    showDotfiles: false,
    showIndex: true,
    enableCors: true,
  });
});
