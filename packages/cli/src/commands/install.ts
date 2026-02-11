import type { InstallTarget, Skill, SkillScope } from '@emergent/shared';

import { cancel, intro, isCancel, log, multiselect, note, outro, select, spinner } from '@clack/prompts';
import { INSTALL_TARGETS, SKILL_SCOPES } from '@emergent/shared';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';

import { fetchSkillByName, fetchSkillDownload } from '../lib/api.js';
import { resolveConflicts } from '../lib/conflicts.js';
import { downloadFiles } from '../lib/download.js';
import { getAllProviders, getProvider } from '../lib/providers/index.js';

// ─── Constants ──────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Resolve a skill argument (UUID or name) into a Skill object.
 * When a name is provided we search the API and look for an exact match.
 */
async function resolveSkill(skillArg: string): Promise<Skill> {
  if (UUID_REGEX.test(skillArg)) {
    // Fetch the download bundle by ID — it includes the full skill object.
    const download = await fetchSkillDownload(skillArg);
    return download.skill;
  }

  // Name-based lookup — the API returns an array of skills.
  const results = await fetchSkillByName(skillArg);

  const exactMatch = results.find(
    (s: Skill) => s.name.toLowerCase() === skillArg.toLowerCase(),
  );

  if (exactMatch) {
    return exactMatch;
  }

  // No exact match — suggest close alternatives if any were returned.
  if (results.length > 0) {
    const suggestions = results
      .slice(0, 5)
      .map((s: Skill) => `  - ${s.name}`)
      .join('\n');
    throw new Error(
      `No skill found with the exact name "${skillArg}". Did you mean:\n${suggestions}`,
    );
  }

  throw new Error(`No skill found matching "${skillArg}".`);
}

/**
 * Strip the `githubPath` prefix from a SkillFile path so only the
 * relative file structure is preserved.
 *
 * Example: githubPath = "skills/global/my-skill"
 *          filePath   = "skills/global/my-skill/rules.md"
 *          result     = "rules.md"
 */
function stripGithubPrefix(filePath: string, githubPath: string): string {
  const normalizedFile = filePath.replace(/\\/g, '/');
  const normalizedPrefix = githubPath.replace(/\\/g, '/').replace(/\/$/, '');

  if (normalizedFile.startsWith(normalizedPrefix + '/')) {
    return normalizedFile.slice(normalizedPrefix.length + 1);
  }

  // Fallback: just use the file name.
  return path.basename(filePath);
}

// ─── Install Command ────────────────────────────────────────────

export const installCommand = new Command('install')
  .description('Install a skill from the marketplace')
  .argument('<skill>', 'Skill name or UUID')
  .option('--scope <scope>', 'Installation scope (global or project)')
  .option('--provider <provider>', 'Target provider (claude or copilot)')
  .action(async (skillArg: string, options: { provider?: string; scope?: string }) => {
    intro(chalk.bold.cyan(' Emergent Skills Installer '));

    const s = spinner();

    // ── 1. Resolve skill ──────────────────────────────────────

    let skill: Skill;

    try {
      s.start('Resolving skill...');
      skill = await resolveSkill(skillArg);
      s.stop(`Found skill: ${chalk.bold(skill.name)} v${skill.version}`);
    } catch (error) {
      s.stop('Failed to resolve skill.');
      log.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }

    // ── 2. Determine scope ────────────────────────────────────

    let scope: SkillScope;

    if (options.scope && SKILL_SCOPES.includes(options.scope as SkillScope)) {
      scope = options.scope as SkillScope;
    } else {
      const scopeResult = await select<SkillScope>({
        message: 'Where should this skill be installed?',
        options: SKILL_SCOPES.map((s) => ({
          hint: s === 'global' ? 'Available everywhere' : 'Only in this project',
          label: s.charAt(0).toUpperCase() + s.slice(1),
          value: s,
        })),
      });

      if (isCancel(scopeResult)) {
        cancel('Installation cancelled.');
        process.exit(0);
      }

      scope = scopeResult;
    }

    // ── 3. Determine providers ────────────────────────────────

    let selectedTargets: InstallTarget[];

    if (options.provider && INSTALL_TARGETS.includes(options.provider as InstallTarget)) {
      selectedTargets = [options.provider as InstallTarget];
    } else {
      const allProviders = getAllProviders();

      const providerResult = await multiselect<InstallTarget>({
        message: 'Select target providers',
        options: INSTALL_TARGETS.map((target) => {
          const provider = allProviders.find((p) => p.target === target);
          return {
            label: provider?.name ?? target,
            value: target,
          };
        }),
        required: true,
      });

      if (isCancel(providerResult)) {
        cancel('Installation cancelled.');
        process.exit(0);
      }

      selectedTargets = providerResult;
    }

    // ── 4. Download files ─────────────────────────────────────

    let downloadResponse;

    try {
      s.start('Downloading skill files...');
      downloadResponse = await fetchSkillDownload(skill.id);
      s.stop(`Fetched ${downloadResponse.files.length} file(s) from registry.`);
    } catch (error) {
      s.stop('Failed to fetch skill download info.');
      log.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }

    let downloadedFiles;

    try {
      s.start('Downloading file contents...');
      downloadedFiles = await downloadFiles(downloadResponse.files);
      s.stop(`Downloaded ${downloadedFiles.length} file(s).`);
    } catch (error) {
      s.stop('Download failed.');
      log.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }

    // ── 5. Install per provider ───────────────────────────────

    const providerStats: Array<{
      displayPath: string;
      name: string;
      skipped: number;
      written: number;
    }> = [];

    for (const target of selectedTargets) {
      const adapter = getProvider(target);
      const targetDir = adapter.getTargetDirectory(scope, skill.name);
      const displayPath = adapter.getDisplayPath(scope, skill.name);

      // Build target paths for each file.
      const fileTargets = downloadedFiles.map((file) => {
        const relativePath = stripGithubPrefix(file.path, downloadResponse.githubPath);
        return {
          content: file.content,
          relativePath,
          targetPath: path.join(targetDir, relativePath),
        };
      });

      // Resolve conflicts.
      const resolutions = await resolveConflicts(fileTargets);

      // Check for cancellation.
      const hasCancellation = [...resolutions.values()].some((r) => r === 'cancel');
      if (hasCancellation) {
        cancel('Installation cancelled.');
        process.exit(0);
      }

      // Write files.
      let written = 0;
      let skipped = 0;

      for (const file of fileTargets) {
        const resolution = resolutions.get(file.targetPath);

        if (resolution === 'skip') {
          skipped++;
          continue;
        }

        // Ensure directory exists.
        await fs.mkdir(path.dirname(file.targetPath), { recursive: true });
        await fs.writeFile(file.targetPath, file.content);
        written++;
      }

      providerStats.push({
        displayPath,
        name: adapter.name,
        skipped,
        written,
      });
    }

    // ── 6. Summary ────────────────────────────────────────────

    const summaryLines: string[] = [
      `${chalk.bold('Skill:')}  ${skill.name} v${skill.version}`,
      `${chalk.bold('Scope:')}  ${scope}`,
      '',
    ];

    for (const stat of providerStats) {
      summaryLines.push(`${chalk.bold(stat.name)}`);
      summaryLines.push(`  Files installed: ${stat.written}`);
      if (stat.skipped > 0) {
        summaryLines.push(`  Files skipped:   ${stat.skipped}`);
      }
      summaryLines.push(`  Path: ${stat.displayPath}`);
    }

    note(summaryLines.join('\n'), 'Installation Summary');

    outro(chalk.green('Skill installed successfully!'));
  });
