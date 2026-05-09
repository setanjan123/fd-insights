# FD Link Updater & Rate Scraper System

This workspace contains automated scrapers to fetch the latest Fixed Deposit (FD) interest rates from various public bank websites and update the shared `banks.json` data file. 

## Features

- **Multi-Bank Architecture**: Modular scrapers for each bank using a shared `BankScraper` interface.
- **Playwright + Fetch**: Browser-backed HTML extraction for JS-heavy or bot-protected pages, with native `fetch()` for JSON feeds.
- **Tenure Parser**: Handles all variations of tenure strings (like `6 months 1 day <= 9 months`, `7 - 14 days`).
- **Parallel Scraper Execution**: Scrapes multiple banks independently simultaneously.
- **Fail-safe Logic**: If one bank scraper breaks, other banks are successfully preserved and updated.
- **Zero Config**: Executes with `tsx` out-of-the-box.

## Setup

Install Chromium once before running HTML scrapers locally:

```bash
npx playwright install chromium
```

## Usage

Update all banks configured in the system:
```bash
npm run update
```

Update only a specific bank's specific rates (helpful for testing one specific scraper script):
```bash
npm run update:hdfc
npm run update:sbi
```

## Adding a New Bank

1. Create a `src/scrapers/newbank.ts` implementing `BankScraper`.
2. Inspect the HTML structure of the new bank to ascertain how its FD list is formed.
3. Feed the raw `{ tenure, regular, senior }` to the shared `parseTenure` and `parseRate`.
4. Register the new scraper in `src/scrapers/index.ts`.

## Deployment/Automation 

A `.github/workflows/update-rates.yml` runs via cron action every first of the month. It attempts an update of `banks.json` and pushes modifications. Since the React deployment acts upon push on `main`, pushing these updates automatically creates a redeploy with fresh interest rate content.
