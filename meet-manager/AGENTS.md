# Meet Manager — Agent Instructions

This file is the shared source of truth for AI coding agents working in this directory.

## Project overview

- Product: Meet Manager, a client-side Google Meet link organizer.
- Framework: Next.js App Router with React 19.
- UI: HeroUI v3 and Tailwind CSS v4.
- Language: JavaScript / JSX.
- Hosting: GitHub Pages using Next.js static export.
- Public URL: https://tchiphuong.github.io/meet-manager/
- App source: `app/`; generated static output: `out/` (never commit generated output unless explicitly requested).

## Read before changing code

1. Read this file.
2. Inspect the relevant files in `app/`, `package.json`, and `next.config.mjs`.
3. Check the current Git diff and preserve unrelated user changes.
4. Verify the installed HeroUI v3 API before introducing or changing component props. Do not copy HeroUI v2 examples into this project.

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

## UI and code conventions

- Use HeroUI v3 components and APIs for every user-facing UI control and display component; do not introduce native buttons, inputs, selects, links, or custom-styled substitutes.
- Native semantic elements such as `main`, `header`, `section`, `form`, `footer`, and layout wrappers may be used for document structure. Keep them minimal and use HeroUI components for the actual interface.
- Prefer the existing visual language: dark interface, restrained blue accents, responsive layout, clear spacing, accessible labels, and visible feedback.
- Keep components small and readable. Avoid unnecessary dependencies and over-engineering.
- Use semantic HTML, accessible names, keyboard-operable controls, and appropriate button types.
- Keep user-facing text in Vietnamese unless a screen already uses a deliberate English label.
- Avoid `any`-style unvalidated data assumptions, unsafe HTML injection, and hard-coded secrets.
- Preserve existing features unless the task explicitly asks to remove them.

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
