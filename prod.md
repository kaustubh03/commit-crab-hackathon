# CommitCrab Dashboard - Production Reference

This document serves as an internal reference for moving the CommitCrab dashboard toward a production-ready state. It outlines the architecture, data flow, theming system, performance considerations, deployment notes, and next-step recommendations.

## 1. Technology Stack
- Build Tool: Vite + React 18
- Language: TypeScript (module Resolution: ES Modules)
- State / Data Fetching: TanStack Query (react-query v5)
- Routing: TanStack Router (v1) with generated route tree
- Charts / Visualization: Recharts
- Styling: TailwindCSS + design tokens via CSS custom properties (HSL) with class-based dark mode
- Package Manager / Runtime: Bun (scripts use `bun x`)

## 2. Project Structure (Relevant Excerpt)
```
dashboard/
  index.html                  # Boot HTML + theme preload script
  src/main.tsx                # App entry: router + query client wiring
  app/                        # Route modules & UI components
    _layout.tsx               # Root layout route (sidebar + Outlet)
    index.tsx                 # Dashboard landing page
    analytics.tsx             # Placeholder analytics route
    pr/$prId.tsx              # Dynamic PR detail route
    components/               # Feature components
      layout/
        sidebar.tsx           # Sidebar + ThemeToggle integration
        theme-toggle.tsx      # Dark/Light toggle logic
      pr/
        score-badge.tsx
        metric-item.tsx
    ui/                       # Reusable primitive UI components
      button.tsx, card.tsx, progress.tsx, badge.tsx, accordion.tsx
    lib/
      mock-data.ts            # Fake data layer (would be replaced by real API)
      types.ts                # Core TypeScript types (extend as domain grows)
    utils/format.ts           # Formatting helpers (avg/date)
  src/globals.css             # Tailwind base + design tokens + dark theme
  tailwind.config.cjs         # Tailwind configuration (darkMode: 'class')
```

## 3. Routing & Data Loading
- Routes defined via modules using `createRoute` + `createRootRoute`.
- `routeTree.gen.ts` (generated) references all route exports.
- Data fetched with TanStack Query inside components (no loader functions yet). For production, consider:
  - Moving data prefetch into route context loaders for improved UX & streaming.
  - Normalizing PR data into a client-side cache (query keys already prepared).

## 4. Theming System
- Tailwind configured with `darkMode: 'class'`.
- CSS variables define semantic tokens: `--background`, `--foreground`, etc. in `:root` and `.dark`.
- HSL values allow dynamic theming + alpha utility friendliness.
- A no-FOUC (Flash of Unstyled Content) inline script (in `index.html`) reads `localStorage.cc-theme` or system preference and sets `document.documentElement.classList` before paint.
- `ThemeToggle` component updates the `dark` class and persists preference.

### Considerations / Improvements
- Add SSR-compatible snippet (if future SSR) using user cookies.
- Expose `useTheme()` hook if multiple components need theme awareness.
- Provide reduced-motion or high-contrast variants if accessibility scope expands.

## 5. UI Component Strategy
- Current primitives mimic a design system pattern (Button, Card, Badge, Progress, Accordion).
- Consistent class utilities rely on token-based HSL colors.
- For production scale:
  - Introduce prop-level variants using a utility (e.g., class-variance-authority) for consolidation.
  - Add storybook (or alternative) for visual regression and documentation.

## 6. Data Layer & Mock Abstraction
- `mock-data.ts` simulates PR analysis responses with shape including `shipScore`, `health`, `performance`, `aiSuggestions`.
- Replace with real backend integration via REST/GraphQL.
- Introduce TypeScript validators (zod or valibot) to enforce runtime safety before hydration.

## 7. Performance Notes
Current footprint is small. To keep it performant as it grows:
- Enable code splitting by route (TanStack Router already supports lazy route components if switched to dynamic imports).
- Track bundle size with CI (e.g., `rollup-plugin-visualizer` or `bundlesize`).
- Consider React Suspense boundaries for skeleton states.
- Memoize expensive chart components if fed large datasets.
- Switch to streaming data for long-running analysis pages.

## 8. Accessibility Checklist (Initial)
- Ensure all interactive elements have discernible labels (Button/Toggle OK).
- Add `aria-live` regions for async loading (optional enhancement).
- Color contrast: verify token pairs with tooling (some accent shades may need adjustment for WCAG AA in dark mode).

## 9. Security & Hardening
- Input handling minimal now; when adding forms ensure:
  - Escape rendered user content (React does by default; avoid `dangerouslySetInnerHTML`).
  - Use Content Security Policy meta tag when deploying (lock down script sources).
- Consider read-only API keys via server proxy instead of exposing secrets.

## 10. Deployment Recommendations
- Build: `bun x vite build` (outputs to `dist/`).
- Serve via static host (Netlify, Vercel, Cloudflare Pages) or behind an app gateway.
- Add HTTP headers:
  - `Cache-Control` for immutable hashed assets.
  - `Content-Security-Policy` (script-src 'self').
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `X-Frame-Options: DENY`.

## 11. Observability / Telemetry (Future)
- Add lightweight analytics (posthog / open source) gated behind user consent.
- Instrument route transitions via TanStack Router events.
- Capture query cache metrics (hit ratio) if data layer grows.

## 12. Testing Strategy (Proposed)
- Unit: React Testing Library for components (mount + accessibility queries).
- Integration: Mock Service Worker for query flows.
- Visual: Optional screenshot diff (Chromatic / Playwright).
- Performance: Lighthouse CI workflow (partially present in repo via GitHub action for PR comments).

## 13. Future Enhancements
| Area | Recommendation |
|------|---------------|
| Theming | Add system auto mode + explicit user override UI (radio group) |
| PR Detail | Introduce diff previews & inline metrics mapping |
| Analytics | Cohort trends, per-author velocity, API error panels |
| Offline | Prefetch recent PRs, cache shell via Service Worker |
| Auth | Add GitHub OAuth + rate limit handling |
| AI Suggestions | Add feedback loop (accept / dismiss / weight adjustments) |

## 14. Dark Mode Implementation Summary
- Initialization script ensures correct class before first paint.
- Tokens invert in `.dark` scope only; no per-component overrides required.
- Toggle writes preference to `localStorage` and reflects instantly.

## 15. Known Gaps / TODOs
- No persistence layer / real backend.
- No error boundaries per route (root-only boundary present).
- No analytics or logging yet.
- Minimal README – should link to this file or merge content.
- No ESLint / Prettier config present in this subdirectory (consider centralizing). 

## 16. Quick Start
```bash
bun install
bun run dev
```
Open http://localhost:5173

## 17. Maintenance Notes
- Keep dependencies updated quarterly (especially TanStack libs & Vite).
- Audit CSS custom properties when adding new semantic roles.
- Watch for chart library bundle size; consider lighter alternatives if dataset growth remains modest.

---
Document Owner: Internal Engineering
Revision: v0.1 (Initial draft with dark mode integration)
