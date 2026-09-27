/**
 * Best-effort parser: free-text application-window strings (as written by
 * dozens of different funders — "Deadline: Oct 15, 2026", "Open Sep
 * 1-Oct 28, 2026", "Rolling", "Opens Nov 2026", "2026 cycle closed
 * (deadline was Jul 1, 2026); next cycle opens Spring 2027", ...) ->
 * structured { opensAt, deadline, isRolling }.
 *
 * This can't be a full date-range grammar (funders don't follow one
 * format), so it's a set of heuristics tried in order. When nothing
 * confidently parses, every field comes back null/false and
 * classifyGrantStatus() falls back to "unknown" — the ORIGINAL windowText
 * is always kept and shown to the user regardless (see lib/grants/types.ts),
 * so an unparsed date never means the information is lost, only that the
 * app can't yet compute a live open/closed badge for it.
 */

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const MONTH_PATTERN =
  "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

const FULL_DATE_RE = new RegExp(`${MONTH_PATTERN}\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})`, "gi");
const MONTH_YEAR_RE = new RegExp(`${MONTH_PATTERN}\\.?\\s+(\\d{4})`, "i");

const DEADLINE_KEYWORDS = ["deadline", "due", "closes", "close", "through", "closed", "by "];
const OPENS_KEYWORDS = ["open", "opens", "reopens", "begin", "starts"];

interface DateMatch {
  iso: string;
  index: number;
  precedingText: string;
}

function toIsoEndOfDay(monthName: string, day: string, year: string): string | null {
  const month = MONTHS[monthName.toLowerCase()];
  if (month == null) return null;
  const date = new Date(Date.UTC(Number(year), month, Number(day), 23, 59, 59));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function findFullDates(text: string): DateMatch[] {
  const matches: DateMatch[] = [];
  const re = new RegExp(FULL_DATE_RE);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const iso = toIsoEndOfDay(m[1], m[2], m[3]);
    if (iso) {
      matches.push({
        iso,
        index: m.index,
        precedingText: text.slice(Math.max(0, m.index - 25), m.index).toLowerCase(),
      });
    }
  }
  return matches;
}

export interface ParsedWindow {
  opensAt: string | null;
  deadline: string | null;
  isRolling: boolean;
}

export function parseGrantWindow(windowText: string | null | undefined): ParsedWindow {
  if (!windowText || windowText.trim().length === 0) {
    return { opensAt: null, deadline: null, isRolling: false };
  }

  const lower = windowText.toLowerCase();
  const isRolling = /\brolling\b/.test(lower);
  const dates = findFullDates(windowText);

  if (dates.length === 0) {
    // No full "Month Day, Year" date anywhere. Fall back to a bare
    // "Month Year" (e.g. "Opens Nov 2026") only when paired with an
    // opens-style keyword, since a lone month/year elsewhere in the text
    // is too ambiguous to trust as a real date.
    if (OPENS_KEYWORDS.some((k) => lower.includes(k))) {
      const monthYear = MONTH_YEAR_RE.exec(windowText);
      if (monthYear) {
        const month = MONTHS[monthYear[1].toLowerCase()];
        const year = Number(monthYear[2]);
        if (month != null) {
          return { opensAt: new Date(Date.UTC(year, month, 1)).toISOString(), deadline: null, isRolling };
        }
      }
    }
    return { opensAt: null, deadline: null, isRolling };
  }

  let deadline: string | null = null;
  let opensAt: string | null = null;

  for (const d of dates) {
    if (deadline == null && DEADLINE_KEYWORDS.some((k) => d.precedingText.includes(k))) {
      deadline = d.iso;
    }
  }
  for (const d of dates) {
    if (opensAt == null && d.iso !== deadline && OPENS_KEYWORDS.some((k) => d.precedingText.includes(k))) {
      opensAt = d.iso;
    }
  }

  // No keyword matched any date (e.g. a bare "Sep 30, 2026"): a single
  // date with no other signal is overwhelmingly a deadline in this
  // dataset. Two or more with no signal reads as an [open, close] window.
  if (deadline == null && opensAt == null) {
    if (dates.length === 1) {
      deadline = dates[0].iso;
    } else {
      opensAt = dates[0].iso;
      deadline = dates[dates.length - 1].iso;
    }
  }

  return { opensAt, deadline, isRolling };
}
