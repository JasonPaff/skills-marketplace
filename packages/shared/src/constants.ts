export const SKILL_SCOPES = ['global', 'project'] as const;

export type SkillScope = (typeof SKILL_SCOPES)[number];

export const INSTALL_TARGETS = ['claude', 'copilot'] as const;

export type InstallTarget = (typeof INSTALL_TARGETS)[number];

export const RATING_MIN = 1;
export const RATING_MAX = 5;

export const API_VERSION = 'v1';
