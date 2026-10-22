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
```

Required env (see `.env.example`): `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `CRON_SECRET`, `PREVIEW_SECRET`, optional `NEXT_PUBLIC_UMAMI_URL` / `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (Umami script in `src/app/(frontend)/layout.tsx` only renders when the website ID is set).

## Formatting

Prettier: tabs (width 4), single quotes, no semicolons, trailing commas, printWidth 80. Path alias `@/*` → `src/*`; `@payload-config` → `src/payload.config.ts`.

## Architecture

- **`src/payload.config.ts`** — registers all collections, the `Header`/`Footer` globals, plugins, jobs (cron access via `CRON_SECRET` bearer) and i18n.
- **Route groups**: `src/app/(payload)` is the Payload admin + REST/GraphQL API (generated, rarely edited); `src/app/(frontend)` is the public site (`/`, `/[slug]` for Pages, `/posts`, `/search`, sitemaps, preview routes).
- **Template collections** (Pages, Posts, Categories, Media, Users) keep the template's behavior: drafts + live preview, `afterChange` hooks that call Next `revalidatePath`/`revalidateTag`.
- **Custom travel collections** (`Flights`, `TypesFlights`, `Cruises`, `TravelPackages`, `Hotels`, `Services`, `Highlights`) are flat files in `src/collections/`. They use drafts, `anyone` read / `authenticated` write access (`src/access/`), and have **no revalidation hooks** — frontend queries must filter `_status: 'published'` themselves. `Flights` derives `title` and `slug` from `origin`/`destination` in `beforeChange` hooks; `highlights` are filtered by their `type` field.
- **SEO** (`src/plugins/index.ts`): `generateTitle`/`generateDescription`/`generateURL` switch on collection slug. Canonical URL scheme: flights `/vuelos/{typeFlight.slug}/{slug}`, posts `/blog/{slug}`, travel packages `/paquete/{slug}`. These frontend routes do not exist yet under `src/app/(frontend)` (posts are currently served at `/posts/[slug]`); `FlightCard` links to the related post if present, otherwise to the `/vuelos/...` URL.
- **Layout builder**: Pages have a `layout` blocks field. Adding a block requires all of: `src/blocks/<Name>/config.ts` (Payload block) + `Component.tsx`, adding the config to the `layout` blocks in `src/collections/Pages/index.ts`, mapping its `blockType` slug in `src/blocks/RenderBlocks.tsx`, then `pnpm generate:types`. Block components are async server components that may call `getPayload({ config })` directly (see `FeaturedFlights`, which supports `manual` / `featured` / latest selection modes).
- **UI**: Tailwind v4 + shadcn-style primitives in `src/components/ui`; heros in `src/heros`; theme providers in `src/providers`.

## Deployment notes

- `next.config.ts` has local-vs-deploy blocks marked `//Todo: Comentar para el deploy` / `desComentar para el deploy` around `NEXT_PUBLIC_SERVER_URL` and `images.remotePatterns` — these must be toggled by hand when deploying (per README).
- Deployed on Dokploy with the Railpack build type: Node version pinned in `.node-version` (24.22.1), pnpm version from `packageManager` in `package.json`. `Dockerfile` and `docker-compose.yml` (local Mongo) are also available.
- Categories expected to exist in the admin (Vuelos Nacionales, Vuelos Internacionales, Cruceros, Destinos, Consejos de Viaje, Ofertas) are listed at the top of `README.md`.
