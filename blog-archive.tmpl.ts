import type { Page } from "lume/core.ts";
import type { Search } from "lume/plugins/search.ts";

type Slugifier = (string: string) => string;

interface ArchiveData {
  url: string;
  tagFilter?: string;
  results: Page[];
}

type ArchivePage = ArchiveData & { layout?: string };

function* buildPageAndFeeds(data: ArchiveData): Generator<ArchivePage> {
  if (!data.url.endsWith("/")) {
    throw new Error(
      `Archive data has URL ${
        JSON.stringify(data.url)
      }; expected it to end with a slash.`,
    );
  }
  yield data;
  yield {
    ...data,
    url: data.url + "feed.rss",
    layout: "blog-feed.rss.njk",
  };
}

export const layout = "blog-archive.njk";

export default function* (
  { search }: { search: Search },
  { slugify }: { slugify: Slugifier },
): Generator<ArchivePage> {
  const IS_BLOG_QUERY = "blog=true";
  // Sort WIP posts as if they were newer than published posts.
  const DATE_SORT = "published date=desc";

  // Throw if there are any unpublished blogs.
  const unpublished = search.pages(`${IS_BLOG_QUERY} published=false`);
  if (unpublished.length !== 0) {
    throw new Error(
      `Blog ${JSON.stringify(unpublished[0].data.title)} is unpublished`,
    );
  }

  // Build the blog main page.
  yield* buildPageAndFeeds({
    url: "/blog/",
    results: search.pages(IS_BLOG_QUERY, DATE_SORT) as Page[],
  });

  // Map of (slugified) tags to tag names
  const tags = new Map<string, string>();
  for (const tag of search.values("tags", IS_BLOG_QUERY) as string[]) {
    const slugifiedTag = slugify(tag);
    if (tags.has(slugifiedTag)) {
      throw new Error(
        `The tag ${JSON.stringify(tag)} clashes with ${
          JSON.stringify(tags.get(slugifiedTag))
        }.`,
      );
    }
    tags.set(slugifiedTag, tag);
  }

  // Make sure the Igalia tag page exists.
  {
    const tag = "Igalia";
    const slugifiedTag = slugify(tag);
    if (!tags.has(slugifiedTag)) {
      tags.set(slugifiedTag, tag);
    }
  }

  // Build tag pages.
  for (const [tag, tagName] of tags) {
    yield* buildPageAndFeeds({
      url: `/blog/tag/${tag}/`,
      tagFilter: tagName,
      results: search.pages(
        `${IS_BLOG_QUERY} '${tagName}'`,
        DATE_SORT,
      ) as Page[],
    });
  }
}
