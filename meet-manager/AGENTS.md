# Meet Manager — Agent Instructions

This file is the shared source of truth for AI coding agents working in this directory.

## Project overview

- Product: Shared Link Manager, a group-based shared link reservation app.
- Framework: Next.js App Router with React 19.
- UI: HeroUI v3, Tailwind CSS v4, and Iconify using the Gravity UI icon set.
- Backend services: Supabase Auth, PostgreSQL, RLS, RPC functions, and Realtime; no separately hosted application backend.
- Typography: Inter, loaded globally from Google Fonts.
- Language: JavaScript / JSX.
- Hosting: GitHub Pages using Next.js static export.
- Public URL: https://tchiphuong.github.io/meet-manager/
- App source: `app/`; generated static output: `out/` (never commit generated output unless explicitly requested).

## Read before changing code

1. Read this file.
2. Inspect the relevant files in `app/`, `package.json`, and `next.config.mjs`.
3. Check the current Git diff and preserve unrelated user changes.
4. Verify the installed HeroUI v3 API before introducing or changing component props. Do not copy HeroUI v2 examples into this project.
5. Verify icon names against the Gravity UI icon set; do not guess icon identifiers.

## Architecture and deployment constraints

- This project is deployed to GitHub Pages. Keep `output: "export"`, `basePath: "/meet-manager"`, and `trailingSlash: true` in `next.config.mjs`.
- The root homepage belongs to the parent GitHub Pages site. Do not replace or modify root-level homepage files as part of Meet Manager work.
- The deployment workflow builds this app and copies its static output into the `meet-manager/` path while preserving the existing site.
- Do not add a separately hosted backend: API routes, route handlers, Server Actions, middleware requiring a server, runtime SSR, or server-side database access. Supabase-managed services and SQL RPC functions are allowed.
- Use browser APIs only in client components and after the component mounts where necessary.
- Do not assume a destination URL reveals whether it is active or who is using it. Link locks represent claims made through this app, not verified usage at the destination.

## Data and behavior

- Shared group, member, invitation, link, lock, and usage-history data is stored in Supabase PostgreSQL.
- Use Supabase Auth for user identity; never trust a user ID supplied by the browser without checking auth.uid() in database functions and RLS.
- Every exposed table must have RLS enabled and explicit policies. Never expose a Supabase Secret/Service Role key in client code.
- Group owners create groups, manage links, invite by email, and approve/reject join requests. Members may claim and release links.
- Invitations are in-app email allow-list invitations. Without a trusted server/Edge Function, do not claim that the app sends invitation emails.
- Use PostgreSQL RPC functions for membership approval, invitation acceptance, and link claim/release operations.
- Link claim must remain atomic and enforce one active holder per link. Do not replace the unique lock constraint with a client-side check.
- A lock expires after 30 minutes; the UI refreshes stale lock state. Keep the timeout and database function behavior consistent.
- A URL already copied outside the app cannot be blocked by this app; describe the guarantee as exclusive link claiming through the app, not access control at the destination.

## UI, typography, icons, and code conventions

- Use HeroUI v3 components and APIs for every user-facing UI control and display component. Do not introduce native buttons, inputs, selects, links, or custom-styled substitutes.
- Native semantic elements such as `main`, `header`, `section`, `form`, `footer`, and layout wrappers may be used for document structure only. Keep markup minimal.
- Use HeroUI compound component patterns and v3 APIs; never use legacy HeroUI v2 patterns.
- Use `Icon` from `@iconify/react` for icons, with the `gravity-ui:` icon collection. Do not add Lucide, Font Awesome, emoji, or hand-written Unicode symbols as UI icons.
- Use icons consistently for meaningful actions and external links. Avoid decorative icons that add no information. Icon-only controls must have an accessible name.
- Use Inter as the global font. Keep the font declaration centralized in `app/globals.css`; do not introduce competing font families or per-component font overrides.
- Keep the visual design clean and restrained: dark theme, blue accent, consistent spacing, responsive layout, and clear visual hierarchy.
- Remove redundant labels, badges, decorative elements, duplicate information, and unnecessary wrappers. Prefer the simplest UI that preserves usability.
- Keep components small and readable. Avoid unnecessary dependencies and over-engineering.
- Use semantic HTML, accessible names, keyboard-operable controls, and appropriate button types.
- Keep user-facing text in Vietnamese unless a screen already uses a deliberate English label.
- Avoid unvalidated data assumptions, unsafe HTML injection, and hard-coded secrets.
- Preserve existing features unless the task explicitly asks to remove them.

## Project instruction files

- Keep the agent instruction filenames uppercase: `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`.
- Keep project-wide conventions in this `AGENTS.md`; tool-specific files should refer to it rather than contradict it.

## Commands

Run from this directory:

```bash
npm install
npm run dev
npm run build
```

The production build must complete successfully and generate the static `out/` directory.

## Completion checklist

- Review the diff; ensure no unrelated files or root homepage files changed.
- Run `npm run build`.
- Check that static export succeeds with the configured base path.
- Verify auth, group creation, invitation acceptance, join-request approval, RLS, atomic claim/release, expiry, and realtime updates.
- Report what changed, tests/build results, and any deployment setting the user must configure. Never claim deployment succeeded until the GitHub Actions run confirms it.
