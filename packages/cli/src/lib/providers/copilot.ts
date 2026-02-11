import type { InstallTarget, SkillScope } from '@emergent/shared';

import os from 'node:os';
import path from 'node:path';

// ─── Provider Adapter Interface ──────────────────────────────────
// Defined locally until the shared index.ts is finalized.

export interface ProviderAdapter {
  getDisplayPath(scope: SkillScope, skillName: string): string;
  getTargetDirectory(scope: SkillScope, skillName: string): string;
  name: string;
  target: InstallTarget;
}

// ─── GitHub Copilot Provider ─────────────────────────────────────

export const copilotAdapter: ProviderAdapter = {
  getDisplayPath(scope: SkillScope, skillName: string): string {
    if (scope === 'global') {
      return `~/.copilot/skills/${skillName}`;
    }
    return `.copilot/skills/${skillName}`;
  },
  getTargetDirectory(scope: SkillScope, skillName: string): string {
    if (scope === 'global') {
      return path.join(os.homedir(), '.copilot', 'skills', skillName);
    }
    return path.join(process.cwd(), '.copilot', 'skills', skillName);
  },

  name: 'GitHub Copilot',

  target: 'copilot',
};
