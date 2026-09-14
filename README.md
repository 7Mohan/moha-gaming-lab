# Moha Gaming Lab

## Environment Variables

Create a `.env.local` file at the project root for local development:

```env
# Site URL (used for metadata, OG, canonical, sitemap)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Future: analytics
# NEXT_PUBLIC_GA_ID=

# Future: advertising
# NEXT_PUBLIC_ADSENSE_ID=
```

For production, set `NEXT_PUBLIC_SITE_URL=https://mohagaminglab.com` in your hosting environment.

## Getting Started

### Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+

### Install Node.js

If Node.js is not installed, download it from: https://nodejs.org/

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm run start
```

### Type Check

```bash
npm run type-check
```

### Lint

```bash
npm run lint
```

## Project Structure

```
app/              Next.js App Router pages
components/
  ui/             Primitive UI (Button, Badge, Card, StatusIndicator)
  layout/         Header, Navigation, MobileNav, Footer
  cards/          AppCard, GameCard, ToolCard, GuideCard
  three/          3D scene system (SceneWrapper, DeviceScene)
features/
  download/       DownloadButton
  search/         SearchBar
hooks/            useWebGL, useReducedMotion, useScrollY
lib/              cn, metadata helpers
types/            Game, App, Tool, Guide TypeScript interfaces
data/             Mock data (replace with API/DB later)
styles/           globals.css — design tokens and base styles
public/           robots.txt, static assets
```

## Design System

- **Accent**: `#00E5A0` (terminal green-teal)
- **Background**: `#0A0B0D` base / `#111318` surface / `#191D24` elevated
- **Fonts**: Inter (body) + Geist Mono (code/numbers)
- **No fake statistics, reviews, or testimonials**

## 3D Architecture

3D scenes are:
1. Dynamically imported (`ssr: false`) — never block page load
2. WebGL capability detected before loading (`useWebGL`)
3. Reduced motion respected (`useReducedMotion`)
4. Graceful fallback UI when WebGL unavailable

## Routes

| Route | Status |
|---|---|
| `/` | Homepage shell |
| `/games` | Games listing |
| `/games/[game]` | Game detail |
| `/android` | Android optimization |
| `/tools` | Tools listing |
| `/tools/[tool]` | Tool detail |
| `/apps` | Apps listing |
| `/apps/[app]` | App detail |
| `/downloads` | Download center |
| `/guides` | Guides listing |
| `/guides/[slug]` | Guide detail |
| `/search` | Search |
| `/about` | About |
| `/contact` | Contact |
