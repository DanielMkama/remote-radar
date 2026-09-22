/**
 * Every real source gives HTML job descriptions; the existing job detail
 * page renders `Job.description` as plain text (not dangerouslySetInnerHTML)
 * — see src/app/jobs/[id]/page.tsx — so we convert to readable plain text
 * at ingestion time rather than changing how the UI renders descriptions.
 */

const BLOCK_TAGS = /<\/(p|div|li|h[1-6]|tr)>/gi;
const BREAK_TAGS = /<br\s*\/?>/gi;
const LIST_ITEM_OPEN = /<li[^>]*>/gi;

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&nbsp;": " ",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&rdquo;": "”",
  "&ldquo;": "“",
  "&mdash;": "-",
  "&ndash;": "-",
  "&hellip;": "…",
};

/** Replaces em/en dashes with a plain hyphen. Used on every field the app displays. */
export function stripEmDashes(text: string): string {
  return text.replace(/[—–]/g, "-");
}

export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return "";

  let text = html
    .replace(BLOCK_TAGS, "\n")
    .replace(BREAK_TAGS, "\n")
    .replace(LIST_ITEM_OPEN, "• ")
    .replace(/<[^>]+>/g, "");

  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
  for (const [entity, char] of Object.entries(ENTITIES)) {
    text = text.split(entity).join(char);
  }

  // Some sources write em/en dashes directly (not as HTML entities) —
  // normalize those too so nothing the app displays contains one.
  text = text.replace(/[—–]/g, "-");

  return text
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
