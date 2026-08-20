# graft-opencode

Plug the local [NanoNets Graft](https://github.com/NanoNets/Graft) code graph into
[OpenCode](https://opencode.ai/) as a zero-config background plugin.

`graft-opencode` is a tiny installer plus a single OpenCode plugin. It ships a
**repository map**, **semantic context**, **blast-radius warnings**, and an
**out-of-sync drift alert** — all powered by the `graft` CLI running locally on
your machine. No external services, no API keys, no telemetry.

## Installation

Install into a repository from anywhere inside it:

```bash
npx github:salvioner/graft-opencode
```

The command locates the current Git repository root automatically
(`git rev-parse --show-toplevel`), then copies the `.opencode/` folder tree into
it. Not inside a Git repository? It falls back to your current working directory.

OpenCode auto-discovers the plugin from `.opencode/plugin/` on the next launch —
no config entry required.

## Prerequisites

- [OpenCode](https://opencode.ai/) installed.
- The NanoNets **`graft` CLI** installed locally and available on your system
  `PATH`. The plugin shells out to `graft map`, `graft ask`, `graft callers`,
  `graft build`, and `graft check`.

## Privacy & Security

`graft-opencode` is **100% local**:

- **Zero external API keys.** The plugin never needs a key or token.
- **No telemetry.** Nothing is ever sent off your machine.
- **Local index only.** All context comes from your local Graft index and the
  `graft` CLI binaries. Nothing leaves your computer.

## How It Works (Background Capabilities)

`graft-plugin.ts` is an event-driven background plugin that hooks OpenCode's
lifecycle. It degrades silently — if `graft` isn't available it simply does
nothing and never blocks your session.

- **Repo Mapping** — On `session.created`, `graft map` builds a structural
  repository map and seeds it into the session as synthetic context.
- **Semantic Context** — On each `chat.message`, `graft ask` queries the local
  index for relevant code and appends the top hits as `[graft context]` parts.
- **Blast-Radius Checks** — After an `edit` or `write`, `graft callers` finds
  dependent functions and warns you about the blast radius of your change.
- **Auto-Sync & Drift Warning** — On `session.idle`, `graft build` rebuilds the
  graph; `graft check` then raises a toast if files have fallen out of sync.

## Manual Install

Prefer to copy the files yourself? Mirror the `.opencode/` tree into your
repository:

```bash
cd graft-opencode  # This repo
rsync -avu .opencode/ /path/to/destination/.opencode/
```

## Uninstall

Remove the installed plugin from the target repository:

```bash
rm -rf /path/to/destination/.opencode/plugin
```

## License

[MIT](./LICENSE)
