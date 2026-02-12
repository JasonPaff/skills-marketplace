import { parseAgentMd, parseRuleMd, parseSkillMd } from '@emergent/shared';

// ─── Types ───────────────────────────────────────────────────────

/** Batch upload containing skills, agents, and/or rules subfolders. */
export interface BatchStructure {
  agents: GroupedItem[];
  rules: GroupedItem[];
  skills: GroupedItem[];
  type: 'batch';
}

/** Result of folder structure detection. */
export type DetectedStructure = BatchStructure | SingleSkillStructure;

/** A single grouped item (skill, agent, or rule) detected in the upload. */
export interface GroupedItem {
  files: UploadedFile[];
  frontmatter: ParsedFrontmatter;
  name: string;
}

/** Parsed frontmatter result for a detected item. */
export interface ParsedFrontmatter {
  description?: string;
  errors?: string[];
  name?: string;
  valid: boolean;
}

/** Single-skill upload (flat folder with SKILL.md). */
export interface SingleSkillStructure {
  files: UploadedFile[];
  type: 'single-skill';
}

/** A file extracted from a zip or folder upload. */
export interface UploadedFile {
  content: string; // base64-encoded
  path: string;
}

// ─── Constants ───────────────────────────────────────────────────

const BATCH_PREFIXES = ['skills/', 'agents/', 'rules/'] as const;

// ─── Main Detection ──────────────────────────────────────────────

/**
 * Analyze uploaded file paths to detect whether the upload contains a
 * `.claude`-style folder structure with `skills/`, `agents/`, and/or `rules/`
 * subfolders, and categorize each item accordingly.
 *
 * Returns a `BatchStructure` when known subfolders are detected, or a
 * `SingleSkillStructure` when the upload looks like a simple skill folder.
 */
export function detectFolderStructure(files: UploadedFile[]): DetectedStructure {
  // Strip root folder prefix if all files share the same root
  const stripped = stripRootFolder(files);

  // Check if any paths start with a known batch prefix
  const hasBatchPrefix = stripped.some((f) =>
    BATCH_PREFIXES.some((prefix) => f.path.startsWith(prefix)),
  );

  if (!hasBatchPrefix) {
    return { files: stripped, type: 'single-skill' };
  }

  return {
    agents: groupAgents(stripped),
    rules: groupRules(stripped),
    skills: groupSkills(stripped),
    type: 'batch',
  };
}

// ─── Root Folder Stripping ───────────────────────────────────────

/**
 * Group files under `agents/`. Each `.md` file directly under `agents/`
 * is a separate agent item, parsed for frontmatter.
 */
function groupAgents(files: UploadedFile[]): GroupedItem[] {
  const prefix = 'agents/';
  const agentFiles = files.filter(
    (f) => f.path.startsWith(prefix) && f.path.endsWith('.md') && !f.path.slice(prefix.length).includes('/'),
  );

  return agentFiles.map((file) => {
    const fileName = file.path.slice(prefix.length);
    const name = fileName.replace(/\.md$/i, '');
    const frontmatter = parseAgentFrontmatter(file);

    return {
      files: [{ content: file.content, path: fileName }],
      frontmatter,
      name,
    };
  });
}

// ─── Skill Grouping ─────────────────────────────────────────────

/**
 * Group files under `rules/`. Each `.md` file directly under `rules/`
 * is a separate rule item, parsed for frontmatter.
 */
function groupRules(files: UploadedFile[]): GroupedItem[] {
  const prefix = 'rules/';
  const ruleFiles = files.filter(
    (f) => f.path.startsWith(prefix) && f.path.endsWith('.md') && !f.path.slice(prefix.length).includes('/'),
  );

  return ruleFiles.map((file) => {
    const fileName = file.path.slice(prefix.length);
    const name = fileName.replace(/\.md$/i, '');
    const frontmatter = parseRuleFrontmatter(file);

    return {
      files: [{ content: file.content, path: fileName }],
      frontmatter,
      name,
    };
  });
}

