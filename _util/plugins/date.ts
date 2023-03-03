import { format, utcToZonedTime } from "npm:date-fns-tz@2.0.0";
import { merge } from "lume/core/utils.ts";

import type { Locale } from "lume/deps/date.ts";
import type { Helper, Site } from "lume/core.ts";

export interface Options {
  /** The name of the helper */
  name: string;

  /** The loaded locales */
  locales: Record<string, Locale>;

  /** Custom date formats */
  formats: Record<string, string>;

  timeZone?: string;
}

// Default options
export const defaults: Options = {
  name: "date",
  locales: {},
  formats: {
    ATOM: "yyyy-MM-dd'T'HH:mm:ssXXX",
    DATE: "yyyy-MM-dd",
    DATETIME: "yyyy-MM-dd HH:mm:ss",
    TIME: "HH:mm:ss",
    HUMAN_DATE: "PPP",
    HUMAN_DATETIME: "PPPppp",
  },
};

/** A plugin to format Date values.
 *
 * This is a modification of the official Lume date plugin
 * (https://lume.land/plugins/date/), except it adds support for formatting
 * dates in a timezone other than the system's default, which can be configured
 * with a plugin option.
 */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const defaultLocale = Object.keys(options.locales).shift();

    site.filter(options.name, filter as Helper);

    function filter(
      date: string | Date,
      pattern = "DATE",
      lang = defaultLocale,
    ) {
      if (!date) {
        return;
      }

      if (date === "now") {
        date = new Date();
      } else if (!(date instanceof Date)) {
        date = new Date(date);
      }

      const patt = options.formats[pattern] || pattern;
      const locale = lang ? options.locales[lang] : undefined;

      // `utcToZonedTime` doesn't make any sense, because Date objects in JS
      // don't have a timezone associated (other than the current one), but it's
      // what date-fns-tz forces us to use.
      const tzDate = options.timeZone
        ? utcToZonedTime(date.valueOf(), options.timeZone)
        : date;
      return format(tzDate, patt, { locale, timeZone: options.timeZone });
    }
  };
}
