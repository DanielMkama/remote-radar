/**
 * Shared HTTP helpers for source adapters — timeout enforcement, a
 * descriptive User-Agent (so operators of the sources we call can see who
 * we are and contact us), and a small delay helper for respecting
 * crawl-delay style rate limits between paginated requests.
 */

import { DEFAULT_REQUEST_TIMEOUT_MS } from "./types";

export const USER_AGENT =
  "RemoteDesignRadarBot/1.0 (+https://github.com/DanielMkama/remote-radar; personal job-monitoring tool)";

export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS
): Promise<T> {
  const res = await fetchWithTimeout(url, init, timeoutMs);
  if (!res.ok) {
    throw new Error(`${url} responded ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function fetchText(
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS
): Promise<string> {
  const res = await fetchWithTimeout(url, init, timeoutMs);
  if (!res.ok) {
    throw new Error(`${url} responded ${res.status} ${res.statusText}`);
  }
  return res.text();
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS
): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: { "User-Agent": USER_AGENT, Accept: "application/json, application/xml, */*", ...init.headers },
    signal: init.signal ?? AbortSignal.timeout(timeoutMs),
  });
}

/** Courtesy delay between paginated requests to the same source. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
