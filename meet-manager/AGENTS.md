# Meet Manager — Agent Instructions

This file is the shared source of truth for AI coding agents working in this directory.

## Project overview

- Product: Meet Manager, a client-side Google Meet link organizer.
- Framework: Next.js App Router with React 19.
- UI: HeroUI v3, Tailwind CSS v4, and Iconify using the Gravity UI icon set.
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
- Do not add server-only features: API routes, route handlers, Server Actions, middleware requiring a server, runtime SSR, or server-side database access.
- Use browser APIs only in client components and after the component mounts where necessary.
- Do not assume a Google Meet URL reveals whether a meeting is live or who joined. Current meeting status is user-managed. Do not claim real-time Meet integration exists.

## Data and behavior

- Meeting data is stored locally in the browser using Local Storage.
- Keep the existing storage key compatible unless a deliberate migration is implemented.
- Export must produce a portable JSON backup with a schema identifier and version.
- Import must validate the file and its records before changing state.
- Import must clearly confirm before replacing the current list.
- Do not silently discard existing records, merge unexpectedly, or execute imported content.
- Treat imported JSON as untrusted data. Validate types, status values, URLs, and identifiers.
- Local Storage is per browser/profile/device; it is not cloud sync or an account backup.

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
- Confirm Export and Import still work, including invalid JSON and invalid record cases.
- Report what changed, tests/build results, and any deployment setting the user must configure. Never claim deployment succeeded until the GitHub Actions run confirms it.
