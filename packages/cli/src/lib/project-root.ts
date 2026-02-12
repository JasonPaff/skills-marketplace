import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ─── Known Config Directories ───────────────────────────────────

/**
 * Directory names used by known AI coding-tool providers.
 * Defined here (rather than derived from the provider registry)
 * to avoid a circular dependency.
 */
export const KNOWN_CONFIG_DIRS: readonly string[] = ['.claude', '.copilot'];

// ─── Project Markers ────────────────────────────────────────────

/** Filesystem entries whose presence signals a project root. */
const PROJECT_MARKERS = ['.git', 'package.json'] as const;

// ─── resolveProjectRoot ─────────────────────────────────────────

/**
 * Walk upward from `cwd` to locate the true project root.
 *
 * Detection priority:
 *  1. If `cwd` is *inside* a known config directory, return
 *     that directory's parent (the project root).
 *  2. Walk upward looking for common project markers (`.git`,
 *     `package.json`).
 *  3. Walk upward looking for a directory that *contains* one
 *     of the known config directories (skipping the home
 *     directory, whose `~/.claude` is global config).
 *  4. Fall back to the original `cwd`.
 *
 * @param cwd            - The current working directory to start from.
 * @param configDirNames - Names of provider config directories to recognise.
 * @returns The resolved project root as an absolute path.
 */
export function resolveProjectRoot(cwd: string, configDirNames: readonly string[]): string {
  const resolved = path.resolve(cwd);
  const root = path.parse(resolved).root;

  // ── Priority 1: cwd is inside a config directory ────────────
  // Walk each ancestor of `resolved`; if any ancestor's basename
  // matches a known config dir name, the project root is that
  // ancestor's parent.
  let current = resolved;
  while (current !== root) {
    const basename = path.basename(current);
    const parent = path.dirname(current);

    if (configDirNames.includes(basename) && isDirectory(current)) {
      return parent;
    }

    current = parent;
  }

  // ── Priority 2: look for project markers ────────────────────
  current = resolved;
  while (current !== root) {
    for (const marker of PROJECT_MARKERS) {
      if (exists(path.join(current, marker))) {
        return current;
      }
    }

    current = path.dirname(current);
  }

  // Check root for markers as well
  for (const marker of PROJECT_MARKERS) {
    if (exists(path.join(root, marker))) {
      return root;
    }
  }

  // ── Priority 3: find a directory containing a config dir ────
  // Skip the home directory — ~/.claude is global config, not a
  // project indicator.
  const homedir = path.resolve(os.homedir());
  current = resolved;
  while (current !== root) {
    if (current !== homedir) {
      for (const dirName of configDirNames) {
        const candidate = path.join(current, dirName);
        if (isDirectory(candidate)) {
          return current;
        }
      }
    }

    current = path.dirname(current);
  }

  // ── Priority 4: fallback ────────────────────────────────────
  return resolved;
}

/** Returns `true` when `target` exists on disk. */
function exists(target: string): boolean {
  return fs.existsSync(target);
}

// ─── Helpers ────────────────────────────────────────────────────

/** Returns `true` when `target` exists and is a directory. */
function isDirectory(target: string): boolean {
  try {
    return fs.statSync(target).isDirectory();
  } catch {
    return false;
  }
}
