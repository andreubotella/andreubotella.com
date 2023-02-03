import { serve } from "https://deno.land/std@0.176.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.176.0/http/file_server.ts";

const FORBIDDEN_DIRECTORIES = [
  ".git",
  ".github",
  ".vscode",
  "server",
];

const GITHUB_IO_REDIRECTS = [
  "csswg-auto-build",
  "csswg-drafts",
  "multipart-form-data",
];

serve((req) => {
  const url = new URL(req.url);
  const firstPathComponent = url.pathname.split("/")[1];

  if (FORBIDDEN_DIRECTORIES.includes(firstPathComponent)) {
    return new Response("<h1>Forbidden", {
      status: 403,
      headers: { "Content-Type": "text/html" },
    });
  }

  if (GITHUB_IO_REDIRECTS.includes(firstPathComponent)) {
    const redirect = new URL(
      url.pathname + url.search,
      "https://andreubotella.github.io",
    );
    return Response.redirect(redirect);
  }

  // Mastodon webfinger redirect
  if (url.pathname === "/.well-known/webfinger") {
    const redirect = new URL(
      url.pathname + url.search,
      "https://mastodon.andreubotella.com",
    );
    // We don't use Response.redirect because we need CORS headers.
    return new Response(null, {
      status: 301,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Location": redirect.href,
      },
    });
  }

  return serveDir(req, {
    showDirListing: false,
    showDotfiles: false,
    showIndex: true,
    enableCors: true,
  });
});
