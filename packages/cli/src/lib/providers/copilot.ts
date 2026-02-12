import type { SkillScope } from '@emergent/shared';

import os from 'node:os';
import path from 'node:path';

import type { ProviderAdapter } from './index.js';

import { KNOWN_CONFIG_DIRS, resolveProjectRoot } from '../project-root.js';

// ─── GitHub Copilot Provider ─────────────────────────────────────

export const copilotAdapter: ProviderAdapter = {
  configDirName: '.copilot',

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
    const projectRoot = resolveProjectRoot(process.cwd(), KNOWN_CONFIG_DIRS);
    return path.join(projectRoot, '.copilot', 'skills', skillName);
  },

  name: 'GitHub Copilot',

  skillPathSegments: ['skills'] as const,

  target: 'copilot',
};
