/**
 * We Work Remotely — public per-category RSS feed. robots.txt allows "/"
 * broadly with no disallow on RSS/category paths; RSS is an intentionally
 * public syndication format. We parse it with a small regex-based reader
 * rather than pulling in a full XML parser dependency for one simple,
 * consistent feed shape.
 */

import { htmlToPlainText } from "@/lib/opportunities/html-to-text";
import type { RawOpportunity } from "@/lib/opportunities/types";
import { fetchText } from "./http";
import type { FetchContext, OpportunitySource } from "./types";

const FEED_URL = "https://weworkremotely.com/categories/remote-design-jobs.rss";

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&mdash;|&ndash;/g, "-")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    // Normalize literal em/en dashes too, e.g. in titles or region text.
    .replace(/[—–]/g, "-");
}

function extractTag(item: string, tag: string): string | null {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? decodeEntities(match[1]).trim() : null;
}

function parseFeed(xml: string): RawOpportunity[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  return items
    .map((item): RawOpportunity | null => {
      const rawTitle = extractTag(item, "title");
      if (!rawTitle) return null;

      const [companyPart, ...titleParts] = rawTitle.split(": ");
      const title = titleParts.length > 0 ? titleParts.join(": ") : rawTitle;
      const company = titleParts.length > 0 ? companyPart : "Unknown";

      const link = extractTag(item, "link") ?? "";
      const region = extractTag(item, "region");
      const country = extractTag(item, "country");
      const type = extractTag(item, "type");
      const pubDate = extractTag(item, "pubDate");
      const descriptionHtml = extractTag(item, "description") ?? "";
      const companyUrlMatch = descriptionHtml.match(/URL:<\/strong>\s*<a href="([^"]+)"/);

      const locationText = [region, country].filter(Boolean).join(" ").trim() || null;

      return {
        sourceId: "weworkremotely",
        sourceItemId: link || null,
        title,
        company,
        companyUrl: companyUrlMatch?.[1] ?? null,
        description: htmlToPlainText(descriptionHtml),
        url: link,
        sourceUrl: link,
        locationText,
        employmentTypeText: type,
        salaryText: null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: "USD",
        salaryPeriod: null,
        tags: [],
        postedAt: pubDate ? new Date(pubDate).toISOString() : null,
        deadline: null,
        applicationUrl: link || null,
        raw: { title: rawTitle, region, country, type, pubDate, link },
      };
    })
    .filter((x): x is RawOpportunity => x !== null);
}

export const weWorkRemotelySource: OpportunitySource = {
  id: "weworkremotely",
  name: "We Work Remotely",
  type: "rss",
  kind: "job_board",
  status: "active",
  notes: "Public per-category RSS feed (Design category).",

  async fetch(ctx: FetchContext): Promise<RawOpportunity[]> {
    const xml = await fetchText(FEED_URL, { signal: ctx.signal });
    return parseFeed(xml);
  },
};
