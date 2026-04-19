import * as cheerio from "cheerio";

/**
 * Fetches HTML from a URL and loads it into a cheerio instance.
 * @param url The URL to load HTML from
 * @param retries Number of retries on failure
 * @returns CheerioAPI instance
 */
export async function fetchHtml(
  url: string,
  retries = 1,
): Promise<cheerio.CheerioAPI> {
  const headers = {
    // Mimic a standard browser to avoid immediate 403s
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status} - ${response.statusText}`);
    }

    const html = await response.text();
    return cheerio.load(html);
  } catch (error) {
    if (retries > 0) {
      console.warn(`Fetch failed for ${url}. Retrying... (${retries} left)`);
      // Small backoff before retrying
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return fetchHtml(url, retries - 1);
    }
    throw error;
  }
}
