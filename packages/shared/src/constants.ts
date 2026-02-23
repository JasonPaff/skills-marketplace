export const INSTALL_TARGETS = ['claude', 'copilot'] as const;

export type InstallTarget = (typeof INSTALL_TARGETS)[number];

export const ITEM_TYPES = ['skill', 'agent', 'rule'] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

export const API_VERSION = 'v1';
