import * as cheerio from "cheerio";

const DEFAULT_RETRIES = 2;
const RETRYABLE_STATUS_CODES = new Set([403, 408, 425, 429, 500, 502, 503, 504]);

const cookieJar = new Map<string, Map<string, string>>();

function getOrigin(url: string): string {
  return new URL(url).origin;
}

function getBaseHeaders(url: string, accept: string): Record<string, string> {
  const { origin } = new URL(url);

  return {
    Accept: accept,
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    DNT: "1",
    Pragma: "no-cache",
    Priority: "u=0, i",
    Referer: `${origin}/`,
    "Sec-CH-UA": '"Chromium";v="123", "Not:A-Brand";v="8", "Google Chrome";v="123"',
    "Sec-CH-UA-Mobile": "?0",
    "Sec-CH-UA-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  };
}

function getCookieHeader(url: string): string | undefined {
  const cookies = cookieJar.get(getOrigin(url));

  if (!cookies || cookies.size === 0) {
    return undefined;
  }

  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function storeCookies(url: string, response: Response): void {
  const setCookie = response.headers.get("set-cookie");

  if (!setCookie) {
    return;
  }

  const origin = getOrigin(url);
  const existing = cookieJar.get(origin) ?? new Map<string, string>();
  const rawCookies = setCookie.split(/,(?=[^;]+=[^;]+)/);

  for (const rawCookie of rawCookies) {
    const [nameValue] = rawCookie.split(";");
    const separatorIndex = nameValue.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const name = nameValue.slice(0, separatorIndex).trim();
    const value = nameValue.slice(separatorIndex + 1).trim();

    if (name) {
      existing.set(name, value);
    }
  }

  cookieJar.set(origin, existing);
}

function isRetryableError(error: unknown): boolean {
  return error instanceof Error;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithPolicy(url: string, accept: string, retries: number): Promise<Response> {
  const headers = getBaseHeaders(url, accept);
  const cookieHeader = getCookieHeader(url);

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  try {
    const response = await fetch(url, {
      headers,
      redirect: "follow",
    });

    storeCookies(url, response);

    if (RETRYABLE_STATUS_CODES.has(response.status)) {
      throw new Error(`HTTP Error ${response.status} - ${response.statusText}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status} - ${response.statusText}`);
    }

    return response;
  } catch (error) {
    if (retries <= 0 || !isRetryableError(error)) {
      throw error;
    }

    const attemptNumber = DEFAULT_RETRIES - retries + 1;
    const delayMs = 1500 * attemptNumber + Math.floor(Math.random() * 500);

    console.warn(`Fetch failed for ${url}. Retrying in ${delayMs}ms... (${retries} left)`);
    await sleep(delayMs);
    return fetchWithPolicy(url, accept, retries - 1);
  }
}

/**
 * Fetches HTML from a URL and loads it into a cheerio instance.
 * @param url The URL to load HTML from
 * @param retries Number of retries on failure
 * @returns CheerioAPI instance
 */
export async function fetchHtml(
  url: string,
  retries = DEFAULT_RETRIES,
): Promise<cheerio.CheerioAPI> {
  const response = await fetchWithPolicy(
    url,
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    retries,
  );

  const html = await response.text();
  return cheerio.load(html);
}

/**
 * Fetches a JSON resource from a URL.
 * @param url The URL to fetch JSON from
 * @param retries Number of retries on failure
 * @returns Parsed JSON of type T
 */
export async function fetchJson<T>(
  url: string,
  retries = DEFAULT_RETRIES,
): Promise<T> {
  const response = await fetchWithPolicy(
    url,
    "application/json,text/plain,*/*",
    retries,
  );

  return response.json() as Promise<T>;
}
