/**
 * Design-relevance filter (Phase 2 §12). Matches on TITLE only — a
 * description merely containing the word "design" is not enough (e.g. a
 * "Senior .NET Software Engineer" listing tagged "design" on RemoteOK is
 * not a design role). Deterministic keyword rules, no AI.
 */

const ROLE_PATTERNS: RegExp[] = [
  /\bgraphic designers?\b/i,
  /\bui\s*\/\s*ux designers?\b/i,
  /\bux\s*\/\s*ui designers?\b/i,
  /\bui designers?\b/i,
  /\bux designers?\b/i,
  /\bproduct designers?\b/i,
  /\bvisual designers?\b/i,
  /\bbrand designers?\b/i,
  /\bweb designers?\b/i,
  /\bmarketing designers?\b/i,
  /\bcontent designers?\b/i,
  /\bmotion designers?\b/i,
  /\bcreative designers?\b/i,
  /\bart directors?\b/i,
  /\bcreative directors?\b/i,
  /\bdigital designers?\b/i,
  /\bcommunication designers?\b/i,
  /\bpresentation designers?\b/i,
];

/** True if the title matches one of the target design roles (Phase 2 §12's list). */
export function isDesignRelevant(title: string): boolean {
  return ROLE_PATTERNS.some((pattern) => pattern.test(title));
}
