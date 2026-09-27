/**
 * Best-effort parser: free-text funding-amount strings ("Up to $20,000",
 * "$500-$3,000", "AUD $5,000-$30,000", "Varies", ...) -> a currency code
 * plus optional min/max numbers. Never invents a figure a source didn't
 * state — amountText is always kept verbatim for display alongside
 * whatever this manages to extract (see lib/grants/types.ts).
 */

export interface ParsedAmount {
  currency: string | null;
  min: number | null;
  max: number | null;
}

const CURRENCY_CODE_RE = /\b(AUD|CAD|USD|EUR|GBP)\b/i;
const NUMBER_RE = /[\d][\d,]*(?:\.\d+)?/g;

export function parseGrantAmount(amountText: string | null | undefined): ParsedAmount {
  if (!amountText) return { currency: null, min: null, max: null };

  const codeMatch = CURRENCY_CODE_RE.exec(amountText);
  let currency: string | null = codeMatch ? codeMatch[1].toUpperCase() : null;
  if (!currency) {
    if (amountText.includes("€")) currency = "EUR";
    else if (amountText.includes("£")) currency = "GBP";
    else if (amountText.includes("$")) currency = "USD";
  }

  const numberMatches = amountText.match(NUMBER_RE);
  if (!numberMatches || numberMatches.length === 0) {
    return { currency, min: null, max: null };
  }

  const numbers = numberMatches
    .map((n) => Number(n.replace(/,/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (numbers.length === 0) return { currency, min: null, max: null };

  const isUpTo = /\bup to\b/i.test(amountText);

  if (numbers.length === 1) {
    return isUpTo ? { currency, min: null, max: numbers[0] } : { currency, min: numbers[0], max: numbers[0] };
  }

  return { currency, min: Math.min(...numbers), max: Math.max(...numbers) };
}
