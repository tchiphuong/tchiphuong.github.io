# Meet Manager

Next.js App Router + React 19 + HeroUI v3, configured for GitHub Pages static export.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000/meet-manager while using the configured base path.

## Production build

```bash
npm run build
```

The static site is generated in `out/`.

## Backup format

Export creates a JSON file with this structure:

```json
{
  "schema": "meet-manager-backup",
  "version": 1,
  "exportedAt": "ISO-8601 timestamp",
  "meetings": []
}
```

Import validates the schema and meeting records, then asks before replacing the current list. Data is stored in browser Local Storage; this is a backup/restore mechanism, not cloud synchronization.

## GitHub Pages

The workflow at `.github/workflows/deploy-meet-manager.yml` builds the app and preserves the existing root homepage before deploying the combined static artifact.

In repository Settings → Pages, set Build and deployment → Source to **GitHub Actions**. This is a one-time repository setting and cannot be changed through a normal contents commit.
