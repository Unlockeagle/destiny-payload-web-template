# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Payload skill

This project uses the Payload CMS skill at `.claude/skills/payload/`.
Start with `.claude/skills/payload/SKILL.md` for a quick reference, then see `.claude/skills/payload/reference/` for detailed docs.

## Project

Destiny Trip: a travel agency website (flights, cruises, travel packages, hotels, blog) built on the official Payload Website Template — Payload 3 + Next.js 16 App Router in a single app, MongoDB via `@payloadcms/db-mongodb`. Admin UI and content are in Spanish (`i18n.fallbackLanguage: 'es'`); keep labels, descriptions and user-facing copy in Spanish.

## Commands

Package manager is **pnpm**.

```bash
pnpm dev                  # dev server at http://localhost:3000 (admin at /admin)
pnpm build                # next build (compile + generate-env), then next-sitemap via postbuild
pnpm lint / pnpm lint:fix
pnpm generate:types       # regenerate src/payload-types.ts — run after any collection/block/field change
pnpm generate:importmap   # regenerate admin importMap — run after adding/moving admin custom components
pnpm test:int             # vitest, tests/int/**/*.int.spec.ts (hits the real DB from .env)
pnpm test:e2e             # playwright, tests/e2e (starts/reuses `pnpm dev`)
pnpm test:int tests/int/api.int.spec.ts        # single integration file
pnpm test:e2e tests/e2e/frontend.e2e.spec.ts   # single e2e file
pnpm payload run src/scripts/<file>.ts         # run a script with .env + TS aliases loaded
```

