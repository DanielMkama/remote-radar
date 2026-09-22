/**
 * Location / worldwide-eligibility classification (Phase 2 §9).
 *
 * Deterministic, rule-based — no AI. Operates primarily on the source's
 * free-text location string; a secondary text (e.g. the description) can
 * be passed to pick up phrasing like "open to candidates from all
 * countries" when the location field itself just says "Remote".
 *
 * Priority when multiple signals are present: worldwide > timezone >
 * country > region > location_unclear. Timezone is checked before country
 * because phrases like "US time zones only" contain a country name (US)
 * but describe a timezone restriction, not a nationality/residency one.
 *
 * IMPORTANT: "Remote" alone is NOT treated as worldwide — it's genuinely
 * ambiguous (many "Remote" listings are secretly single-country), so it
 * classifies as location_unclear unless other evidence says otherwise.
 */

import type { LocationStatus } from "../types";

const WORLDWIDE_PATTERNS: RegExp[] = [
  /\bworldwide\b/i,
  /\bwork(?:ing)? from anywhere\b/i,
  /\bremote[\s\-–—]*(?:only)?[\s\-–—•]*anywhere\b/i,
  /\banywhere in the world\b/i,
  /\ball countries\b/i,
  /\bopen to (?:candidates|applicants|people)?\s*(?:from)?\s*all countries\b/i,
  /\bglobal(?:ly)?\b/i,
  /\beverywhere\b/i,
  /\bany\s*(?:where|country|location)\b/i,
  /\bno location restrictions?\b/i,
  /\bfully remote[\s\-–—]*\(?\s*global\b/i,
];

const TIMEZONE_PATTERNS: RegExp[] = [
  /\btime[\s\-]?zones?\b/i,
  /\bUTC\s*[+-]\s*\d/i,
  /\bGMT\s*[+-]\s*\d/i,
  /\b\d\s*(?:-|to)\s*\d\s*hours?\s*overlap\b/i,
  /\bworking hours?\b.{0,15}\boverlap\b/i,
];

// Full names matched case-insensitively; short codes matched as whole
// uppercase tokens on the ORIGINAL text to avoid matching lowercase
// words like "us" (the pronoun) or "in" inside other words.
const COUNTRY_NAMES: RegExp[] = [
  /\bunited states\b/i,
  /\bU\.S\.A?\.?\b/,
  /\bAmerica\b/i,
  /\bcanada\b/i,
  /\bunited kingdom\b/i,
  /\bgreat britain\b/i,
  /\bengland\b/i,
  /\bscotland\b/i,
  /\bwales\b/i,
  /\bgermany\b/i,
  /\bfrance\b/i,
  /\bspain\b/i,
  /\bitaly\b/i,
  /\bnetherlands\b/i,
  /\bpoland\b/i,
  /\bireland\b/i,
  /\bportugal\b/i,
  /\bbrazil\b/i,
  /\bmexico\b/i,
  /\bindia\b/i,
  /\baustralia\b/i,
  /\bnew zealand\b/i,
  /\bjapan\b/i,
  /\bsingapore\b/i,
  /\bphilippines\b/i,
  /\bargentina\b/i,
  /\bchile\b/i,
  /\bcolombia\b/i,
  /\bnigeria\b/i,
  /\bsouth africa\b/i,
  /\bkenya\b/i,
  /\bukraine\b/i,
  /\bromania\b/i,
  /\bsweden\b/i,
  /\bnorway\b/i,
  /\bdenmark\b/i,
  /\bfinland\b/i,
  /\bswitzerland\b/i,
  /\baustria\b/i,
  /\bbelgium\b/i,
  /\bczech(?:ia| republic)?\b/i,
  /\bisrael\b/i,
  /\bpakistan\b/i,
  /\bbangladesh\b/i,
  /\bindonesia\b/i,
  /\bvietnam\b/i,
  /\bthailand\b/i,
  /\bmalaysia\b/i,
  /\bchina\b/i,
  /\bsouth korea\b/i,
  /\brussia\b/i,
  /\bturkey\b/i,
  /\begypt\b/i,
  /\bmorocco\b/i,
  /\bperu\b/i,
  /\becuador\b/i,
  /\bcosta rica\b/i,
];
// Short/ambiguous codes: require the ORIGINAL (case-sensitive) text to
// contain them as standalone uppercase tokens.
const COUNTRY_CODES: RegExp[] = [/\bUS\b/, /\bUK\b/, /\bUAE\b/];

const REGION_NAMES: RegExp[] = [
  /\beurope(?:an)?\b/i,
  /\blatam\b/i,
  /\blatin america\b/i,
  /\bapac\b/i,
  /\basia[\s\-]?pacific\b/i,
  /\bemea\b/i,
  /\bnorth america\b/i,
  /\bsouth america\b/i,
  /\bmiddle east\b/i,
  /\boceania\b/i,
  /\bnordics?\b/i,
  /\bscandinavia\b/i,
  /\bsoutheast asia\b/i,
  /\bafrica\b/i,
];
const REGION_CODES: RegExp[] = [/\bEU\b/];

function matchesAny(patterns: RegExp[], text: string): boolean {
  return patterns.some((p) => p.test(text));
}

export interface ClassifyLocationInput {
  /** The source's free-text location field (or region/candidate-location field), if any. */
  locationText?: string | null;
  /** Optional extra text (e.g. description) to scan for explicit worldwide language. */
  extraText?: string | null;
}

export function classifyLocation({ locationText, extraText }: ClassifyLocationInput): LocationStatus {
  const primary = (locationText ?? "").trim();
  const secondary = (extraText ?? "").trim();
  const combined = [primary, secondary].filter(Boolean).join(" | ");

  if (combined.length === 0) return "location_unclear";

  if (matchesAny(WORLDWIDE_PATTERNS, combined)) return "worldwide";
  if (matchesAny(TIMEZONE_PATTERNS, combined)) return "timezone_restricted";
  if (matchesAny(COUNTRY_NAMES, combined) || matchesAny(COUNTRY_CODES, combined)) {
    return "country_restricted";
  }
  if (matchesAny(REGION_NAMES, combined) || matchesAny(REGION_CODES, combined)) {
    return "region_restricted";
  }

  // Bare "Remote" (or similar generic terms) with no further evidence:
  // genuinely ambiguous, not assumed worldwide.
  return "location_unclear";
}
