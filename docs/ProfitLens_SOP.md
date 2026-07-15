# ProfitLens — Engineering SOP
### AI-Powered Profitability & Return Risk Analytics Platform for E-commerce Sellers

**Audience:** This document is written for an AI coding agent (or a human engineer) to execute step by step, module by module, with minimal ambiguity. No module should be started before the prior module's Acceptance Criteria are met.

**Fixed dependencies (do not redesign):**
- ML model: `return_risk_model_v5.joblib` (tuned XGBoost, scale_pos_weight, trained on Merchant-fulfilled orders only)
- Encoders: `return_risk_encoders_v5.joblib` (LabelEncoders for `Category`, `ship-state`)
- Model feature contract (order matters): `Category, Amount, Qty, ship-state, B2B, Month, Day_Of_Week, Price_Per_Unit`
- Business cost assumptions: COGS 60%, Platform Fee 10%, GST 18%, tiered shipping, ₹140 return loss — all currently hardcoded; Module 8 makes these user-configurable without touching the model

**Assumed stack:**
- Frontend: React + TypeScript + Tailwind CSS, shadcn/ui-style components
- Backend: Python + FastAPI
- Charts: Recharts
- Database: PostgreSQL
- Auth: JWT-based session auth

**Standing engineering rules** (discovered during implementation; apply to every module, past and future — add to this list rather than fixing an issue once and letting it silently recur):
- **TypeScript type-only imports:** any interface or type alias must be imported with `import type { X } from "./module"`, never bundled into a regular value import (`import { Component, SomeInterface } from "./module"`). Interfaces/types don't exist at runtime — mixing them into a value import causes Vite errors like "does not provide an export named X." Every module going forward must use this pattern from the start; a full audit of existing files for this issue is still pending as of Module 5.
- **Never use `NodeJS.Timeout` in frontend code** — it's a Node-specific type not valid in a browser/Vite TypeScript context. Use `ReturnType<typeof setTimeout>` instead for any timer/interval handle type.
- **`frontend/src/lib/dashboard-context.tsx`** (introduced during Module 5 implementation, not originally in this spec) provides a `useDashboard()` hook — future dashboard-tab modules (6, 7, 8) should consume shared dashboard state through this hook rather than re-fetching or duplicating it.

---

## Module Map

| # | Module | Depends on |
|---|--------|-----------|
| 1 | Foundation & Design System | — |
| 2 | Landing Page | 1 |
| 3 | Authentication | 1 |
| 4 | Upload & Schema Detection | 1, 3 |
| 5 | Dashboard Shell, Navigation & Overview Tab | 1, 4 |
| 6 | Profit Analytics Tab | 5 |
| 7 | Return Risk Tab & Recommendations Engine | 5, 6 |
| 8 | Settings, Report Export & Data Health | 5, 7 |

---

## Module 1 — Foundation & Design System

### 1. Objective
Establish the shared visual language, component primitives, project scaffolding, and API/data contracts that every later module builds on. When this module is done, no later module should need to introduce a new color, font size, spacing value, or folder convention — they only consume what Module 1 defines.

### 2. Purpose
A BI product lives or dies on consistency. If each page invents its own card padding, shadow, or number formatting, it reads as a student project. Doing this centralizing work first — before any page exists — is what makes the "enterprise SaaS" feel achievable, and it's what lets an AI coding agent build later modules without re-deriving design decisions from scratch each time.

### 3. UI Components
Design tokens and primitive components to build in this module (no page assembly yet):

**Design tokens** (as CSS variables / Tailwind theme extension):
- Color scale: `--color-primary` (Valley Green, e.g. `#3F6B4F`), `--color-primary-hover`, `--color-secondary` (Pantone Green, e.g. `#00594C`), `--color-bg` (soft off-white, e.g. `#FAFAF8`), `--color-surface` (pure white `#FFFFFF`), `--color-border` (light gray `#E4E4E1`), `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`
- Semantic status colors: `--color-success`, `--color-warning`, `--color-danger`, `--color-info` — muted/desaturated versions, not neon
- Typography scale: display, h1–h4, body-lg, body, body-sm, caption — one professional sans-serif (e.g. Inter)
- Spacing scale: 4px base unit, named tokens (xs, sm, md, lg, xl, 2xl)
- Radius scale: sm (6px), md (10px), lg (16px) — rounded but not bubbly
- Shadow scale: sm/md/lg — soft, low-opacity, no hard drop shadows
- Motion tokens: `--transition-fast` (120ms), `--transition-base` (200ms), easing curve — all transitions reference these, nothing hardcoded per-component

**Primitive components:**
- Button (primary, secondary, ghost, destructive; sm/md/lg; loading state with spinner; disabled state)
- Card (default, interactive/hoverable, with optional header/footer slots)
- Badge/Pill (status variants: success, warning, danger, neutral, info)
- Input, Select, Checkbox, Toggle — all with label, helper text, and error states
- Table (sortable header, zebra-free minimal row dividers, hover row highlight, empty state slot)
- Modal/Dialog (with overlay, close button, focus trap)
- Toast/Notification (success, error, info variants, auto-dismiss)
- Tabs (underline style, matches "Dashboard tabs" requirement)
- Skeleton loader (card skeleton, table-row skeleton, chart skeleton)
- Empty state component (icon + message + optional CTA — reused across every tab when data is missing)
- Error state component (distinct from empty state — something went wrong vs. nothing here yet)
- KPI Stat Card (label, value, delta indicator with up/down arrow and color, optional sparkline slot) — this is the single most-reused component in the whole product
- Icon set: use a single consistent icon library (e.g. lucide) throughout — never mix icon sets

### 4. User Experience
There is no end-user-facing flow in this module — it is invisible infrastructure. The "experience" it produces is indirect: every later screen should feel like it was designed by the same person in the same sitting. A useful gut-check for later modules: if a component needs a one-off style, that's a signal it should have been a Module 1 primitive instead.

### 5. Data Requirements
- No live data yet. Define TypeScript types now that later modules will reuse:
  - `Order` type mirroring the featured dataset schema: `orderId, date, status, fulfilment, salesChannel, shipServiceLevel, category, sku, qty, amount, shipState, shipCity, b2b, estimatedCOGS, platformFee, shippingCost, gst, returnLoss, estimatedProfit`
  - `ReturnRiskPrediction` type: `orderId, riskProbability (0-1), riskTier ("Low"|"Medium"|"High"), predictedAt`
  - `KPISummary` type: `label, value, unit, deltaPercent, deltaDirection`
- Define the base API client wrapper (fetch/axios instance with base URL, auth header injection point, standard error shape) — even before auth exists, so Module 3+ just plugs into it.
- Define a standard API error envelope: `{ error: { code, message, details? } }` — every backend endpoint in every later module returns this shape on failure.

### 6. Folder Structure
```
profitlens/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # primitives from this module (Button, Card, Table, etc.)
│   │   │   ├── charts/          # chart wrapper components (built in Module 6/7)
│   │   │   └── layout/          # AppShell, Sidebar, TopNav (built in Module 5)
│   │   ├── pages/               # one folder per page (landing, auth, upload, dashboard, settings, export)
│   │   ├── lib/
│   │   │   ├── api-client.ts
│   │   │   └── formatters.ts    # currency, percent, date formatting — single source of truth
│   │   ├── types/                # shared TS types (Order, ReturnRiskPrediction, KPISummary...)
│   │   ├── styles/
│   │   │   └── tokens.css       # design tokens as CSS variables
│   │   └── App.tsx
│   └── tailwind.config.ts        # tokens wired into Tailwind theme
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app entrypoint
│   │   ├── api/                  # routers, one file per domain (auth.py, uploads.py, analytics.py, risk.py, settings.py)
│   │   ├── models/               # Pydantic schemas mirroring frontend types
│   │   ├── services/             # business logic: profit calc, risk scoring, recommendation logic
│   │   ├── ml/
│   │   │   ├── return_risk_model_v5.joblib
│   │   │   ├── return_risk_encoders_v5.joblib
│   │   │   └── predictor.py      # thin wrapper: load once at startup, expose predict(df) -> risk scores
│   │   └── core/                 # config, security/JWT, error envelope helpers
│   └── requirements.txt
└── docs/
    └── ProfitLens_SOP.md          # this document
```