`payload run` scripts must live inside the repo (outside it, `payload` and `@payload-config` don't resolve), use top-level `await` (a `main().then(...)` promise is cut off when the CLI exits) and pass `context: { disableRevalidate: true }` on writes (`revalidatePath` throws outside Next). The CLI only forwards **positional** args to the script — `--flags` are swallowed by minimist, so use e.g. `… migrate-destinations.ts finalize`, not `--finalize`.

Required env (see `.env.example`): `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `CRON_SECRET`, `PREVIEW_SECRET`, optional `NEXT_PUBLIC_UMAMI_URL` / `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (Umami script in `src/app/(frontend)/layout.tsx` only renders when the website ID is set).

## Formatting

Prettier: tabs (width 4), single quotes, no semicolons, trailing commas, printWidth 80. Path alias `@/*` → `src/*`; `@payload-config` → `src/payload.config.ts`.

## Architecture

- **`src/payload.config.ts`** — registers all collections, the `Header`/`Footer` globals, plugins, jobs (cron access via `CRON_SECRET` bearer) and i18n.
- **Route groups**: `src/app/(payload)` is the Payload admin + REST/GraphQL API (generated, rarely edited); `src/app/(frontend)` is the public site (`/`, `/[slug]` for Pages, `/posts`, `/destinos/[slug]`, `/search`, sitemaps, preview routes).
- **Template collections** (Pages, Posts, Categories, Media, Users) keep the template's behavior: drafts + live preview, `afterChange` hooks that call Next `revalidatePath`/`revalidateTag`.
- **Custom travel collections** (`Flights`, `TypesFlights`, `Cruises`, `TravelPackages`, `Hotels`, `Services`, `Highlights`) are flat files in `src/collections/`. They use drafts and `anyone` read / `authenticated` write access (`src/access/`) — since read is public, frontend queries must filter `_status: 'published'` themselves. Only `Flights` has revalidation hooks (see below); `highlights` are filtered by their `type` field.
- **Destinations** (`src/collections/Destinations/`, folder because it has hooks): `name`, `country`, `description`, `cover_image`, `layout` blocks (Content, MediaBlock, CallToAction, Banner), `relatedPosts`, SEO `meta` tab, `slug` generated from `name` when empty. Public page `src/app/(frontend)/destinos/[slug]/page.tsx`: hero, "Desde $X" (min display price of its published flights, computed at render, not stored), `RenderBlocks` of the layout, the destination's published flights via `FlightCard`, and related posts; `notFound()` for unknown/unpublished slugs. Hooks `revalidateDestination` / `revalidateDestinationDelete` revalidate `/destinos/{slug}` + tag `destinations-sitemap` (`src/app/(frontend)/(sitemaps)/destinations-sitemap.xml`, registered in `next-sitemap.config.cjs`).
- **Flights** → `destination` is a required relationship to `destinations` (the old text `destination`/`country` and `relatedPost` were removed by `src/scripts/migrate-destinations.ts`). `beforeChange` hooks build `title` as `{origin}→{destination.name}` and `slug` (only when empty; existing slugs never change), resolving the name with `req.payload.findByID(..., { req })` when `destination` arrives as an id. `src/hooks/revalidateFlightDestination.ts` revalidates the current (and previous, if changed) destination page. Pricing lives in `src/utilities/flightPrice.ts` (`isDiscountActive` honors `hasDiscount`, `discountPrice > 0`, `startDiscount`/`endDiscount`; `getFlightDisplayPrice`) — use it everywhere a flight price is shown so cards and destination pages agree. Flights with drafts: the admin and `draft: true` reads use the `latest` entry in `_flights_versions`, not the main doc — raw data migrations must update both.
- **SEO** (`src/plugins/index.ts`): `generateTitle`/`generateDescription`/`generateURL` switch on collection slug. Canonical URL scheme: flights `/vuelos/{typeFlight.slug}/{slug}` (route not built yet), posts `/blog/{slug}` (currently served at `/posts/[slug]`), travel packages `/paquete/{slug}`, destinations `/destinos/{slug}`. Flights' SEO title is `Vuelo {doc.title} | Destiny Trip`. `seoPlugin.collections` must only list collections **without** a hand-written `meta` tab (today just `cruises`): for listed collections the plugin appends its own `meta` group without `image`, overriding the manual one. The "Generar" buttons work for every collection regardless (the `/api/plugin-seo/generate-*` endpoints are global). Changes to these generate functions need a `pnpm dev` restart.
- **`FlightCard`** (`src/components/blocks/FlightCard.tsx`) expects `destination` populated (query with `depth >= 1`), shows `destination.name` and links "Ver vuelo" to `/destinos/{destination.slug}` until a flight detail route exists.
- **Layout builder**: Pages and Destinations have a `layout` blocks field. Adding a block requires all of: `src/blocks/<Name>/config.ts` (Payload block) + `Component.tsx`, adding the config to the relevant `layout` blocks (e.g. `src/collections/Pages/index.ts`), mapping its `blockType` slug in `src/blocks/RenderBlocks.tsx` (which accepts both `Page` and `Destination` layout blocks), then `pnpm generate:types`. Block components are async server components that may call `getPayload({ config })` directly (see `FeaturedFlights`, which supports `manual` / `featured` / latest selection modes).
- **UI**: Tailwind v4 + shadcn-style primitives in `src/components/ui`; heros in `src/heros`; theme providers in `src/providers`.

## Deployment notes

- `next.config.ts` has local-vs-deploy blocks marked `//Todo: Comentar para el deploy` / `desComentar para el deploy` around `NEXT_PUBLIC_SERVER_URL` and `images.remotePatterns` — these must be toggled by hand when deploying (per README).
- Deployed on Dokploy with the Railpack build type: Node version pinned in `.node-version` (24.22.1), pnpm version from `packageManager` in `package.json`. `Dockerfile` and `docker-compose.yml` (local Mongo) are also available.
- Destinations data migration (spec `specs/02-destinations.md`) runs in two phases against each environment's DB, after a `mongodump`: `pnpm payload run src/scripts/migrate-destinations.ts` (needs the temporary hidden `destinationRef` field on Flights, removed in the final schema) → review destinations in the admin → deploy the final schema → `… migrate-destinations.ts finalize` → `pnpm generate:types`. Don't restore `_flights_versions` entries older than the migration (they still hold text destinations).
- `pnpm dev` regenerates `src/payload-types.ts` with LF endings; with `core.autocrlf=true` git may show it modified with an empty diff — restore it with `git checkout -- src/payload-types.ts`.
- The build currently prerenders no routes (every page, including `/destinos/[slug]`, is served dynamically), so revalidation hooks have no visible effect yet.
- Categories expected to exist in the admin (Vuelos Nacionales, Vuelos Internacionales, Cruceros, Destinos, Consejos de Viaje, Ofertas) are listed at the top of `README.md`.
