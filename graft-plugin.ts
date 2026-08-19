/**
 * A Graft plugin for OpenCode that mimicks the behaviour of the official Claude Code plugin.
 *
 * Author: Andrea Arighi
 */

import type { Plugin } from "@opencode-ai/plugin"

export const GraftPlugin: Plugin = async ({ directory, $ }) => {
  return {
    // --- Blast-radius warning after an edit ---
    // After a file is edited/written, look up its dependents and log a
    // short warning listing what else may be affected.
    "tool.execute.after": async (input) => {
      if (input.tool !== "edit" && input.tool !== "write") return

      const filePath = input.args?.filePath as string | undefined
      if (!filePath) return

      try {
        const result = await $`graft callers ${filePath} --json`.quiet()
        const data = JSON.parse(result.stdout)

        if (data?.callers?.length) {
          console.log(
            `⚠ graft: ${filePath} has ${data.callers.length} dependents — ` +
            data.callers.slice(0, 5).map((c: any) => c.symbol).join(", ")
          )
        }
      } catch {
        // best-effort only — don't block the agent
      }
    },

    // --- Graph re-sync on session idle ---
    // Rebuild the local structural graph so it reflects edits made
    // during the session that just ended.
    "session.idle": async () => {
      try {
        await $`graft build --no-reuse=false`.quiet()
      } catch {
        // non-fatal
      }
    },
  }
}

export default GraftPlugin