### 7. Implementation Order
1. Scaffold both `frontend/` and `backend/` project shells (Vite + React + TS; FastAPI + Uvicorn) with health-check endpoints only.
2. Define and wire design tokens (`tokens.css` + Tailwind theme extension) — no components yet, just confirm a test page can render the palette/type scale.
3. Build primitive components in isolation (a simple `/dev/components` internal route works as a living style guide — do not skip this, it's how you catch inconsistency early).
4. Build the KPI Stat Card, Empty State, and Error State components specifically — these get reused the most and are worth extra polish now.
5. Define shared TypeScript types and the API client wrapper.
6. Define the backend error envelope helper and one working `/health` route that returns it on a forced failure, to confirm the shape end-to-end.
7. Load the joblib model and encoders once at backend startup in `predictor.py`, with a `/health/model` route confirming it loaded successfully — this de-risks the ML integration before any real feature depends on it.

### 8. AI Coding Instructions
```
Scaffold a React + TypeScript + Tailwind frontend using Vite, and a Python FastAPI backend,
in the folder structure specified in Module 1 Section 6.

1. In frontend/src/styles/tokens.css, define CSS custom properties for:
   - Colors: primary (Valley Green #3F6B4F), primary-hover, secondary (Pantone Green #00594C),
     bg (#FAFAF8), surface (#FFFFFF), border (#E4E4E1), text-primary, text-secondary, text-muted,
     success, warning, danger, info (muted, desaturated tones — not neon).
   - Spacing scale on a 4px base: xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48.
   - Radius: sm=6px, md=10px, lg=16px.
   - Shadows: sm/md/lg as soft, low-opacity box-shadows.
   - Transitions: fast=120ms, base=200ms, both with ease-in-out.
   Wire all of these into tailwind.config.ts theme.extend so components use Tailwind
   utility classes (bg-primary, rounded-md, shadow-sm, etc.), never hardcoded hex/px values.

2. Install lucide-react as the single icon library for the whole app.

3. Build each primitive listed in Module 1 Section 3 as its own component file under
   components/ui/, each with clear TypeScript prop interfaces, and each using ONLY the
   tokens from step 1 — no inline hex colors, no arbitrary pixel values.

4. Build a KPIStatCard component accepting: label (string), value (string|number),
   unit (optional string), deltaPercent (optional number), deltaDirection
   ("up"|"down"|"neutral"). Positive delta renders in success color with an up arrow,
   negative in danger color with a down arrow, neutral in text-muted with no arrow.

5. Create frontend/src/types/index.ts with the Order, ReturnRiskPrediction, and
   KPISummary interfaces exactly as specified in Module 1 Section 5.

6. Create frontend/src/lib/api-client.ts: a fetch wrapper exporting a function
   apiRequest<T>(path, options) that prefixes the API base URL, injects an
   Authorization header if a token is present, parses JSON, and throws a typed
   ApiError on any { error: {...} } response shape.

7. Scaffold backend/app/main.py as a FastAPI app with CORS enabled for the frontend
   dev origin, and a GET /health route returning {"status": "ok"}.

8. Create backend/app/core/errors.py defining a helper function error_response(code,
   message, details=None) returning the standard envelope, and a FastAPI exception
   handler that always serializes uncaught exceptions into that shape.

9. Create backend/app/ml/predictor.py that loads return_risk_model_v5.joblib and
   return_risk_encoders_v5.joblib ONCE at import time (module-level, not per-request),
   exposes a function predict_risk(df: pd.DataFrame) -> pd.DataFrame that applies the
   saved encoders to Category and ship-state, selects features in the exact order
   Category, Amount, Qty, ship-state, B2B, Month, Day_Of_Week, Price_Per_Unit, and
   returns predict_proba results as a riskProbability column. Add a GET /health/model
   route that returns {"status": "ok", "model_loaded": true} if predictor loaded
   without error, and the error envelope otherwise.

   IMPORTANT — safe encoding for unseen categories: never call encoder.transform()
   directly on raw values, since it raises ValueError on any Category or ship-state
   value not seen during training. Implement a safe_encode(encoder, series) helper that:
     a. Computes a training-mode fallback index once at load time (the most-frequent
        class the encoder saw), stored alongside the loaded model, e.g. in a dict
        fallback_index = {"Category": .., "ship-state": ..}. If the true training
        frequency isn't recoverable from the saved encoder alone, default to index 0
        and log a warning, but prefer computing the true mode if a reference
        distribution is available.
     b. For each value in the series: if it's in encoder.classes_, transform normally;
        otherwise substitute the fallback index and mark that row.
     c. predict_risk() must return a boolean usedFallback column alongside
        riskProbability — True for any row where a fallback substitution occurred on
        Category or ship-state. This lets the frontend (Module 7) show a
        "low confidence — unfamiliar category" badge rather than presenting a
        fabricated-looking score at full confidence.
   Never silently drop rows or hard-error on unseen categories — every row must get a
   prediction plus an honest confidence signal.

Do not build any page layouts, routing, or business logic beyond what's listed above —
those belong to later modules.
```

### 9. Acceptance Criteria
- [ ] A `/dev/components` style-guide route renders every primitive with all its variants/states (default, hover, disabled, loading, error) side by side.
- [ ] No component file contains a hardcoded hex color, pixel value, or ad-hoc font size — everything traces to a token.
- [ ] `GET /health` returns 200 with the standard success shape.
- [ ] `GET /health/model` returns `model_loaded: true` and does so without reloading the model on repeated requests (verify via timing — first request may be slower, subsequent ones should be fast).
- [ ] A forced backend exception (e.g. a deliberately broken test route) returns the standard error envelope, not a raw stack trace.
- [ ] TypeScript compiles with zero `any` types in `types/index.ts`.

### 10. Common Mistakes
- Defining colors/spacing directly in component files "just this once" — this is exactly how design drift starts. Always add a token first, even for a single use.
- Loading the joblib model inside the request handler instead of at startup — this will silently work in testing and then tank latency/throughput in production.
- Skipping the `/dev/components` style guide to "save time" — this is the cheapest place to catch inconsistency; skipping it pushes the cost into every later module.
- Choosing a second icon set later because "lucide doesn't have this one icon" — pick a workaround within the single library instead; mixed icon sets are visually obvious and cheap-looking.
- Building loading/empty/error states as an afterthought per-page instead of using the shared primitives — this is the #1 way a dashboard ends up feeling inconsistent.

### 11. Future Enhancements
- Dark mode: token structure above supports it (swap CSS variable values under a `[data-theme="dark"]` selector) but is explicitly out of scope until after Module 8.
- Component-level Storybook setup, if the team grows beyond a single AI agent / solo dev.
- Design token sync from a design tool (Figma tokens) once a designer is involved.

### Open Questions — Resolved
- **Unseen categories at prediction time:** not guaranteed to be pre-filtered. `predictor.py` must handle them internally via the fallback-encoding strategy in Section 8, item 9 — never assume upstream cleaning has removed them.
- **Dev ports:** no special requirement. Keep Vite's `5173` and FastAPI's `8000` defaults, exposed via env vars for later deployment flexibility.

### 12. Deliverables
- `frontend/` scaffold with tokens, Tailwind config, and all primitives from Section 3 built and rendering in a style-guide route
- `backend/` scaffold with health routes, error envelope, and working model predictor
- `frontend/src/types/index.ts` with shared types
- `frontend/src/lib/api-client.ts`
- `backend/app/ml/predictor.py` with the model loaded and verified
- This SOP file, committed at `docs/ProfitLens_SOP.md`

---

## Module 2 — Landing Page

### 1. Objective
Build the public, unauthenticated marketing page at `/` that introduces ProfitLens, explains what it does in business terms (not ML terms), and converts a visiting seller into a signup. This is the only page a prospective customer sees before trusting the product with their sales data — it has to read as a real, funded SaaS product, not a project demo.

### 2. Purpose
Sellers evaluating a new analytics tool decide credibility in seconds, largely from visual polish and clarity of value proposition — before they ever see the dashboard. The landing page also does real product-definition work: forcing precise, jargon-free language for "profitability" and "return risk" here keeps the rest of the product's copy consistent, since every later tab's empty states, tooltips, and headers should sound like they came from the same page.

### 3. UI Components
All built from Module 1 primitives — no new primitives should be needed here; if one seems necessary, that's a signal to go back and generalize a Module 1 component instead.

- **Top navigation bar**: logo/wordmark, anchor links (Features, Pricing, About), Login button (ghost), Sign Up button (primary) — sticky on scroll with a subtle background/shadow transition once scrolled
- **Hero section**: headline, one-sentence subheadline, primary CTA button ("Start Free" or similar), secondary CTA (ghost, e.g. "See how it works"), a supporting visual (product screenshot or abstracted chart illustration — not a stock photo)
- **Trust bar** (optional but recommended): small row of "Works with Amazon · Flipkart · Meesho · Myntra" marketplace logos/wordmarks, reinforcing multi-platform vision without overclaiming current support
- **Feature section** (3–4 feature cards using Card primitive): each with icon, short title, 1–2 sentence description — e.g. "Profitability Analytics," "Return Risk Prediction," "Actionable Recommendations," "Any Marketplace, One Dashboard"
- **How it works section**: 3-step horizontal process (Upload → Analyze → Decide), each step as a numbered card
- **Benefits/value section**: a two-column layout — pain points on the left ("Spreadsheets don't tell you if you're profitable"), outcomes on the right ("See true profit per category in minutes")
- **Testimonials placeholder section**: 2–3 Card-based testimonial slots with a clear `// TODO: replace with real customer testimonials` marker in code — do not fabricate fake customer names/quotes in a real product; render clearly-labeled placeholder content or omit the section entirely until real testimonials exist
- **Pricing placeholder section**: simple 3-tier pricing card layout (e.g. Starter / Growth / Enterprise) with placeholder pricing clearly marked as illustrative — do not present fabricated real-looking prices as final
- **Footer**: links (Product, Company, Legal, Contact), copyright, social links — minimal, not cluttered
- **CTA banner** (above footer): repeat the primary signup CTA once more for users who scrolled the whole page

### 4. User Experience
1. Visitor lands on `/`. Hero communicates the value proposition within 3 seconds of reading (headline + subheadline), no scrolling required to understand what the product does.
2. Visitor scrolls through features and "how it works" — each section fades/slides in gently on scroll (subtle, per Module 1 motion tokens; no parallax gimmicks).
3. Visitor can click "Login" (goes to Module 3 auth) or "Sign Up" / "Start Free" (also goes to Module 3, signup tab) at any scroll position via the sticky nav.
4. Visitor reaches the bottom CTA banner if they scroll the full page — a second conversion opportunity — then footer.
5. All CTA buttons route to the same signup entry point; there should be exactly one funnel, not competing paths.

### 5. Data Requirements
- Fully static content — no backend calls, no live data. All copy and feature descriptions are hardcoded content, ideally pulled from a single `landingContent.ts` config file (not scattered inline strings) so copy changes don't require touching component logic.
- No auth check needed to view this page, but if a valid session already exists, redirect straight to `/dashboard` instead of showing the marketing page again (small but important UX detail — logged-in users should never see the logged-out marketing page).

### 6. Folder Structure
```
frontend/src/pages/landing/
├── LandingPage.tsx
├── sections/
│   ├── HeroSection.tsx
│   ├── TrustBar.tsx
│   ├── FeatureSection.tsx
│   ├── HowItWorksSection.tsx
│   ├── BenefitsSection.tsx
│   ├── TestimonialsSection.tsx
│   ├── PricingSection.tsx
│   └── CTABanner.tsx
├── landingContent.ts        # all copy/content config, no hardcoded strings in components
└── LandingNav.tsx
```

### 7. Implementation Order
1. `landingContent.ts` first — write and finalize all copy before touching layout, so section components are simple renderers of a content object, not copywriting exercises.
2. `LandingNav.tsx` with sticky/scroll-shadow behavior.
3. `HeroSection.tsx` — get this pixel-right before anything else; it's the highest-leverage section on the page.
4. `FeatureSection.tsx` and `HowItWorksSection.tsx`.
5. `TrustBar.tsx` and `BenefitsSection.tsx`.
6. `PricingSection.tsx` and `TestimonialsSection.tsx` (placeholder-clear).
7. `CTABanner.tsx` and footer.
8. Assemble `LandingPage.tsx`, add scroll-in fade animations last, once static layout is confirmed correct — animation is a polish pass, not a structural one.
9. Wire the logged-in-redirect check.

### 8. AI Coding Instructions
```
Build the ProfitLens landing page at frontend/src/pages/landing/, using ONLY components
from frontend/src/components/ui/ (Module 1) for buttons, cards, and badges. Do not
introduce new primitive components — compose existing ones.

1. Create landingContent.ts exporting a typed config object containing: hero
   {headline, subheadline, primaryCta, secondaryCta}, features (array of {icon, title,
   description}, 4 items: Profitability Analytics, Return Risk Prediction, Actionable
   Recommendations, Any Marketplace One Dashboard), howItWorks (array of 3 {step,
   title, description}: Upload your sales report / We analyze profit and return risk /
   Get clear business recommendations), benefits (array of {painPoint, outcome} pairs),
   pricingTiers (array of 3 {name, price, tagline, features[]} — mark price fields
   clearly as placeholder, e.g. a `isPlaceholder: true` flag consumed by the component
   to render a "Pricing coming soon" style badge rather than a hard number if real
   pricing isn't finalized), testimonials (array, can be empty — component must render
   nothing or a "coming soon" state if this array is empty, never fabricated quotes).

2. Build LandingNav.tsx: fixed top nav, transparent background at scroll position 0,
   transitioning to bg-surface with shadow-sm after 40px of scroll (use a scroll
   listener with a threshold, transition per --transition-base). Contains logo,
   anchor nav links, Login (ghost Button), Sign Up (primary Button).

3. Build HeroSection.tsx: two-column layout on desktop (copy left, visual right),
   single-column stacked on mobile. Headline uses the display/h1 type token. Primary
   and secondary CTA buttons from Module 1 Button component.

4. Build FeatureSection.tsx and HowItWorksSection.tsx as grids of Card components
   consuming landingContent.ts arrays — no hardcoded feature text in the component file.

5. Build PricingSection.tsx: 3-column card grid, middle tier visually emphasized
   (e.g. slightly elevated shadow or a "Most Popular" Badge) as is conventional, but
   only if content config marks one as recommended — don't hardcode which tier is
   "popular" in the component.

6. Build TestimonialsSection.tsx to early-return null (render nothing) if
   landingContent.testimonials is an empty array, rather than rendering empty cards.

7. Add scroll-triggered fade-in animation (IntersectionObserver-based, not a scroll-jank
   library) to each section wrapper, respecting prefers-reduced-motion.

8. In App.tsx routing, add a check: if a valid auth token/session exists, redirect "/"
   to "/dashboard" instead of rendering LandingPage.

Use only Tailwind utility classes wired to Module 1 tokens. No new colors, shadows, or
spacing values outside the token scale.
```

### 9. Acceptance Criteria
- [ ] Page is legible and fully functional at mobile (375px), tablet (768px), and desktop (1440px) widths.
- [ ] Every CTA button (nav, hero, bottom banner) routes to the same signup destination.
- [ ] No fabricated customer names, quotes, or "final" pricing numbers appear anywhere — placeholders are visually and honestly marked as such.
- [ ] Scroll-in animations respect `prefers-reduced-motion` (no animation plays if the user has that OS setting enabled).
- [ ] A logged-in user visiting `/` is redirected to `/dashboard`, not shown the marketing page.
- [ ] All colors, spacing, radii, and shadows trace to Module 1 tokens — zero new hardcoded values introduced.
- [ ] Lighthouse/basic performance check: hero image/visual is optimized (no multi-MB unoptimized image shipped).

### 10. Common Mistakes
- Writing filler "Lorem ipsum"-style feature copy instead of the specific, business-language copy this product needs — vague copy undermines the "not a demo" goal as much as bad visuals would.
- Fabricating realistic-looking testimonials or customer logos — this is a trust and credibility risk, not just a style choice; leave the section honestly empty or clearly marked "coming soon" instead.
- Over-animating: parallax scroll effects, bouncy easing, or auto-playing carousels contradict the "calm, professional" design philosophy from the brief.
- Hardcoding a "Most Popular" pricing tier or feature list directly in the component instead of driving it from content config — makes future copy/pricing changes require a code change.
- Forgetting the logged-in redirect, causing returning users to see the marketing page instead of landing in their dashboard.

### 11. Future Enhancements
- Real testimonials and case studies once early customers exist.
- Finalized, non-placeholder pricing tiers, likely wired to a billing provider (Stripe) in a later phase.
- A live, interactive product demo embedded in the hero (e.g. an example dashboard with sample data) once Module 5–7 dashboard components are stable enough to reuse here.
- Localization if targeting non-English-speaking sellers.

### 12. Deliverables
- `frontend/src/pages/landing/` fully built per Section 6 folder structure
- `landingContent.ts` with all copy centralized and typed
- Logged-in redirect logic wired into routing
- Responsive, animated (motion-respectful) landing page passing all Section 9 acceptance criteria

---

## Module 3 — Authentication

### 1. Objective
Build real, production-shaped authentication: signup, login, logout, forgot/reset password, and session persistence via JWT — backed by a Postgres `users` table. Every other authenticated page (Upload, Dashboard, Settings, Export) depends on this module's session contract, so its API shape needs to be right the first time.

### 2. Purpose
This is sellers' business data — profitability and return-risk numbers most sellers wouldn't want a competitor to see. Auth isn't a formality here; it's the first real trust signal, alongside the landing page, that a prospective customer evaluates before uploading anything. Building it properly now (hashed passwords, real JWT rotation, rate-limited login) avoids a security-driven rewrite later.

### 3. UI Components
Built from Module 1 primitives — Input, Button, Card, Toast, ErrorState:
- **AuthLayout**: centered card on a subtly branded background (not the full marketing page chrome — a focused, distraction-free auth shell)
- **LoginForm**: email, password, "Forgot password?" link, submit button (loading state while request is in flight), inline field-level error states, general-error Toast for failed attempts (generic message — see Common Mistakes on user enumeration)
- **SignupForm**: email, password, confirm password, password strength indicator (weak/medium/strong, computed client-side, non-blocking), terms-acknowledgement checkbox, submit button
- **ForgotPasswordForm**: email input only, submit button, success state that always shows the same "if that email exists, a reset link was sent" message regardless of whether the email is registered
- **ResetPasswordForm**: new password + confirm password, only rendered when a valid reset token is present in the URL; shows an ErrorState if the token is missing/expired/invalid
- **AuthTabs**: switches between Login/Signup within the same `/auth` route (per Module 1 Tabs primitive)
- **RequireAuth wrapper**: not a visible UI component but a routing guard — redirects unauthenticated users to `/auth`, preserving the originally-requested path to return to after login

### 4. User Experience
1. Unauthenticated visitor clicks "Sign Up" (from landing page) → lands on `/auth?tab=signup`.
2. Fills email/password/confirm → client-side validation (format, match, minimum strength) before submit → on success, receives access token + refresh cookie, redirected straight to `/upload` (first-time users have no data yet, so Upload — not an empty Dashboard — is the correct landing point).
3. Returning user clicks "Login" → `/auth?tab=login` → on success redirected to `/dashboard` (or to whatever protected path they originally tried to reach, if `RequireAuth` redirected them there first).
4. User forgets password → "Forgot password?" → enters email → always sees the same neutral confirmation message → receives email with a time-limited reset link → `/auth/reset-password?token=...` → sets new password → redirected to login with a success Toast.
5. Session expiry: if the access token expires mid-session, the API client (Module 1) silently attempts a refresh using the httpOnly refresh cookie; only if that also fails does the user get redirected to `/auth` with a "session expired" message — no jarring logout on every 15-minute token expiry.

### 5. Data Requirements

**Postgres schema — `users` table:**
```
id                 UUID PRIMARY KEY DEFAULT gen_random_uuid()
email              TEXT UNIQUE NOT NULL
password_hash      TEXT NOT NULL
created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
last_login_at      TIMESTAMPTZ NULL
email_verified_at  TIMESTAMPTZ NULL   -- reserved for future email verification, not enforced yet
```

**`password_reset_tokens` table:**
```
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
token_hash  TEXT NOT NULL           -- store a hash of the token, never the raw token
expires_at  TIMESTAMPTZ NOT NULL     -- short-lived, e.g. 30 minutes
used_at     TIMESTAMPTZ NULL         -- set on use, prevents token replay
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
```

**API endpoints (all return the Module 1 standard error envelope on failure):**
- `POST /auth/signup` — body `{email, password}` → creates user, returns access token + sets refresh cookie
- `POST /auth/login` — body `{email, password}` → validates, returns access token + sets refresh cookie, updates `last_login_at`
- `POST /auth/logout` — clears refresh cookie server-side (invalidate/blacklist if using a token table, or short-lived enough to not need one)
- `POST /auth/refresh` — reads httpOnly refresh cookie → issues new access token
- `POST /auth/forgot-password` — body `{email}` → always returns the same success response regardless of whether the email exists; sends reset email only if it does
- `POST /auth/reset-password` — body `{token, newPassword}` → validates token hash + expiry + unused, updates password, marks token used
- `GET /auth/me` — returns current user's `{id, email, createdAt}` given a valid access token

**Token strategy:**
- Access token: short-lived JWT (15 min), returned in the response body, held in memory on the frontend (not `localStorage`, to reduce XSS exposure) — lost on hard refresh, recovered transparently via the refresh flow.
- Refresh token: longer-lived (7–30 days), stored as an `httpOnly`, `Secure`, `SameSite=Strict` cookie — never exposed to JS. Since it's a cookie, add basic CSRF protection on state-changing auth routes (e.g. a double-submit CSRF token or same-site cookie policy, given `SameSite=Strict` already blocks most cross-site cookie use).
- Passwords hashed with bcrypt or argon2 (argon2 preferred if available) — never store or log raw passwords, and never log full tokens either.

**Email delivery:** abstract behind an `EmailService` interface with a single method `sendPasswordResetEmail(to, resetLink)`. In development, implement a console/log-based mock; production implementation (SendGrid/Postmark/SES) is a config swap, not a code change.

**Rate limiting:** `/auth/login` and `/auth/forgot-password` need basic rate limiting (e.g. per-IP and per-email, 5 attempts / 15 min) to blunt brute-force and email-bombing.

### 6. Folder Structure
```
frontend/src/pages/auth/
├── AuthPage.tsx              # hosts AuthTabs (Login/Signup)
├── LoginForm.tsx
├── SignupForm.tsx
├── ForgotPasswordForm.tsx
├── ResetPasswordPage.tsx      # separate route: /auth/reset-password
└── AuthLayout.tsx
frontend/src/lib/
└── auth-context.tsx           # React context holding access token in memory + user info
frontend/src/routing/
└── RequireAuth.tsx

backend/app/
├── api/
│   └── auth.py                 # all /auth/* routes
├── models/
│   └── user.py                 # Pydantic schemas: UserCreate, UserLogin, UserPublic, TokenPair
├── services/
│   ├── auth_service.py         # signup/login/refresh/logout logic
│   ├── password_reset_service.py
│   └── email_service.py        # EmailService interface + dev mock + prod implementation
├── db/
│   ├── models.py                # SQLAlchemy models: User, PasswordResetToken
│   └── session.py               # DB session/connection handling
└── core/
    ├── security.py              # password hashing, JWT encode/decode, CSRF helper
    └── rate_limit.py
```

### 7. Implementation Order
1. Postgres schema + migrations for `users` and `password_reset_tokens` (use Alembic).
2. `core/security.py`: password hashing + JWT encode/decode helpers, unit-testable in isolation before any route exists.
3. `POST /auth/signup` + `POST /auth/login` end-to-end, confirmed via curl/Postman before touching frontend.
4. `POST /auth/refresh` + `POST /auth/logout`.
5. Frontend `auth-context.tsx` (in-memory access token) + `api-client.ts` integration: attach access token to requests, attempt silent refresh on 401.
6. `LoginForm.tsx` + `SignupForm.tsx` + `AuthPage.tsx`, wired to real endpoints.
7. `RequireAuth.tsx` route guard, applied to `/upload`, `/dashboard`, `/settings`, `/export` routes (even though those pages don't exist yet — the guard can wrap placeholder routes now).
8. `password_reset_tokens` flow: `email_service.py` mock, `/auth/forgot-password`, `/auth/reset-password`, then `ForgotPasswordForm.tsx` + `ResetPasswordPage.tsx`.
9. Rate limiting on `/auth/login` and `/auth/forgot-password` last, once the happy path is fully verified — rate limiting is easy to get wrong and blocks your own testing if added too early.

### 8. AI Coding Instructions
```
Implement full multi-user authentication for ProfitLens: Postgres-backed users,
JWT access tokens, httpOnly refresh cookies, and forgot/reset password via email.

BACKEND:
1. Add SQLAlchemy models for `users` and `password_reset_tokens` exactly per the
   schema in Module 3 Section 5. Set up Alembic migrations.
2. In backend/app/core/security.py: implement hash_password/verify_password using
   argon2 (fall back to bcrypt if argon2 isn't available in the environment), and
   create_access_token(user_id, expires_minutes=15) / decode_access_token(token)
   using a JWT secret from environment config (never hardcoded).
3. Implement POST /auth/signup: validate email uniqueness, hash password, create
   user row, return {accessToken} in body and set a refresh token as an httpOnly,
   Secure, SameSite=Strict cookie (long-lived, e.g. 7 days, also a JWT, signed
   separately or with a distinct claim from the access token).
4. Implement POST /auth/login: verify email+password against stored hash using
   verify_password (constant-time comparison via the library, not manual string
   compare), update last_login_at, return the same token shape as signup. On
   failure, return a GENERIC error message ("Invalid email or password") — do not
   reveal whether the email exists or the password was wrong (prevents user
   enumeration).
5. Implement POST /auth/refresh: read the refresh cookie, validate it, issue a new
   access token. Implement POST /auth/logout: clear the refresh cookie.
6. Implement POST /auth/forgot-password: ALWAYS return the same success response
   regardless of whether the email exists. If it does exist, generate a random
   token, store only its hash in password_reset_tokens with a 30-minute expiry,
   and call email_service.sendPasswordResetEmail with a link containing the RAW
   token (never store the raw token server-side).
7. Implement POST /auth/reset-password: look up the token by hashing the incoming
   raw token and comparing, check expires_at > now() and used_at IS NULL, update
   the user's password_hash, mark the token used_at = now(). Reject (generic
   error) if the token is invalid, expired, or already used.
8. Implement GET /auth/me: given a valid access token, return {id, email,
   createdAt}.
9. Add basic per-IP + per-email rate limiting to /auth/login and
   /auth/forgot-password (5 attempts per 15 minutes is a reasonable default).
10. Implement email_service.py as an interface with sendPasswordResetEmail(to,
    resetLink); provide a dev implementation that logs the link to console, and
    leave a clearly marked seam for a production provider (SendGrid/Postmark/SES)
    to be swapped in via config, not code changes.

FRONTEND:
11. Create auth-context.tsx: React context holding {accessToken, user, isLoading},
    with login/signup/logout functions that call the API and store the access
    token ONLY in memory (React state), never localStorage or sessionStorage.
12. Update api-client.ts (from Module 1) to attach the in-memory access token as
    an Authorization header, and on a 401 response, attempt POST /auth/refresh
    once (credentials included, so the httpOnly cookie is sent), retry the
    original request on success, or clear auth state and redirect to /auth on
    failure.
13. Build AuthPage.tsx with AuthTabs switching Login/Signup, both using Module 1
    Input/Button/Toast primitives. Show field-level errors from validation
    (email format, password confirmation match, minimum length) before hitting
    the API, and a generic Toast for API-level auth failures.
14. Build ForgotPasswordForm.tsx and ResetPasswordPage.tsx (route
    /auth/reset-password, reads ?token= from the URL). ResetPasswordPage shows
    an ErrorState if no token is present.
15. Build RequireAuth.tsx as a route wrapper: if no access token AND a refresh
    attempt also fails, redirect to /auth, preserving the originally-requested
    path (e.g. via a redirect query param) to return to after successful login.
    Apply it to /upload, /dashboard, /settings, /export routes.

Never log raw passwords or raw tokens anywhere, including error logs.
```

### 9. Acceptance Criteria
- [ ] Signup creates a real Postgres row with a hashed (never plaintext) password.
- [ ] Login with correct credentials returns a working access token; login with wrong password OR non-existent email returns the identical generic error message.
- [ ] Access token is never present in `localStorage`/`sessionStorage` — verify via browser devtools.
- [ ] Refresh cookie is `httpOnly` (not readable via `document.cookie` in devtools console).
- [ ] Letting the access token expire (or simulating it) triggers a silent refresh, not an immediate logout.
- [ ] Forgot-password always returns the same response for both real and fake emails, verified by testing both.
- [ ] Reset-password rejects an expired token, an already-used token, and a malformed token, each with the same generic error.
- [ ] Rate limiting kicks in after repeated failed login attempts from the same IP/email.
- [ ] `RequireAuth` correctly redirects an unauthenticated user away from `/dashboard`, and returns them there after successful login.

### 10. Common Mistakes
- Returning different error messages for "email not found" vs. "wrong password" — this is a user-enumeration vulnerability, letting an attacker confirm which emails have accounts.
- Storing the access token in `localStorage` "for simplicity" — reintroduces the exact XSS token-theft risk the in-memory approach is designed to avoid.
- Storing raw password-reset tokens in the database instead of a hash — if the DB is ever exposed, raw tokens are immediately usable; hashed tokens are not.
- Sending a different forgot-password response depending on whether the email exists — leaks the same enumeration information through a different endpoint.
- Adding rate limiting before the happy path is confirmed working — you end up debugging your own lockouts instead of real bugs.
- Forgetting `SameSite`/`Secure` cookie flags in local dev and then discovering cookies silently don't work once deployed to HTTPS-only production.

### 11. Future Enhancements
- Email verification enforcement (`email_verified_at`) — currently just a reserved column, not yet required for login.
- OAuth/social login (Google) if seller onboarding friction becomes a problem.
- Multi-factor authentication for higher-security accounts.
- Session/device management UI ("log out of all devices").
- Account deletion / data export flows for compliance (GDPR-style requests), relevant once real customer data exists.

### 12. Deliverables
- Postgres migrations for `users` and `password_reset_tokens`
- All 7 `/auth/*` endpoints implemented and manually verified via curl/Postman
- `auth-context.tsx`, `api-client.ts` refresh integration, `RequireAuth.tsx`
- `AuthPage.tsx` (Login/Signup), `ForgotPasswordForm.tsx`, `ResetPasswordPage.tsx`
- Dev-mode `email_service.py` logging reset links to console, with a clear seam for a production email provider

---

## Module 4 — Upload & Schema Detection

### 1. Objective
Build the authenticated `/upload` page and its backend pipeline: accept a seller's raw sales-report CSV, detect which marketplace it came from, map its columns to ProfitLens's internal standard schema, validate the data, run it through the existing cleaning → feature-engineering → profitability → return-risk pipeline, and hand off a processed dataset that Modules 5–7 can read directly. This is the first module where real, user-specific data enters the system.

### 2. Purpose
The long-term vision is marketplace-independent: Amazon today, Flipkart/Meesho/Myntra later, all without rewriting the pipeline. That only works if column mapping is treated as a first-class, inspectable step now — not hardcoded Amazon column names sprinkled through later modules. This module is also where `preprocessing.py`, `feature_engineering.py`, and the return-risk model's Merchant-only scope decision (from the original ML work) get ported from standalone scripts into a reusable backend service, so they run once per upload instead of being re-derived by hand.

### 3. UI Components
- **FileDropzone**: drag-and-drop + click-to-browse CSV upload, accepts `.csv` only, shows filename/size before submit, client-side size limit check (e.g. reject > 50MB with a clear message, configurable)
- **UploadProgressBar**: multi-stage progress — Uploading → Detecting Schema → Awaiting Mapping Confirmation (if needed) → Processing → Ready — each stage a distinct visual state, not a single ambiguous spinner
- **MarketplaceBadge**: shows detected marketplace ("Amazon — 94% confidence") once schema detection completes; shows "Unrecognized — manual mapping required" if confidence is below threshold
- **ColumnMappingTable**: one row per required internal field, showing the auto-detected source column + a confidence indicator, with a Select dropdown to override the mapping manually; unmapped required fields are visually flagged (Badge: "Required — not mapped") and block continuation
- **ValidationWarningsList**: post-mapping, pre-processing — lists row-level issues found (e.g. "1,204 rows have missing `ship-state` and will be excluded from return-risk scoring", "312 Cancelled orders detected — excluded from risk labeling per business rule") using EmptyState/Badge primitives, not alarming red error styling for expected/handled conditions
- **FileSummaryCard**: post-processing — row count, date range, categories found, total rows excluded and why, marketplace detected — the "receipt" confirming what ProfitLens understood from the file
- **Continue button**: disabled until processing status is `ready`; routes to `/dashboard`
- **ErrorState**: for hard failures (corrupt CSV, encoding issues, empty file, no recognizable columns at all)

### 4. User Experience
1. Authenticated user lands on `/upload` (first-time signups land here directly per Module 3's post-signup redirect).
2. Drags in a CSV → `UploadProgressBar` shows "Uploading" → backend receives file, parses headers only (not full data yet) → responds with detected marketplace + proposed column mapping + confidence scores.
3. If overall confidence is high and no required field is ambiguous, mapping is presented read-only with an "auto-detected" note, user can still expand to review/override.
4. If any required field is unmapped or low-confidence, `ColumnMappingTable` requires the user to confirm/correct before continuing — this is a gate, not a suggestion.
5. User clicks "Confirm & Process" → `UploadProgressBar` moves to "Processing" → backend runs cleaning, feature engineering, profitability calc, and return-risk scoring (Merchant-fulfilled rows only, per the existing model's scope) → frontend polls status until `ready`.
6. `FileSummaryCard` appears with the processing "receipt." User clicks "Continue" → `/dashboard`.
7. If the user already has a processed dataset and uploads a new file, they're warned ("This will replace your current dataset") before the new upload overwrites the old one — MVP scope is one active dataset per user (see Section 11 for multi-dataset as a future enhancement).

### 5. Data Requirements

**`uploads` table:**
```
id                  UUID PRIMARY KEY DEFAULT (Python uuid.uuid4, per Module 3 convention)
user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
original_filename   TEXT NOT NULL
marketplace_detected TEXT NULL          -- e.g. "amazon", null if undetected
detection_confidence FLOAT NULL
status              TEXT NOT NULL       -- 'uploaded' | 'mapping_required' | 'processing' | 'ready' | 'failed'
row_count_raw       INTEGER NULL
row_count_processed INTEGER NULL
row_count_excluded  INTEGER NULL
error_message        TEXT NULL
uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
processed_at        TIMESTAMPTZ NULL
```

**`orders` table** (the processed, standard-schema dataset each upload produces — one active upload's worth of rows per user for MVP):
```
id                UUID PRIMARY KEY
upload_id         UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE
user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE  -- denormalized for query simplicity
order_id          TEXT, date DATE, status TEXT, fulfilment TEXT,
ship_service_level TEXT, category TEXT, sku TEXT, qty INTEGER, amount FLOAT,
ship_state TEXT, ship_city TEXT, b2b BOOLEAN,
estimated_cogs FLOAT, platform_fee FLOAT, shipping_cost FLOAT, gst FLOAT,
return_loss FLOAT, estimated_profit FLOAT,
return_flag INTEGER NULL,         -- ground truth if determinable, else null
risk_probability FLOAT NULL,      -- from predictor, Merchant-fulfilled rows only
used_fallback BOOLEAN NULL        -- per Module 1's safe-encoding contract
```
(Column names shown in snake_case for the DB; map to the camelCase `Order` type from Module 1 at the API boundary, not throughout the backend.)

**Marketplace schema registry** (`backend/app/services/schema_registry.py`): a config, not a database table — a dict per marketplace mapping each internal canonical field to a list of known header aliases, e.g.:
```
"amazon": {
  "order_id": ["Order ID"], "date": ["Date"], "status": ["Status"],
  "fulfilment": ["Fulfilment"], "category": ["Category"], "qty": ["Qty"],
  "amount": ["Amount"], "ship_state": ["ship-state", "Ship State"],
  "b2b": ["B2B"], ...
}
```
Start with `"amazon"` fully populated from the existing dataset's real headers; add `"flipkart"`, `"meesho"`, `"myntra"` as empty/stub entries with a comment marking them for future population — this keeps the registry pattern real without inventing schemas for marketplaces not yet tested against actual sample files.

**Detection algorithm:** normalize incoming headers (lowercase, strip whitespace/punctuation) and compare against each marketplace's alias list using exact match first, then fuzzy string similarity (e.g. `difflib.SequenceMatcher` or a Levenshtein-based library) as a fallback. Confidence = proportion of required fields matched at reasonable similarity. The marketplace with the highest confidence is proposed; if the top confidence is below a threshold (e.g. 70%), mark as "unrecognized" and require full manual mapping against the internal canonical field list directly (not against any specific marketplace's aliases).

**API endpoints:**
- `POST /uploads` — multipart file upload → parses headers + a small preview sample only, runs detection, creates an `uploads` row with status `uploaded` or `mapping_required`, returns `{uploadId, marketplaceDetected, confidence, proposedMapping, previewRows}`
- `POST /uploads/{uploadId}/confirm-mapping` — body `{mapping: {internalField: sourceColumn}}` → validates all required fields are mapped, updates status to `processing`, kicks off the full pipeline (synchronously for MVP row counts in the tens of thousands; consider a background task queue only if processing time becomes a real UX problem — see Section 11)
- `GET /uploads/{uploadId}/status` — polled by frontend, returns `{status, rowCountRaw, rowCountProcessed, rowCountExcluded, errorMessage}`
- `GET /uploads/{uploadId}/summary` — returns the full `FileSummaryCard` data once `status: ready`
- `GET /uploads/current` — returns the user's currently-active upload (if any), so `/dashboard` and `/upload` both know whether processed data already exists

### 6. Folder Structure
```
frontend/src/pages/upload/
├── UploadPage.tsx
├── FileDropzone.tsx
├── UploadProgressBar.tsx
├── ColumnMappingTable.tsx
├── ValidationWarningsList.tsx
└── FileSummaryCard.tsx

backend/app/
├── api/
│   └── uploads.py                    # the 5 endpoints above
├── models/
│   └── upload.py                     # Pydantic schemas
├── services/
│   ├── schema_registry.py            # marketplace alias config + detection function
│   ├── schema_detection_service.py   # fuzzy matching logic, confidence scoring
│   ├── data_processing_service.py    # ports preprocessing.py + feature_engineering.py logic
│   └── risk_scoring_service.py       # wraps ml/predictor.py for the upload pipeline
└── db/
    └── models.py                     # add Upload, Order SQLAlchemy models (extends Module 3's file)
```

### 7. Implementation Order
1. `uploads` and `orders` tables + Alembic migration (additive — does not touch Module 3's `users`/`password_reset_tokens` tables).
2. `schema_registry.py` with Amazon fully populated from the real dataset's actual column headers (verify against `Amazon_Sale_Report.csv` directly, not from memory).
3. `schema_detection_service.py`: pure function, unit-testable with sample header lists before any route exists.
4. `POST /uploads` (headers + preview only, no full processing yet) — verify detection against the real Amazon file end-to-end via curl/Postman.
5. `data_processing_service.py`: port the logic from `preprocessing.py` and `feature_engineering.py` (cleaning, COGS/fee/GST/shipping/return-loss/profit calc) into a callable service function operating on a mapped DataFrame — reuse the existing assumptions (60%/10%/18%/tiered shipping/₹140) exactly, do not silently change them.
6. `risk_scoring_service.py`: wraps `predictor.py`, applies the Merchant-only scope filter before scoring (matching the original model training scope), leaves non-Merchant rows' `risk_probability` null rather than guessing.
7. `POST /uploads/{uploadId}/confirm-mapping` wiring the full pipeline together, `GET /uploads/{uploadId}/status`, `GET /uploads/{uploadId}/summary`.
8. Frontend: `FileDropzone.tsx` → `UploadProgressBar.tsx` → `ColumnMappingTable.tsx` → `ValidationWarningsList.tsx` → `FileSummaryCard.tsx`, assembled in `UploadPage.tsx` last.
9. Alongside this module (per handoff note): fix `LandingPage.tsx`'s leftover `localStorage` check to use `AuthContext`.

### 8. AI Coding Instructions
```
Build Module 4 (Upload & Schema Detection) on top of the existing Modules 1-3
architecture. Do NOT modify design tokens, UI primitives, or any authentication code.
Use the existing toast service (toast.success/error/info) for notifications — do not
create a new Toast component. Do not import GitHub/Twitter/LinkedIn icons from
lucide-react anywhere (not supported in the current version) — use generic icons
(Globe, Mail, ExternalLink, etc.) if a brand reference is ever needed.

BACKEND:
1. Add Upload and Order SQLAlchemy models per Module 4 Section 5, with an Alembic
   migration additive to the existing schema (do not alter users/password_reset_tokens).
2. Create backend/app/services/schema_registry.py: a dict keyed by marketplace name
   ("amazon", stub entries for "flipkart"/"meesho"/"myntra"), each mapping internal
   canonical field names to a list of known header aliases. Populate "amazon" by
   inspecting the actual headers in the provided Amazon_Sale_Report.csv / cleaned_data.csv
   / featured_data.csv files directly — do not guess column names from memory.
3. Create backend/app/services/schema_detection_service.py: given a list of raw CSV
   headers, normalize them (lowercase, strip punctuation/whitespace) and compare
   against each marketplace's aliases — exact match first, then fuzzy similarity
   (difflib.SequenceMatcher ratio or equivalent) as fallback. Compute a confidence
   score per marketplace as the proportion of REQUIRED fields matched above a
   similarity threshold (e.g. 0.8). Return the best-matching marketplace, its
   confidence, and a proposed {internalField: sourceColumn} mapping. If best
   confidence < 0.7, mark marketplace as null/"unrecognized" and return an empty
   proposed mapping (forcing full manual mapping).
4. Implement POST /uploads: accept multipart file upload, read only headers + first
   ~20 rows for preview (do not load the full file into memory at this stage), run
   schema_detection_service, create an Upload row (status = "mapping_required" if
   confidence < 0.7 or any required field unmapped, else "uploaded"), persist the
   raw file temporarily (e.g. to disk keyed by upload id, or directly to a staging
   table) for the confirm-mapping step to reprocess. Return {uploadId,
   marketplaceDetected, confidence, proposedMapping, previewRows}.
5. Implement backend/app/services/data_processing_service.py by porting the exact
   logic from preprocessing.py and feature_engineering.py: standardize category
   names, compute Estimated_COGS (0.60 * Amount), Platform_Fee (0.10 * Amount),
   Shipping_Cost (tiered: 0 if Cancelled, 40 if Amount<500, 70 if Amount<1000, else
   100), GST (0.18 * Amount), Return_Loss (140 if status contains
   Returned/Returning/Rejected else 0), Estimated_Profit (Amount minus all of the
   above). Do NOT change these assumptions or formulas — Module 8 will make them
   user-configurable later, this module just applies the existing fixed values.
6. Implement backend/app/services/risk_scoring_service.py wrapping ml/predictor.py:
   filter to Fulfilment == "Merchant" rows only before scoring (matching the
   original model's training scope exactly), leave risk_probability NULL for all
   non-Merchant rows rather than scoring them out-of-scope. Apply the safe-encoding
   fallback from Module 1 and populate used_fallback per row.
7. Implement POST /uploads/{uploadId}/confirm-mapping: validate every required
   internal field has a non-empty source column mapping (return a validation error
   listing which fields are missing if not), re-read the full staged file, apply
   the confirmed mapping to rename columns to internal names, run
   data_processing_service then risk_scoring_service, bulk-insert results into the
   orders table (replacing any prior orders for this user — MVP is one active
   dataset per user), update the Upload row's status to "ready" (or "failed" with
   error_message on any exception), and row count fields.
8. Implement GET /uploads/{uploadId}/status, GET /uploads/{uploadId}/summary
   (aggregate stats: row counts, date range via MIN/MAX(date), distinct categories,
   total excluded and a plain-language reason breakdown), and GET /uploads/current
   (most recent upload for the authenticated user, or null).

FRONTEND:
9. Build FileDropzone.tsx: drag-and-drop + click-to-browse, .csv only, client-side
   size check (reject > 50MB with a clear inline message), calls POST /uploads on
   drop/select.
10. Build UploadProgressBar.tsx: five explicit stages (Uploading, Detecting Schema,
    Awaiting Mapping, Processing, Ready), driven by upload status polling — never a
    single ambiguous spinner.
11. Build ColumnMappingTable.tsx: one row per required internal field, showing the
    proposed source column and a confidence Badge, with a Select to override. Any
    required field left unmapped shows a "Required — not mapped" Badge and disables
    the Confirm button until resolved.
12. Build ValidationWarningsList.tsx and FileSummaryCard.tsx consuming the
    /uploads/{uploadId}/summary response — use EmptyState/Badge primitives, and
    phrase exclusions factually (e.g. "1,204 rows excluded: missing ship-state"),
    never alarmingly, since expected exclusions (Cancelled orders, non-Merchant
    rows for risk scoring) are normal, not errors.
13. Assemble UploadPage.tsx: on mount, call GET /uploads/current — if an upload
    already exists and is "ready", show a re-upload warning ("this will replace your
    current dataset") before allowing a new file to start the flow.
14. Continue button on FileSummaryCard is disabled until status is "ready"; routes
    to /dashboard on click.

ALONGSIDE THIS MODULE: fix the known issue in frontend/src/pages/landing/LandingPage.tsx
— replace the leftover localStorage-based token check with the AuthContext hook from
Module 3. This is a real, currently-live violation of the locked "access token in
memory only" security rule and must be corrected, not left for later.
```

### 9. Acceptance Criteria
- [ ] Uploading the real `Amazon_Sale_Report.csv` is detected as "amazon" with high confidence and a fully auto-proposed mapping.
- [ ] Uploading a CSV with unrecognizable headers results in `status: mapping_required` and forces full manual mapping — it does not crash or silently guess.
- [ ] Confirming a mapping with a required field left unmapped is rejected with a clear error, not silently processed with missing data.
- [ ] Processing applies the exact same cost formulas as `feature_engineering.py` (spot-check a few rows' `Estimated_Profit` against the original script's output on the same input).
- [ ] Risk scoring is applied ONLY to Merchant-fulfilled rows; Amazon-fulfilled rows have `risk_probability: null`, not a fabricated score.
- [ ] `FileSummaryCard` numbers (row counts, exclusions) match what actually landed in the `orders` table for that upload.
- [ ] Re-uploading when a dataset already exists shows the replacement warning before proceeding.
- [ ] `LandingPage.tsx` no longer reads `localStorage` for auth state — confirmed via code review, not just behavior.

### 10. Common Mistakes
- Hardcoding Amazon's exact column names directly in `data_processing_service.py` instead of relying on the confirmed mapping — this defeats the entire schema-adaptive purpose of this module and breaks the moment a differently-formatted Amazon export (or any other marketplace) is uploaded.
- Silently guessing a mapping below the confidence threshold instead of forcing manual confirmation — a wrong silent guess produces confidently-wrong profit numbers downstream, which is worse than asking the user.
- Scoring return risk on Amazon-fulfilled orders "since we have a model anyway" — this contradicts the original ML scoping decision (Amazon orders never had reliable return labels) and produces meaningless-but-confident-looking scores.
- Loading an entire large CSV into memory during the initial detection step, before the user has even confirmed anything — parse headers + a small preview only at that stage.
- Treating expected exclusions (Cancelled orders, missing optional fields) with the same alarming visual treatment as real failures — reserve ErrorState for actual processing failures, not normal data realities.

### 11. Future Enhancements
- Background job queue (e.g. Celery/RQ) for processing, if row counts or user concurrency grow enough that synchronous processing blocks the request for too long.
- Multiple datasets per user with history/versioning, instead of MVP's single-active-dataset model.
- Populate `flipkart`/`meesho`/`myntra` entries in `schema_registry.py` once real sample exports from those marketplaces are available to test against.
- Smarter fuzzy matching (e.g. embedding-based column similarity) if simple string-similarity proves insufficient on messier real-world exports.
- Allow saving a confirmed mapping as a named template for a recurring marketplace format, so returning users don't re-map identical exports.

### 12. Deliverables
- `uploads` and `orders` tables + migration
- `schema_registry.py` (Amazon fully populated, others stubbed), `schema_detection_service.py`
- `data_processing_service.py` (ported cost/profit logic), `risk_scoring_service.py` (Merchant-only scoping preserved)
- All 5 `/uploads/*` endpoints
- `UploadPage.tsx` and its five sub-components, fully wired to real endpoints
- `LandingPage.tsx` localStorage fix applied

---

## Module 5 — Dashboard Shell, Navigation & Overview Tab

### 1. Objective
Build the authenticated application shell — sidebar navigation across all 7 planned dashboard tabs — and fully implement the first tab: **Overview**, answering "how is my business performing today?" The other 6 tabs (Profit Analytics, Return Risk, Products, Geography, Recommendations, Data Health) get real routes and clearly-labeled placeholders in this module, but only Overview gets real data wiring here; Profit Analytics and Return Risk are fully built in Modules 6–7.

### 2. Purpose
The shell is the frame every other tab lives inside, so its navigation pattern, empty/loading/error handling, and layout conventions need to be right once rather than re-solved per tab. Overview specifically exists to answer the single question a seller opens the app to ask — "am I doing okay?" — in under a few seconds of scanning, before they drill into any specific tab.

### 3. UI Components
Built from Module 1 primitives — no new primitives should be needed:
- **DashboardShell**: persistent left sidebar + top bar + main content outlet (React Router nested routes)
- **DashboardSidebar**: 7 nav items (Overview, Profit Analytics, Return Risk, Products, Geography, Recommendations, Data Health) with icons (lucide — no brand icons, per the standing rule), active-tab highlight, collapsed/expanded toggle for smaller viewports
- **DashboardTopbar**: current dataset name/upload date, user menu (email, "Log out" calling `AuthContext.logout()`), optional "Re-upload data" shortcut linking to `/upload`
- **NoDataState**: full-page EmptyState variant shown across the entire dashboard shell if `GET /uploads/current` returns none/not-ready — "Upload your first sales report to see your dashboard" with a CTA button to `/upload`. This gate lives in the shell, not per-tab, so no tab needs to re-implement it.
- **KPIGrid**: row of `KPIStatCard`s (Revenue, Estimated Profit, Profit Margin, Orders, Average Order Value, Return Rate) — 6 cards, responsive wrap
- **RevenueTrendChart**: line/area chart (Recharts) — revenue and profit lines by period
- **TopWorstCategoryCard**: two-sided card — best-performing category (by profit) and worst-performing category (by profit or by loss), each with its key number
- **TopStateCard**: top-performing state by revenue
- **RecentActivityList**: a small table/list of the most recent orders in the dataset
- **InsightsPanel**: a short list of plain-language, rule-generated observations (e.g. "Set category drove the highest profit this period"; "Profit margin is down 3.2% vs. the prior period") — deterministic text generated from the same aggregates as the cards above, not a separate data source
- **Placeholder tab component** (reused across Products, Geography, Recommendations*, Data Health*): icon + "This section is coming soon" + one sentence describing what it will show, using Module 1's EmptyState primitive — not a blank page (*Recommendations and Data Health get their real spec in Modules 7 and 8 respectively; their route/placeholder is created here so navigation is complete now)

### 4. User Experience
1. User logs in (or completes Module 4 upload) → lands on `/dashboard` → `DashboardShell` checks `GET /uploads/current`.
2. If no ready dataset exists, the entire shell shows `NoDataState` with a CTA to `/upload` — sidebar still renders (so the user can see what's coming) but tab content is replaced by the empty state until data exists.
3. If a ready dataset exists, `Overview` tab loads by default: KPI cards populate first (fastest query), followed by trend chart, category/state cards, recent activity, and insights — each section shows its own `Skeleton` while loading rather than blocking the whole page on the slowest query.
4. User can click any sidebar tab; unfinished tabs show the placeholder state immediately (no loading needed — it's static).
5. Re-uploading a new file (from the top bar shortcut) takes the user through Module 4's flow again; returning to `/dashboard` afterward reflects the new dataset.

### 5. Data Requirements

**`GET /analytics/overview`** — the only new endpoint this module needs; returns:
```
{
  kpis: {
    revenue: {value, deltaPercent, deltaDirection},
    estimatedProfit: {value, deltaPercent, deltaDirection},
    profitMargin: {value, deltaPercent, deltaDirection},
    orders: {value, deltaPercent, deltaDirection},
    averageOrderValue: {value, deltaPercent, deltaDirection},
    returnRate: {value, deltaPercent, deltaDirection}
  },
  revenueTrend: [{period, revenue, profit}, ...],
  topCategory: {name, profit},
  worstCategory: {name, profit},   // most negative or lowest profit category
  topState: {name, revenue},
  recentActivity: [{orderId, date, category, amount, status}, ...],   // most recent ~10
  insights: [string, ...]           // plain-language, rule-generated
}
```

**Trend period logic (must be stated explicitly, not left implicit):** this is historical uploaded data, not a live stream, so "current vs. previous period" means: bucket the dataset's date range by calendar month; the most recent month present is "current," the month before it is "previous." If the dataset spans less than two calendar months, show the KPI values without a delta (neutral, no arrow) rather than fabricating a comparison — do not compare to zero or show a misleading 100%+ delta.

**Insight generation (rule-based, not ML/LLM in this module):** a small, explicit rule set over the same aggregates already computed, e.g.:
- if `profitMargin` delta < some negative threshold → "Profit margin declined vs. last period"
- top category by profit → "{category} is your strongest performer this period"
- worst category (by profit, if negative) → "{category} is currently operating at a loss"
- if `returnRate` for any category exceeds dataset-wide average by a meaningful margin → flag it
Keep these as clearly-labeled, deterministic rules in `analytics_service.py` — do not call an LLM for this module; that's a distinct future enhancement, not a silent scope change here.

### 6. Folder Structure
```
frontend/src/pages/dashboard/
├── DashboardShell.tsx
├── DashboardSidebar.tsx
├── DashboardTopbar.tsx
├── NoDataState.tsx
├── PlaceholderTab.tsx
├── tabs/
│   ├── OverviewTab.tsx
│   ├── ProfitAnalyticsTab.tsx      # placeholder in this module, built in Module 6
│   ├── ReturnRiskTab.tsx           # placeholder in this module, built in Module 7
│   ├── ProductsTab.tsx             # placeholder, future
│   ├── GeographyTab.tsx            # placeholder, future
│   ├── RecommendationsTab.tsx      # placeholder in this module, built in Module 7
│   └── DataHealthTab.tsx           # placeholder in this module, built in Module 8
└── components/
    ├── KPIGrid.tsx
    ├── RevenueTrendChart.tsx
    ├── TopWorstCategoryCard.tsx
    ├── TopStateCard.tsx
    ├── RecentActivityList.tsx
    └── InsightsPanel.tsx

backend/app/
├── api/
│   └── analytics.py                # GET /analytics/overview
├── models/
│   └── analytics.py                # Pydantic response schemas
└── services/
    └── analytics_service.py         # aggregation queries + insight rules
```

### 7. Implementation Order
1. `DashboardShell.tsx` + `DashboardSidebar.tsx` + `DashboardTopbar.tsx` with routing for all 7 tabs, each rendering `PlaceholderTab.tsx` initially (confirms navigation works end-to-end before any real data wiring).
2. `NoDataState.tsx` wired to `GET /uploads/current` at the shell level.
3. `analytics_service.py`: write and unit-test the aggregation queries and trend-period logic against real data in the `orders` table before building any endpoint.
4. `GET /analytics/overview` endpoint.
5. `KPIGrid.tsx` first (fastest to build and verify against the API), then `RevenueTrendChart.tsx`, then the remaining cards.
6. `InsightsPanel.tsx` last, once the aggregates it depends on are confirmed correct.
7. Replace the `OverviewTab.tsx` placeholder with the real assembled tab; leave the other 5 placeholder tabs as-is for their respective future modules.

### 8. AI Coding Instructions
```
Build Module 5 (Dashboard Shell + Overview Tab) on top of the existing Modules 1-4
architecture. Do not modify design tokens, UI primitives, or authentication code.
Use the existing toast.success/error/info service — do not create a new Toast
component. Do not import GitHub/Twitter/LinkedIn icons from lucide-react anywhere.

FRONTEND:
1. Build DashboardShell.tsx: on mount, call GET /uploads/current. If null or status
   is not "ready", render NoDataState.tsx across the full content area (sidebar
   still renders). Otherwise render the routed tab content via an outlet.
2. Build DashboardSidebar.tsx with 7 nav items in this exact order: Overview, Profit
   Analytics, Return Risk, Products, Geography, Recommendations, Data Health. Use
   lucide icons (pick semantically fitting, non-brand icons). Highlight the active
   route. Include a collapse toggle for narrow viewports.
3. Build DashboardTopbar.tsx: show the current upload's original filename and
   uploaded_at date, a user menu (email + "Log out" calling AuthContext.logout()),
   and a "Re-upload data" link to /upload.
4. Build PlaceholderTab.tsx: accepts a title and description prop, renders Module 1's
   EmptyState with a "Coming soon" framing. Wire ProfitAnalyticsTab.tsx,
   ReturnRiskTab.tsx, ProductsTab.tsx, GeographyTab.tsx, RecommendationsTab.tsx, and
   DataHealthTab.tsx to each render PlaceholderTab with tab-appropriate copy — these
   are NOT to be built out further in this module.
5. Build OverviewTab.tsx: fetch GET /analytics/overview once on mount. Render
   KPIGrid.tsx immediately once the response resolves (all 6 KPIStatCards in one
   grid); if you choose to stage the fetch into separate calls for perceived speed,
   each section (KPIGrid, RevenueTrendChart, TopWorstCategoryCard, TopStateCard,
   RecentActivityList, InsightsPanel) must show its own Skeleton independently
   while loading — never block the entire tab behind the slowest query.
6. KPIStatCard's deltaDirection must render "neutral" (no arrow, muted color) when
   the API returns a null/neutral delta (see backend note on <2 months of data) —
   do not treat a missing delta as zero or hide the card.

BACKEND:
7. Implement analytics_service.py: query the orders table for the authenticated
   user's current upload (via uploads.user_id + status='ready', join to orders).
   Bucket rows by calendar month (based on the `date` column). If the dataset spans
   2+ distinct months, treat the most recent month as "current" and the one before
   it as "previous" for delta calculations; if it spans fewer than 2 months, return
   deltaPercent: null and deltaDirection: "neutral" for every KPI — do not compute a
   fabricated comparison against zero or an empty previous period.
8. Compute: revenue (sum amount), estimatedProfit (sum estimated_profit),
   profitMargin (estimatedProfit/revenue * 100), orders (count), averageOrderValue
   (revenue/orders), returnRate (rows with return_flag=1 / total rows, among rows
   where return_flag is not null i.e. Merchant-fulfilled only — do not include
   Amazon-fulfilled rows with null return_flag in either numerator or denominator).
9. Compute revenueTrend as an array of {period, revenue, profit} per calendar month
   present in the data (or per day, if the data spans under one month — check
   actual span and choose the granularity that yields between roughly 5 and 30
   points, never a single point or an unreadably dense one).
10. Compute topCategory/worstCategory by summed estimated_profit per category, and
    topState by summed amount per ship_state.
11. Compute recentActivity as the 10 most recent rows by date (ties broken by
    created/insert order), returning orderId, date, category, amount, status.
12. Generate insights as a list of plain-language strings from simple, explicit
    threshold rules over the aggregates already computed above (see Module 5
    Section 5 for the specific rule examples) — do NOT call any external LLM/AI
    service for this module; keep this deterministic and explainable.
13. Return the full response shape from Module 5 Section 5 via GET
    /analytics/overview, using the standard error envelope on failure (e.g. no
    ready upload found for this user).
```

### 9. Acceptance Criteria
- [ ] All 7 sidebar tabs are clickable and route correctly; the 5 not-yet-built tabs show a clear, non-broken "coming soon" placeholder, never a blank page or console error.
- [ ] A user with no ready upload sees `NoDataState` with a working CTA to `/upload`, not a broken or empty Overview tab.
- [ ] KPI cards, trend chart, category/state cards, recent activity, and insights each load independently with their own skeleton — verify by throttling network speed and confirming sections populate progressively, not all-at-once after the slowest query.
- [ ] `returnRate` calculation excludes Amazon-fulfilled (null `return_flag`) rows from both numerator and denominator — spot-check the math against a manual query.
- [ ] A dataset spanning under 2 calendar months shows neutral (no arrow) KPI deltas, not a fabricated comparison.
- [ ] Insights text is generated from the exact same aggregates shown in the cards — no inconsistency between what a card says and what an insight claims.
- [ ] Logging out from the top bar user menu actually clears the in-memory access token and redirects to `/auth` (reusing Module 3's `AuthContext`, not a new logout implementation).

### 10. Common Mistakes
- Building a real backend query for the 5 placeholder tabs "since we're already in the data layer" — that's Module 6/7/8's job; scope creep here just means those modules re-derive decisions that should be made deliberately in their own spec review.
- Computing "previous period" as simply "everything before the current month" instead of the single prior month — this silently changes what the delta means and makes the number impossible to sanity-check against a mental model of "vs last month."
- Including Amazon-fulfilled rows in the return rate calculation — this reintroduces exactly the label-quality problem the original ML work (Merchant-only scoping) was designed to avoid.
- Blocking the whole Overview tab behind one large combined query instead of independently-loading sections — makes the perceived load time as slow as the single worst aggregate.
- Calling an LLM API for "insights" in this module — that's a meaningfully different scope (cost, latency, non-determinism) than what's specified here; keep this module's insights rule-based.

### 11. Future Enhancements
- LLM-generated narrative insights layered on top of (not replacing) the deterministic rule-based ones, once the product has real usage to justify the added cost/complexity.
- User-selectable trend period granularity (weekly vs. monthly) instead of the automatic choice made in Section 8 item 9.
- Comparison against category/industry benchmarks, if such data becomes available.
- Real implementations of Products and Geography tabs (currently unscoped beyond a placeholder — their full spec isn't written yet and should get its own module/review when prioritized).

### 12. Deliverables
- `DashboardShell.tsx`, `DashboardSidebar.tsx`, `DashboardTopbar.tsx`, `NoDataState.tsx`, `PlaceholderTab.tsx`
- All 7 tab routes wired, with Overview fully implemented and the other 6 rendering placeholders
- `KPIGrid.tsx`, `RevenueTrendChart.tsx`, `TopWorstCategoryCard.tsx`, `TopStateCard.tsx`, `RecentActivityList.tsx`, `InsightsPanel.tsx`
- `GET /analytics/overview` backend endpoint + `analytics_service.py`

---

## Module 6 — Profit Analytics Tab

### 1. Objective
Fully implement the Profit Analytics tab, answering "where am I making money?" — category and product-level profitability, cost structure breakdown, and monthly trend, replacing that tab's Module 5 placeholder.

### 2. Purpose
Overview tells a seller whether the business is healthy overall; Profit Analytics tells them *why*, at a granularity they can act on — which categories to lean into, which specific products are quietly losing money, and how much of every rupee of revenue is being eaten by fees, shipping, and returns before profit is realized.

### 3. UI Components
- **CategoryProfitChart**: grouped/stacked bar chart (Recharts) — revenue vs. profit per category, sorted by profit descending
- **ProfitMarginTable**: table of categories with revenue, profit, margin %, order count — sortable by any column
- **CostBreakdownChart**: single stacked bar or donut showing COGS / Platform Fee / Shipping / GST / Return Loss as proportions of total revenue, plus each as a small stat (₹ and % of revenue)
- **MonthlyProfitTrendChart**: reuse/extend Module 5's `RevenueTrendChart` pattern (add a category filter dropdown rather than building a parallel chart component from scratch)
- **ProductsTable**: paginated, sortable, searchable (by SKU or category) table — columns: SKU, Category, Units Sold, Revenue, Profit, Margin %. Negative-profit rows rendered with the danger color token, not just plain text, so loss-makers are visually obvious while scanning
- **InventoryOpportunityPanel**: rule-based, deterministic list (same pattern as Module 5's InsightsPanel) — "increase inventory" and "review/discontinue" candidates
- **ImpactStatCards**: three small `KPIStatCard`s — Shipping cost as % of revenue, Platform fee as % of revenue, GST as % of revenue

### 4. User Experience
1. User clicks "Profit Analytics" in the sidebar → tab loads category-level data first (cheapest query): `CategoryProfitChart`, `ProfitMarginTable`, `CostBreakdownChart`, `ImpactStatCards` populate first, each with independent skeletons.
2. `MonthlyProfitTrendChart` loads next, defaulting to all categories combined; user can filter to a single category via dropdown, which re-fetches just that slice.
3. `ProductsTable` loads separately (paginated — do not wait for the full SKU-level dataset before showing category data above it). Default sort: profit descending, so top performers show first; user can re-sort ascending to immediately see loss-makers, or use column sort on any field.
4. `InventoryOpportunityPanel` renders last, derived from the same aggregates.
5. Clicking a category in `CategoryProfitChart` filters `ProductsTable` to that category (cross-filtering) — this is the single interactive link between sections; no other cross-filtering is in scope for this module.

### 5. Data Requirements

**`GET /analytics/profit-overview`** (category-level, cost breakdown, trend, cheap to compute):
```
{
  categoryPerformance: [{category, revenue, profit, marginPercent, orders}, ...],  // sorted by profit desc
  costBreakdown: {
    cogs: {value, percentOfRevenue}, platformFee: {value, percentOfRevenue},
    shippingCost: {value, percentOfRevenue}, gst: {value, percentOfRevenue},
    returnLoss: {value, percentOfRevenue}
  },
  monthlyTrend: [{period, revenue, profit}, ...],       // optionally filtered by ?category=
  inventoryOpportunity: {
    increaseCandidates: [{category or sku, reason}, ...],
    reviewCandidates: [{category or sku, reason}, ...]
  }
}
```
`monthlyTrend` accepts an optional `?category=X` query param for the dropdown filter described in Section 4 — same endpoint, not a separate one.

**`GET /analytics/products`** (SKU-level, paginated — must be a separate endpoint from the above, never joined into one payload, since product count can be large):
```
Query params: page (default 1), pageSize (default 20, max 100), sortBy (revenue|profit|marginPercent|unitsSold, default profit), sortOrder (asc|desc, default desc), search (optional SKU/category substring), category (optional exact filter, for the cross-filter interaction in Section 4)

Response: {
  rows: [{sku, category, unitsSold, revenue, profit, marginPercent}, ...],
  totalRows: number, page: number, pageSize: number
}
```

**Inventory opportunity rules (deterministic, extend the same rule-based pattern from Module 5 — no LLM call in this module either):**
- Increase candidates: categories (or products, whichever aggregation reads more usefully — categories are the safer default given SKU-level noise) in the top quartile of margin% AND top half of units sold — i.e. genuinely high-performing, not just lucky-once outliers.
- Review/discontinue candidates: categories or products with negative aggregate profit across a meaningful number of orders (set a minimum order-count threshold, e.g. 5+, so a single unlucky return doesn't flag a product on tiny sample size).

**Query performance requirement (explicit, since this differs from Module 5's category-only aggregation):** `GET /analytics/products` must aggregate via SQL `GROUP BY sku` with `LIMIT`/`OFFSET` (or keyset pagination) at the database layer — never load the full `orders` table into pandas inside the request handler to paginate in-memory. With a large orders table and potentially thousands of distinct SKUs, in-memory pagination will not scale and defeats the purpose of a paginated endpoint. Add a DB index on `(user_id, sku)` and `(user_id, category)` if not already present from Module 4/5's schema.

### 6. Folder Structure
```
frontend/src/pages/dashboard/tabs/
└── ProfitAnalyticsTab.tsx           # replaces the Module 5 placeholder

frontend/src/pages/dashboard/components/
├── CategoryProfitChart.tsx
├── ProfitMarginTable.tsx
├── CostBreakdownChart.tsx
├── MonthlyProfitTrendChart.tsx      # extends/reuses Module 5's trend chart pattern
├── ProductsTable.tsx
├── InventoryOpportunityPanel.tsx
└── ImpactStatCards.tsx

backend/app/
├── api/
│   └── analytics.py                 # add GET /analytics/profit-overview, GET /analytics/products
└── services/
    └── analytics_service.py          # EXTEND existing file — add profit-analytics + products query functions, don't create a parallel service
```

### 7. Implementation Order
1. Extend `analytics_service.py` with the category-level aggregation + cost breakdown functions; verify against real data before touching the endpoint.
2. `GET /analytics/profit-overview` (without the `?category=` filter first — get the base case working).
3. `CategoryProfitChart.tsx`, `ProfitMarginTable.tsx`, `CostBreakdownChart.tsx`, `ImpactStatCards.tsx` wired to the endpoint above.
4. Add `?category=` filtering to `monthlyTrend` in the same endpoint; build `MonthlyProfitTrendChart.tsx` with the dropdown.
5. Build the SQL-level paginated products query in `analytics_service.py`, confirm performance (check the query plan / row counts) before wiring the endpoint.
6. `GET /analytics/products`, then `ProductsTable.tsx`.
7. Inventory opportunity rules, then `InventoryOpportunityPanel.tsx`.
8. Wire the `CategoryProfitChart` → `ProductsTable` cross-filter last, once both components work independently.
9. Assemble `ProfitAnalyticsTab.tsx`, replacing the Module 5 placeholder.

### 8. AI Coding Instructions
```
Build Module 6 (Profit Analytics Tab) on top of the existing Modules 1-5 architecture.
Do not modify design tokens, UI primitives, authentication, or the Overview tab.
Use useDashboard() from dashboard-context.tsx for shared upload/dataset state — do not
duplicate that fetching. Extend the existing analytics_service.py rather than creating
a new service file. Use import type for all interface/type imports (project-wide
standing rule). Never use NodeJS.Timeout in frontend code.

BACKEND:
1. In analytics_service.py, add a function computing category-level aggregates from
   the orders table for the current user's ready upload: group by category, sum
   revenue (amount) and profit (estimated_profit), compute marginPercent, count
   orders, sort by profit descending.
2. Add a function computing cost breakdown: sum estimated_cogs, platform_fee,
   shipping_cost, gst, return_loss across all orders for the current upload, plus
   each as a percentage of total revenue.
3. Add a function computing monthly trend (revenue, profit per calendar month
   present in the data), accepting an optional category filter parameter.
4. Implement GET /analytics/profit-overview combining the three functions above into
   the response shape in Module 6 Section 5, accepting an optional ?category= query
   param that filters ONLY the monthlyTrend portion of the response.
5. Add the inventory opportunity rule functions per Module 6 Section 5: increase
   candidates (top-quartile margin AND top-half units sold, at the category level),
   review candidates (negative aggregate profit with a minimum order-count threshold
   of 5 to avoid flagging on tiny sample sizes).
6. Implement a SQL-level paginated, sortable, searchable products query: GROUP BY
   sku (and category, since a SKU should map to one category but group defensively),
   compute unitsSold (sum qty), revenue (sum amount), profit (sum estimated_profit),
   marginPercent, apply sortBy/sortOrder/search/category filters and
   LIMIT/OFFSET pagination AT THE DATABASE QUERY LEVEL — do not fetch all rows into
   pandas and paginate/sort in Python. Add indexes on (user_id, sku) and
   (user_id, category) on the orders table if not already present.
7. Implement GET /analytics/products consuming that query, per the request/response
   shape in Module 6 Section 5.

FRONTEND:
8. Build CategoryProfitChart.tsx, ProfitMarginTable.tsx, CostBreakdownChart.tsx,
   ImpactStatCards.tsx, each independently loading with its own Skeleton, all
   consuming GET /analytics/profit-overview.
9. Build MonthlyProfitTrendChart.tsx: a category filter Select triggers a re-fetch
   of GET /analytics/profit-overview?category=X, updating only the trend section.
10. Build ProductsTable.tsx: paginated (controls for page/pageSize), sortable column
    headers (calling the API with sortBy/sortOrder, not client-side sorting, since
    data is paginated), a search input (debounced) for SKU/category substring
    filtering. Render any row with profit < 0 using the danger color token.
11. Build InventoryOpportunityPanel.tsx consuming the inventoryOpportunity field
    from GET /analytics/profit-overview, styled like Module 5's InsightsPanel.
12. Wire CategoryProfitChart click-through: clicking a category bar sets
    ProductsTable's category filter and re-fetches GET /analytics/products
    accordingly. This is the only cross-filter interaction in this module — do not
    add additional cross-filtering beyond this.
13. Assemble ProfitAnalyticsTab.tsx, replacing the Module 5 PlaceholderTab usage for
    this route.
```

### 9. Acceptance Criteria
- [ ] Category-level revenue/profit/margin numbers match a manual spot-check query against the `orders` table.
- [ ] Cost breakdown percentages sum to a sensible total relative to revenue (COGS% + fee% + shipping% + GST% + return-loss% + margin% ≈ 100%, modulo rounding) — use this as a correctness sanity check, not just a display feature.
- [ ] `GET /analytics/products` pagination, sorting, and search all happen server-side — verify by checking the SQL query (or query log), not just the API response shape.
- [ ] Sorting `ProductsTable` by profit ascending immediately surfaces loss-making SKUs; those rows render in the danger color.
- [ ] Inventory opportunity candidates respect the minimum order-count threshold — a single-order product with one return does not appear in "review/discontinue."
- [ ] Clicking a category in the chart correctly filters the products table to that category, and the filter is visibly indicated (not just silently applied).
- [ ] All new components use `import type` for their prop/interface imports.
- [ ] No regression in Overview tab behavior or Module 1-5 acceptance criteria.

### 10. Common Mistakes
- Loading the full `orders` table into pandas inside the products endpoint to sort/paginate in Python — this is the single most likely performance mistake in this module; it must be a SQL-level query.
- Combining `/analytics/profit-overview` and `/analytics/products` into one endpoint "for simplicity" — product-level data can be large and paginated independently; forcing it into the same payload as cheap category aggregates makes the fast data wait on the slow data.
- Flagging inventory "review/discontinue" candidates based on a tiny sample (e.g. one order that happened to be a loss) — always apply the minimum order-count threshold before surfacing a recommendation as if it were reliable.
- Building a second, parallel trend-chart component instead of extending Module 5's — leads to two slightly-different-looking charts in the same product.
- Client-side sorting/filtering a paginated table — only sorts the current page, silently giving wrong-looking results to the user (e.g. "sorting by profit" only reorders the 20 rows already fetched, not the true top 20 overall).

### 11. Future Enhancements
- Product-level (not just category-level) inventory opportunity detection, once category-level proves useful and SKU-level noise/sample-size handling is more refined.
- Export a category or product-level table directly from this tab (ties into Module 8's Report Export).
- Configurable margin/sample-size thresholds for inventory opportunity rules (currently fixed constants), likely surfaced in Module 8's Settings.

### 12. Deliverables
- `GET /analytics/profit-overview` and `GET /analytics/products` endpoints, both extending the existing `analytics_service.py`
- `ProfitAnalyticsTab.tsx` fully replacing its Module 5 placeholder
- `CategoryProfitChart.tsx`, `ProfitMarginTable.tsx`, `CostBreakdownChart.tsx`, `MonthlyProfitTrendChart.tsx`, `ProductsTable.tsx`, `InventoryOpportunityPanel.tsx`, `ImpactStatCards.tsx`

---

*Modules 7–8 to follow — each will be added to this document once the prior module is reviewed.*