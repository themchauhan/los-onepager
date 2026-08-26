# LOS One Pager

A single-page loan-origination console: a searchable application list over a
50,000-record corpus, and a tabbed one-pager for each applicant.

Built as a frontend only. The data layer sits behind one interface, so pointing
it at your real LOS API is a config change rather than a rewrite.

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # typecheck + production bundle into dist/
npm run preview  # serve the built bundle locally
```

Node 20+ (22 recommended).

---

## What's in it

**Applications list** — server-style pagination over 50,000 records. Search
across name, application number, customer ID, PAN, mobile and city; filter by
status, product, risk and state; sort on any column. Every bit of that state
lives in the URL, so a filtered view is shareable and survives a reload.

**One-pager detail** — five tabs (Basic Details, Addresses, Dedupe, Asset &
Vahan, Loan Details) with section-level editing.

**Dashboard** — portfolio aggregates by status and risk; click any bar to open
the filtered list.

### Where this deliberately departs from the source LOS screens

The screens this was modelled on are dense but hard to work in. Six changes:

| Problem in the original | What this does instead |
| --- | --- |
| Scroll down a tab and you lose track of whose record you're in | A sticky header pins applicant, status, risk, amount, EMI, tenor and ROI to the top of every tab |
| Signals that matter — a blacklisted RC, a 90-DPD history, a negative CPV — sit in individual fields across five tabs | A ranked **Needs attention** strip derives them all and links straight to the right tab |
| Most fields on any given record are blank, and they all render | **Hide empty** is on by default; the section header reports how many were hidden |
| Finding one field in a ~200-field record means knowing which tab it's on | **Find a field** filters and highlights across every section of the tab; press `/` to focus it |
| Four near-identical 20-field address blocks stacked vertically | A side-by-side comparison table with differing values highlighted, then sub-tabs for the full blocks |
| RC and Vahan shown as two 15-field blocks to compare by eye | An explicit **RC vs Vahan reconciliation** panel that does the comparison and counts mismatches |
| Dedupe as a wide horizontally-scrolling grid of green cells | One card per candidate with a match-strength meter and a field-by-field source-vs-candidate table |

Keyboard: `Alt+1`…`Alt+5` switch tabs, `/` focuses the field search, `Esc`
leaves an input.

---

## Architecture

```
src/
  api/
    types.ts        Domain model + the ApiClient interface
    mockApi.ts      In-browser implementation (default)
    httpApi.ts      Real-backend implementation — edit this one
    index.ts        Picks between them; the only thing components import
  mock/
    reference.ts    Reference vocabularies (cities, vehicles, banks…)
    generator.ts    Deterministic record generator
  components/
    DataSection.tsx One declarative component drives both read and edit views
    primitives.tsx  Field, Section, Pill, Button, Spinner…
    AppShell.tsx
  pages/
    ApplicationsList.tsx
    ApplicationDetail.tsx
    Dashboard.tsx
    tabs/           One file per tab
  lib/
    format.ts       Display formatting (INR, dd/mm/yyyy, em dash for empty)
    exceptions.ts   Derives the "Needs attention" strip
```

**React 19 · TypeScript · Vite · React Router · TanStack Query · Tailwind v4.**

TanStack Query matters more than it looks: it gives request deduplication,
caching, `keepPreviousData` so the table doesn't flash white while you page, and
cache invalidation after an edit — all of which you'd otherwise hand-roll.

### The one seam that matters

Every component imports `api` from `src/api`, and nothing else. That object
satisfies `ApiClient`:

```ts
interface ApiClient {
  listApplications(params: ListParams): Promise<Page<ApplicationSummary>>
  getApplication(id: string): Promise<Application>
  patchApplication(req: PatchRequest): Promise<Application>
  getFacets(): Promise<FacetOptions>
  getStats(): Promise<Stats>
}
```

### Why the mock behaves like a server

`mockApi` filters, sorts, paginates and adds latency before returning. The UI
therefore never sees more than one page of rows, and never learns to depend on
having the whole dataset in hand — which is the habit that makes a demo fall
over when it meets a real database. It also reports query time, shown in the
list toolbar.

Records are generated deterministically from their index rather than stored, so
50,000 of them cost nothing in the repo. Edits are layered on top as patches in
`localStorage` and survive a reload; clear site data to reset.

---

## Connecting the real backend

1. Implement the endpoints in `src/api/httpApi.ts` (or map your existing ones
   onto that shape — do the mapping in that file, not in components).
2. Set the environment:

   ```bash
   VITE_API_MODE=http
   VITE_API_BASE_URL=https://your-los-api.example.com/api
   ```

The header badge flips from **Mock data** to **Live API** so it's obvious which
one is in play.

The critical contract is that `listApplications` **does the work server-side**
and returns `{ rows, total, page, pageSize }`. With millions of records, the
client must never receive more than a page.

Suggested indexes for the query the list makes: a composite on the sort column
plus id, and a trigram or full-text index over the searchable columns
(name, application number, customer ID, PAN, mobile).

### Auth, when you add it

`httpApi.ts` already reads a bearer token from `localStorage` and attaches it to
every request. What's still needed:

- a login route and a guard around the authenticated routes
- refresh handling, and redirect-to-login on a 401
- server-side authorisation — the client can hide a button, it cannot protect
  data, so field-level edit permissions have to be enforced on `PATCH`

`EditableSection` in `types.ts` is the natural place to hang per-section
permissions.

---

## Deploying

All three hosts are pre-configured. The only real requirement is the SPA
fallback: a deep link like `/applications/APP-100042` must serve `index.html`
rather than 404.

**Vercel** — import the repo. `vercel.json` sets the build, output directory
and the rewrite. Nothing to configure.

**Netlify** — import the repo. `netlify.toml` does the same. (`public/_redirects`
is there as a belt-and-braces fallback.)

**GitHub Pages** — push to `main`; `.github/workflows/deploy.yml` builds and
deploys. It sets `VITE_BASE` to the repo name, because project sites are served
from `/<repo>/` rather than the domain root, and copies `index.html` to
`404.html`, because Pages has no rewrite rule. Enable Pages with source
"GitHub Actions" in repo settings first.

---

## Notes and limits

- Records are generated. No real customer data is present anywhere.
- The corpus is 50,000 rather than millions so the whole thing runs in a browser
  tab with no backend. The access patterns are the ones that scale; the storage
  is not, and isn't meant to be.
- Bureau, Work Profile, Banking, Financials, Obligations and the other sidebar
  sections of the source system are out of scope here — the five tabs cover what
  the reference screens showed.
- No test suite yet. The build is typechecked (`tsc -b` runs as part of
  `npm run build`) and was verified end-to-end in a browser, but that verification
  isn't checked in. Playwright over the list, the five tabs, and an edit
  round-trip would be the first thing to add.
