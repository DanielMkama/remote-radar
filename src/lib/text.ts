/** Small generic string helpers shared across jobs and grants. */

/** Replaces em/en dashes with a plain hyphen. Used on every field the app displays. */
export function stripDashes(text: string): string {
  return text.replace(/[—–]/g, "-");
}
