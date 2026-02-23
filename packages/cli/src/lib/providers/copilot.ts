import os from 'node:os';
import path from 'node:path';

import type { ProviderAdapter } from './index.js';

// ─── GitHub Copilot Provider ─────────────────────────────────────

export const copilotAdapter: ProviderAdapter = {
  configDirName: '.copilot',

  getDisplayPath(skillName: string): string {
    return `~/.copilot/skills/${skillName}`;
  },

  getTargetDirectory(skillName: string): string {
    return path.join(os.homedir(), '.copilot', 'skills', skillName);
  },

  name: 'GitHub Copilot',

  skillPathSegments: ['skills'] as const,

  target: 'copilot',
};
