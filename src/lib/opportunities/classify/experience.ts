/**
 * Years-of-experience filter. Product rule: exclude senior-level roles that
 * spell out a required years-of-experience of 5 or more (e.g. "5+ years of
 * experience", "5-10 years experience", "5 to 10 years of experience").
 *
 * Deliberately narrow: only "<number> ... years ... experience" phrasing
 * counts (with up to two filler words in between, e.g. "years of relevant
 * industry experience"). A bare "10 years" elsewhere in a posting — "we've
 * been remote for 10 years", "founded in 2015" — must not match, since it
 * says nothing about a required experience level.
 *
 * A range's lower bound is what's actually required (a "5 to 10 years"
 * posting will accept a candidate with 5), so that's the number compared
 * against the threshold.
 */

const YEARS_EXPERIENCE_PATTERN =
  /\b(\d{1,2})\+?\s*(?:(?:-|–|—|to)\s*\d{1,2})?\+?\s*years?\s*(?:of\s+)?(?:\w+\s+){0,2}experience\b/gi;

const SENIOR_YEARS_THRESHOLD = 5;

/** Lowest stated years-of-experience requirement found in `text`, or null if none. */
export function minYearsExperienceRequired(text: string | null | undefined): number | null {
  if (!text) return null;

  let min: number | null = null;
  for (const match of text.matchAll(YEARS_EXPERIENCE_PATTERN)) {
    const years = Number(match[1]);
    if (Number.isNaN(years)) continue;
    if (min === null || years < min) min = years;
  }
  return min;
}

/** True if the posting states a years-of-experience requirement at/above the senior threshold. */
export function requiresSeniorExperience(text: string | null | undefined): boolean {
  const years = minYearsExperienceRequired(text);
  return years !== null && years >= SENIOR_YEARS_THRESHOLD;
}
