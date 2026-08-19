# AGENTS.md

This file gives AI coding agents the architectural context they need to work on
`graft-opencode` safely.

## What this repository is

`graft-opencode` is a thin distribution + installer around a single OpenCode
**background plugin** that surfaces a local NanoNets **Graft** code graph inside
[OpenCode](https://opencode.ai/). It ships two things:

- `bin/install.js` — a zero-dependency Node.js CLI that copies the `.opencode/`
  tree into a target repository (run via `npx github:salvioner/graft-opencode`).
- `.opencode/plugin/graft-plugin.ts` — the OpenCode plugin itself.

## Architecture

- **`graft-plugin.ts` is an OpenCode event-driven background plugin.** It is
  exported as a `Plugin` (from `@opencode-ai/plugin`) and returns a `Hooks`
  object keyed by OpenCode lifecycle events. It never blocks the user: every
  handler wraps its work in `try/catch` and degrades silently on failure.
- **OpenCode auto-loads plugins placed in `.opencode/plugin/`.** No config entry
  is required; OpenCode scans `.opencode/plugin/` (and `.opencode/plugins/`)
  and imports each `*.ts`/`*.js` file as a plugin. The installer's whole job is
  to get this file into the right place.
- **The plugin relies on the local `graft` CLI binaries**, invoked through
  OpenCode's Bun shell `$`:
  - `graft map` — structural repository map injected on `session.created`.
  - `graft ask` — semantic context queries on each `chat.message`.
  - `graft callers` — blast-radius checks after `edit`/`write`.
  - `graft build` — graph rebuild on `session.idle`.
  - `graft check` — drift detection powering the out-of-sync warning toast.
- **Zero external services.** The plugin only shells out to the local `graft`
  CLI; no API keys, no telemetry, nothing leaves the machine.

## Rules for editing `graft-plugin.ts`

1. **Maintain non-blocking error handling.** Every handler must swallow its own
   errors with `try/catch { /* non-fatal */ }`. The plugin must never throw into
   OpenCode or stall a session. Use `void checkAndToast()` for fire-and-forget
   work and keep throttles (e.g. `CHECK_INTERVAL`) in place for slow passes.
2. **Preserve Bun shell `$` execution syntax.** `$` is OpenCode's Bun shell. Use
   `$\`graft ...\`` tagged templates, chain `.quiet()` to suppress echo, and use
   `.nothrow()` before reading output when a non-zero exit is expected (e.g.
   `graft check --json` exits 1 when files are out of sync).
3. **Keep synthetic message formatting intact.** Injected context must be pushed
   as parts with `synthetic: true` and `id` prefixed `prt_` (e.g.
   `prt_${randomUUID()}`), carrying `messageID`/`sessionID`/`type: "text"`.
   The `[graft context]` header + `- title (file:line): snippet` bullet format
   is part of the contract — do not change it without updating the README.
4. **Do not commit build artifacts.** `.opencode/node_modules/`, lockfiles, and
   the dev-only `.opencode/package.json` are intentionally excluded from git and
   from the installer copy. The plugin's `@opencode-ai/plugin` import is
   **type-only** (`import type`), so the target install stays dependency-free.
5. **Keep the event routing accurate.** `session.created`/`session.idle` only
   reach the plugin through the `event` hook; do not reintroduce dead top-level
   `"session.*"` keys.

## Type-checking

CI runs `npm ci` then `tsc --noEmit` against `tsconfig.json`, which includes only
`.opencode/plugin/graft-plugin.ts`. Keep that file type-clean.

## Installing the plugin into a target repo

```bash
npx github:salvioner/graft-opencode
```

`bin/install.js` locates the target repo root with `git rev-parse --show-toplevel`
(falling back to `process.cwd()`) and copies `.opencode/` there, excluding
`node_modules/`, `package.json`, `package-lock.json`, `bun.lock`, and the
package's own dev-only `.gitignore` (so a user's existing `.opencode/.gitignore`
is never clobbered).
