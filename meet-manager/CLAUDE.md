# Claude Code Instructions

Read and follow [agents.md](./agents.md) before making any changes. It is the canonical project guidance.

Additional guidance for Claude:

- Inspect the current implementation and package versions before editing; do not assume component APIs from memory.
- Make the smallest coherent change that satisfies the request.
- Before adding a dependency, explain why an existing platform or installed package is insufficient.
- For HeroUI, use the v3 documentation/API matching the installed package version. Do not mix v2 component syntax with v3.
- Keep GitHub Pages static-export constraints intact.
- Run `npm run build` after code changes and report the actual result.
- Do not report a successful deployment based only on a successful local build.
