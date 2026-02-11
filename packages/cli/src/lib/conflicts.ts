import { cancel, isCancel, log, select } from '@clack/prompts';
import fs from 'node:fs/promises';

export type ConflictResolution = 'cancel' | 'overwrite' | 'skip';

/**
 * Check whether a file already exists at the given path.
 * Returns `true` when the file exists, `false` otherwise.
 */
export async function checkFileConflict(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Prompt the user to decide what to do when a target file already exists.
 * Returns the chosen {@link ConflictResolution}.
 */
export async function promptConflictResolution(filePath: string): Promise<ConflictResolution> {
  const result = await select<ConflictResolution>({
    message: `File already exists: ${filePath}`,
    options: [
      { hint: 'replace the existing file', label: 'Overwrite', value: 'overwrite' },
      { hint: 'keep the existing file', label: 'Skip', value: 'skip' },
      { hint: 'abort the entire install', label: 'Cancel installation', value: 'cancel' },
    ],
  });

  if (isCancel(result)) {
    cancel('Installation cancelled.');
    return 'cancel';
  }

  return result;
}

/**
 * Walk through every target file, detect conflicts, and collect a resolution
 * for each one. Short-circuits as soon as the user cancels, marking all
 * remaining files as "cancel".
 */
export async function resolveConflicts(
  files: Array<{ targetPath: string }>,
): Promise<Map<string, ConflictResolution>> {
  const resolutions = new Map<string, ConflictResolution>();

  for (const file of files) {
    const exists = await checkFileConflict(file.targetPath);

    if (!exists) {
      resolutions.set(file.targetPath, 'overwrite');
      continue;
    }

    log.warn(`Conflict detected: ${file.targetPath}`);
    const resolution = await promptConflictResolution(file.targetPath);
    resolutions.set(file.targetPath, resolution);

    if (resolution === 'cancel') {
      // Short-circuit: mark every remaining file as cancelled.
      for (const remaining of files) {
        if (!resolutions.has(remaining.targetPath)) {
          resolutions.set(remaining.targetPath, 'cancel');
        }
      }
      break;
    }
  }

  return resolutions;
}
