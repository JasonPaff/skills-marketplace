import JSZip from 'jszip';

interface ExtractedFile {
  content: string;
  path: string;
}

/**
 * Extract files from a .zip File object.
 * Returns an array of { content (base64), path (relative) } entries.
 *
 * If the zip has a single root folder (e.g. `my-skill/SKILL.md`),
 * that root folder prefix is stripped so paths become relative (e.g. `SKILL.md`).
 */
export async function extractZipFiles(file: File): Promise<ExtractedFile[]> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const entries: ExtractedFile[] = [];

  for (const [relativePath, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const base64 = await entry.async('base64');
    entries.push({ content: base64, path: relativePath });
  }

  // Detect single root folder and strip it
  const rootFolder = detectSingleRootFolder(entries.map((e) => e.path));
  if (rootFolder) {
    const prefix = rootFolder + '/';
    return entries.map((e) => ({
      content: e.content,
      path: e.path.startsWith(prefix) ? e.path.slice(prefix.length) : e.path,
    }));
  }

  return entries;
}

/**
 * Extract the root folder name from a zip file (for deriving skill name).
 * Falls back to the zip filename without extension.
 */
export function getZipRootName(file: File, paths: string[]): string {
  const root = detectSingleRootFolder(paths);
  if (root) return root;

  // Fall back to zip filename minus extension
  return file.name.replace(/\.zip$/i, '');
}

/**
 * Detect if all paths share a single root folder.
 * Returns the folder name if so, otherwise null.
 */
function detectSingleRootFolder(paths: string[]): null | string {
  if (paths.length === 0) return null;

  const roots = new Set(paths.map((p) => p.split('/')[0]));
  if (roots.size === 1) {
    const root = [...roots][0]!;
    // Only strip if it looks like a folder (at least one path has something after it)
    if (paths.some((p) => p.includes('/'))) {
      return root;
    }
  }

  return null;
}
