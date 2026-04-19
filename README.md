# FD Insights

FD Insights is a lightweight, fully automated Fixed Deposit (FD) calculator and interest rate tracker designed to help Indian savers track and calculate their returns. 

The project operates entirely statelessly via GitHub Pages. Instead of relying on a complex backend database, it features an automated scraping pipeline that extracts the latest FD slabs from public banking sites and triggers a direct static rebuild with the fresh data.

## 🏗️ Architecture

This project is a monorepo containing two distinct workspaces:

- `apps/web`: A Vite + React static single-page application containing the calculator UI and visualizations.
- `apps/updater`: A modular Node.js scraping execution layer utilizing `cheerio` to fetch and parse the latest FD slabs from official bank websites.

The two environments are decoupled. The only bridge between them is the `apps/web/src/lib/banks.json` file. The `updater` modifies this JSON file, and the `web` app simply reads from it at build time.

## 🤖 Automation Workflow

The entire lifecycle is fully automated utilizing GitHub Actions without any cost overhead:
1. **Cron Scraper (`update-rates.yml`)**: On the 1st of every month, this workflow executes the `apps/updater` scripts. It fetches the latest rates from banks (like HDFC), compiles the findings into JSON, and directly commits `banks.json` back to the `main` branch.
2. **Static Deploy (`deploy.yml`)**: Any push to the `main` branch (either by humans or the scraper bot) instantly triggers a full Vite frontend build. The new HTML/JS bundle is uploaded securely and served instantly via GitHub Pages.

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

Clone the repo and install dependencies from the root directory to populate both workspaces:

```bash
npm install
```

### Running the Web App

To start the Vite dev server for the React application:

```bash
npm run dev --workspace=web
```
Or navigate into `apps/web` and run `npm run dev`.

### Running the Scrapers

To manually fetch the latest rates and update your local `banks.json`:

```bash
# Run all configured bank scrapers
npm run update --workspace=updater

# Or run a specific bank scraper isolated
npm run update:hdfc --workspace=updater
```

## 🛠️ Adding a New Bank Scraper

1. Navigate to `apps/updater/src/scrapers/`.
2. Implement the `BankScraper` interface in a new file (e.g. `sbi.ts`).
3. Leverage the shared `fetchHtml`, `parseTenure`, `parseRate`, and `extractTableRows` utilities provided in `apps/updater/src/lib`.
4. Export your new scraper class inside `apps/updater/src/scrapers/index.ts`. Next time the batch job triggers, it will run your code in parallel!

## 🧩 Tech Stack
- **Frontend**: React, TailwindCSS, Vite
- **Scraper**: Cheerio, native `fetch()`, `tsx`
- **Automation**: GitHub Actions (Cron), GitHub Pages
