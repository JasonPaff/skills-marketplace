import os from 'node:os';
import path from 'node:path';

import type { ProviderAdapter } from './index.js';

// ─── Claude Code Provider ────────────────────────────────────────

export const claudeAdapter: ProviderAdapter = {
  configDirName: '.claude',

  getDisplayPath(skillName: string): string {
    return `~/.claude/skills/${skillName}`;
  },

  getTargetDirectory(skillName: string): string {
    return path.join(os.homedir(), '.claude', 'skills', skillName);
  },

  name: 'Claude Code',

  skillPathSegments: ['skills'] as const,

  target: 'claude',
};
