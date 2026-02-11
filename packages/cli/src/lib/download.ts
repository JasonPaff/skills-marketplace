import type { SkillFile } from '@emergent/shared';

export interface DownloadedFile extends SkillFile {
  content: Buffer;
}

export async function downloadFile(file: SkillFile): Promise<DownloadedFile> {
  const res = await fetch(file.downloadUrl);

  if (!res.ok) {
    throw new Error(
      `Failed to download "${file.name}": HTTP ${res.status} ${res.statusText}`,
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  const content = Buffer.from(arrayBuffer);

  return {
    ...file,
    content,
  };
}

export async function downloadFiles(files: SkillFile[]): Promise<DownloadedFile[]> {
  return Promise.all(files.map(downloadFile));
}
