import type { InstallTarget, SkillScope } from '@emergent/shared';

import os from 'node:os';
import path from 'node:path';

// ─── Provider Adapter Interface ──────────────────────────────────
// Defined locally until the shared index module is finalized.

export interface ProviderAdapter {
  getDisplayPath(scope: SkillScope, skillName: string): string;
  getTargetDirectory(scope: SkillScope, skillName: string): string;
  name: string;
  target: InstallTarget;
}

// ─── Claude Code Provider ────────────────────────────────────────

export const claudeAdapter: ProviderAdapter = {
  getDisplayPath(scope: SkillScope, skillName: string): string {
    return scope === 'global' ? `~/.claude/${skillName}` : `.claude/${skillName}`;
  },
  getTargetDirectory(scope: SkillScope, skillName: string): string {
    const base = scope === 'global' ? os.homedir() : process.cwd();
    return path.join(base, '.claude', skillName);
  },

  name: 'Claude Code',

  target: 'claude',
};
