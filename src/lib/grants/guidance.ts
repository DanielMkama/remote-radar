/**
 * "How to apply" guidance shown on the grant detail page.
 *
 * This is deliberately GENERIC, honest advice built from fields we
 * actually have (eligibilityText, focusText, amount) plus universal
 * grant-application practice — never a claim about a specific funder's
 * actual requirements, since we haven't scraped each funder's own
 * application page and won't pretend otherwise. It adapts by status so a
 * closed/upcoming grant still tells the applicant something useful to do
 * right now instead of just showing a dead end.
 *
 * Note on "automatic updates": status (open/upcoming/rolling/closed) is
 * already recomputed from the parsed deadline on every page load (see
 * classify-status.ts) — a grant flips from "closed" to "open" or vice
 * versa on its own the moment the date crosses, with no re-ingestion
 * needed. What is NOT automatic is discovering a *new* deadline a funder
 * publishes after their site currently says nothing (that needs a real
 * per-site scraper or the curated data being manually refreshed — see
 * lib/grants/sources/curated-grants.ts).
 */

import { formatGrantAmount, formatGrantDeadline } from "./format";
import type { Grant } from "./types";

export interface ApplicationGuidance {
  heading: string;
  intro: string;
  checklist: string[];
}

type GuidanceInput = Pick<
  Grant,
  "status" | "eligibilityText" | "focusText" | "amount" | "deadline" | "opensAt" | "isRolling" | "windowText"
>;

export function getApplicationGuidance(grant: GuidanceInput): ApplicationGuidance {
  const checklist: string[] = [];

  if (grant.eligibilityText) {
    checklist.push(`Confirm you meet the eligibility rules: ${grant.eligibilityText}.`);
  }
  if (grant.focusText) {
    checklist.push(`Make sure your project fits the funded focus areas: ${grant.focusText}.`);
  }
  const amountLabel = formatGrantAmount(grant.amount);
  if (amountLabel !== "Amount not stated") {
    checklist.push(`Size your proposal to the typical award: ${amountLabel}.`);
  }
  checklist.push(
    "Most funders ask for some combination of a short project description or portfolio, a simple budget, proof of eligibility, and 1-2 references or work samples — have these ready before starting the official form."
  );

  switch (grant.status) {
    case "open":
      return {
        heading: "Open now — how to apply",
        intro: `Applications are open (${formatGrantDeadline(grant)}). Apply directly on the funder's site using the button above.`,
        checklist,
      };
    case "rolling":
      return {
        heading: "Rolling / ongoing — how to apply",
        intro:
          "This program accepts applications on an ongoing basis with no fixed deadline. Funders that run on a fixed annual budget can still close early once funds are spent, so applying sooner rather than later can help.",
        checklist,
      };
    case "upcoming":
      return {
        heading: "Opens soon — get ready now",
        intro: `Applications aren't open yet (${formatGrantDeadline(
          grant
        )}). This page will switch to "Open now" automatically once that date arrives — use the time before then to prepare the items below.`,
        checklist,
      };
    case "closed":
      return {
        heading: "Closed for this cycle — what to prepare for next time",
        intro: `${
          grant.windowText ? grant.windowText + " " : "This cycle's deadline has passed. "
        }Check the funder's own page for their next cycle date, and use the time now to prepare the items below.`,
        checklist,
      };
    default:
      return {
        heading: "Check the official page for current status",
        intro:
          "We don't have a confirmed application window for this one yet. Use the link above to check directly whether it's currently accepting applications, and prepare the items below in the meantime.",
        checklist,
      };
  }
}
