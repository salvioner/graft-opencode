#!/usr/bin/env node

import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = path.resolve(__dirname, "..")
const SRC = path.join(PKG_ROOT, ".opencode")

// Top-level entries under `.opencode/` that belong to the package's own dev
// setup and must never leak into the target repository (node_modules is 60MB+;
// lockfiles and the dev-only package.json are resolved locally by the user if
// ever needed).
//
// `.gitignore` is excluded too: it is a dev-only convenience of this package,
// and copying it would clobber a user's own `.opencode/.gitignore`.
const EXCLUDED = new Set([
  "node_modules",
  "package.json",
  "package-lock.json",
  "bun.lock",
  ".gitignore",
])

const findTargetRoot = () => {
  try {
    const root = execSync("git rev-parse --show-toplevel", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim()
    if (root) return root
  } catch {
    // not inside a git repository
  }
  return process.cwd()
}

// Match only the first segment under `.opencode/`, so a nested file that merely
// shares an excluded name is never dropped. Returning false for a directory
// makes fs.cpSync skip that entire subtree.
const filter = (src) => {
  const rel = path.relative(SRC, src)
  if (rel === "") return true
  return !EXCLUDED.has(rel.split(path.sep)[0])
}

// Recursively collect the relative paths of source files that will be copied,
// applying the same filter used by fs.cpSync so the report is accurate.
const collectFiles = (dir) => {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (!filter(full)) continue
    if (entry.isDirectory()) files.push(...collectFiles(full))
    else files.push(path.relative(SRC, full))
  }
  return files
}

// Portable check for the `graft` CLI on PATH (`where` on Windows).
const graftOnPath = () => {
  const probe = process.platform === "win32" ? "where graft" : "command -v graft"
  try {
    execSync(probe, { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

const printUsage = () => {
  console.log(
    [
      "graft-opencode — install the Graft OpenCode plugin into a repository",
      "",
      "Usage:",
      "  npx github:salvioner/graft-opencode [options]",
      "",
      "Options:",
      "  -h, --help       Show this help message",
      "  -v, --version    Print the version",
      "",
      "The .opencode/ tree is copied into the repository root, detected via",
      "`git rev-parse --show-toplevel` (falling back to the current directory).",
    ].join("\n")
  )
}

const main = () => {
  const args = process.argv.slice(2)

  if (args.includes("--help") || args.includes("-h")) {
    printUsage()
    process.exit(0)
  }
  if (args.includes("--version") || args.includes("-v")) {
    let version = "unknown"
    try {
      version = JSON.parse(
        fs.readFileSync(path.join(PKG_ROOT, "package.json"), "utf8")
      ).version
    } catch {
      // fall back to "unknown"
    }
    console.log(version)
    process.exit(0)
  }

  if (!fs.existsSync(SRC)) {
    console.error(
      `[graft-opencode] error: could not find package \`.opencode\` at ${SRC}`
    )
    process.exit(1)
  }

  const target = findTargetRoot()
  const dest = path.join(target, ".opencode")

  const files = collectFiles(SRC).sort()

  try {
    fs.cpSync(SRC, dest, { recursive: true, filter })
  } catch (err) {
    console.error(
      `[graft-opencode] error: failed to copy into ${dest}: ${err.message}`
    )
    process.exit(1)
  }

  console.log(
    `[graft-opencode] installed ${files.length} file(s) into ${target}`
  )
  for (const file of files) console.log(`  - .opencode/${file}`)

  if (!graftOnPath()) {
    console.warn(
      "[graft-opencode] warning: `graft` CLI not found on PATH — " +
        "install NanoNets/Graft to enable the plugin's background capabilities."
    )
  }
}

main()
