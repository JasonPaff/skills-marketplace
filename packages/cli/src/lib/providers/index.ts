import type { InstallTarget, SkillScope } from '@emergent/shared';

import { claudeAdapter } from './claude.js';
import { copilotAdapter } from './copilot.js';

// ─── Provider Adapter Interface ──────────────────────────────────

/**
 * Defines how a skill is installed for a specific AI coding tool.
 * Each provider (Claude Code, GitHub Copilot, etc.) needs different
 * directory structures and file placements.
 */
export interface ProviderAdapter {
  /**
   * Returns a user-friendly display path (using `~` for home directory)
   * for showing in CLI output.
   */
  getDisplayPath(scope: SkillScope, skillName: string): string;

  /**
   * Returns the absolute path to the directory where skill files
   * should be installed for this provider.
   */
  getTargetDirectory(scope: SkillScope, skillName: string): string;

  /** Display name for the provider (e.g., "Claude Code") */
  name: string;

  /** The install target identifier */
  target: InstallTarget;
}

// ─── Provider Registry ───────────────────────────────────────────

/**
 * Registry mapping each `InstallTarget` to its concrete `ProviderAdapter`.
 * This provides a single lookup point for resolving providers by target.
 */
const PROVIDER_REGISTRY: ReadonlyMap<InstallTarget, ProviderAdapter> = new Map<
  InstallTarget,
  ProviderAdapter
>([
  ['claude', claudeAdapter],
  ['copilot', copilotAdapter],
]);

// ─── Public API ──────────────────────────────────────────────────

/**
 * Returns all registered provider adapters.
 */
export function getAllProviders(): ProviderAdapter[] {
  return [...PROVIDER_REGISTRY.values()];
}

/**
 * Retrieves the provider adapter for the given install target.
 * Throws if the target is not registered.
 */
export function getProvider(target: InstallTarget): ProviderAdapter {
  const provider = PROVIDER_REGISTRY.get(target);
  if (!provider) {
    throw new Error(`No provider registered for target: ${target}`);
  }
  return provider;
}

// ─── Re-exports ──────────────────────────────────────────────────

export { claudeAdapter } from './claude.js';
export { copilotAdapter } from './copilot.js';