// ─── Agent Grouping ─────────────────────────────────────────────

/**
 * Group files under `skills/` into separate skill items.
 * Each subfolder under `skills/` becomes a separate skill.
 * The SKILL.md in each subfolder is parsed for frontmatter.
 */
function groupSkills(files: UploadedFile[]): GroupedItem[] {
  const prefix = 'skills/';
  const skillFiles = files.filter((f) => f.path.startsWith(prefix));

  // Group by subfolder name (first path segment after skills/)
  const groups = new Map<string, UploadedFile[]>();

  for (const file of skillFiles) {
    const rest = file.path.slice(prefix.length);
    const slashIndex = rest.indexOf('/');

    if (slashIndex === -1) {
      // File directly under skills/ — skip (skills need subfolders)
      continue;
    }

    const subfolderName = rest.slice(0, slashIndex);
    const relativePath = rest.slice(slashIndex + 1);

    if (!groups.has(subfolderName)) {
      groups.set(subfolderName, []);
    }
    groups.get(subfolderName)!.push({
      content: file.content,
      path: relativePath,
    });
  }

  // Convert groups to GroupedItems with parsed frontmatter
  const items: GroupedItem[] = [];

  for (const [name, groupFiles] of groups) {
    const frontmatter = parseSkillFrontmatter(groupFiles);
    items.push({ files: groupFiles, frontmatter, name });
  }

  return items;
}

// ─── Rule Grouping ──────────────────────────────────────────────

/** Parse agent .md frontmatter from a single agent file. */
function parseAgentFrontmatter(file: UploadedFile): ParsedFrontmatter {
  try {
    const decoded = atob(file.content);
    const { frontmatter } = parseAgentMd(decoded);
    return {
      description: frontmatter.description,
      name: frontmatter.name,
      valid: true,
    };
  } catch (err) {
    return {
      errors: [err instanceof Error ? err.message : 'Invalid agent .md'],
      valid: false,
    };
  }
}

// ─── Frontmatter Parsing Helpers ────────────────────────────────

/** Parse rule .md frontmatter from a single rule file. */
function parseRuleFrontmatter(file: UploadedFile): ParsedFrontmatter {
  try {
    const decoded = atob(file.content);
    const { frontmatter } = parseRuleMd(decoded);
    return {
      description: frontmatter.description,
      name: frontmatter.name,
      valid: true,
    };
  } catch (err) {
    return {
      errors: [err instanceof Error ? err.message : 'Invalid rule .md'],
      valid: false,
    };
  }
}

/** Parse SKILL.md frontmatter from a group of skill files. */
function parseSkillFrontmatter(files: UploadedFile[]): ParsedFrontmatter {
  const skillMd = files.find((f) => f.path === 'SKILL.md');

  if (!skillMd) {
    return { errors: ['Missing SKILL.md file'], valid: false };
  }

  try {
    const decoded = atob(skillMd.content);
    const { frontmatter } = parseSkillMd(decoded);
    return {
      description: frontmatter.description,
      name: frontmatter.name,
      valid: true,
    };
  } catch (err) {
    return {
      errors: [err instanceof Error ? err.message : 'Invalid SKILL.md'],
      valid: false,
    };
  }
}

/**
 * If all file paths share a single root folder prefix, strip it.
 * This handles cases where the zip extraction leaves a top-level folder.
 */
function stripRootFolder(files: UploadedFile[]): UploadedFile[] {
  if (files.length === 0) return files;

  const roots = new Set(files.map((f) => f.path.split('/')[0]));

  if (roots.size === 1) {
    const root = [...roots][0]!;
    // Only strip if it looks like a folder (paths have content after root/)
    const prefix = root + '/';
    if (files.every((f) => f.path.startsWith(prefix) && f.path.length > prefix.length)) {
      return files.map((f) => ({
        content: f.content,
        path: f.path.slice(prefix.length),
      }));
    }
  }

  return files;
}
