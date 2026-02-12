import type { SkillScope } from '@emergent/shared';

import os from 'node:os';
import path from 'node:path';

import type { ProviderAdapter } from './index.js';

import { KNOWN_CONFIG_DIRS, resolveProjectRoot } from '../project-root.js';

// ─── Claude Code Provider ────────────────────────────────────────

export const claudeAdapter: ProviderAdapter = {
  configDirName: '.claude',

  getDisplayPath(scope: SkillScope, skillName: string): string {
    if (scope === 'global') {
      return `~/.claude/skills/${skillName}`;
    }
    return `.claude/skills/${skillName}`;
  },

  getTargetDirectory(scope: SkillScope, skillName: string): string {
    if (scope === 'global') {
      return path.join(os.homedir(), '.claude', 'skills', skillName);
    }
    const projectRoot = resolveProjectRoot(process.cwd(), KNOWN_CONFIG_DIRS);
    return path.join(projectRoot, '.claude', 'skills', skillName);
  },

  name: 'Claude Code',

  skillPathSegments: ['skills'] as const,

  target: 'claude',
};
