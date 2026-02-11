import { Octokit } from 'octokit';

export type GitHubClient = ReturnType<typeof createGitHubClient>;

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
}

export function createGitHubClient(config: GitHubConfig) {
  const octokit = new Octokit({ auth: config.token });

  return {
    /**
     * Commit a single file to the repository.
     */
    async commitFile(path: string, content: string, message: string) {
      const response = await octokit.rest.repos.createOrUpdateFileContents({
        content: Buffer.from(content).toString('base64'),
        message,
        owner: config.owner,
        path,
        repo: config.repo,
      });
      return response.data;
    },

    /**
     * Commit multiple files in a single commit using the Git tree API.
     */
    async commitFiles(files: Array<{ content: string; path: string }>, message: string) {
      // Get the latest commit SHA on the default branch
      const { data: ref } = await octokit.rest.git.getRef({
        owner: config.owner,
        ref: 'heads/main',
        repo: config.repo,
      });
      const latestCommitSha = ref.object.sha;

      // Create blobs for each file (content is already base64-encoded)
      const blobs = await Promise.all(
        files.map(async (file) => {
          const { data: blob } = await octokit.rest.git.createBlob({
            content: file.content,
            encoding: 'base64',
            owner: config.owner,
            repo: config.repo,
          });
          return { path: file.path, sha: blob.sha };
        }),
      );

      // Create a new tree
      const { data: tree } = await octokit.rest.git.createTree({
        base_tree: latestCommitSha,
        owner: config.owner,
        repo: config.repo,
        tree: blobs.map((blob) => ({
          mode: '100644' as const,
          path: blob.path,
          sha: blob.sha,
          type: 'blob' as const,
        })),
      });

      // Create a commit
      const { data: commit } = await octokit.rest.git.createCommit({
        message,
        owner: config.owner,
        parents: [latestCommitSha],
        repo: config.repo,
        tree: tree.sha,
      });

      // Update the reference
      await octokit.rest.git.updateRef({
        owner: config.owner,
        ref: 'heads/main',
        repo: config.repo,
        sha: commit.sha,
      });

      return commit;
    },

    /**
     * Get the contents of a file or directory from the repository.
     */
    async getContents(path: string) {
      const response = await octokit.rest.repos.getContent({
        owner: config.owner,
        path,
        repo: config.repo,
      });
      return response.data;
    },

    /**
     * List all files in a directory (recursive).
     */
    async listFiles(
      path: string,
    ): Promise<Array<{ downloadUrl: string; name: string; path: string; size: number }>> {
      const contents = await this.getContents(path);

      if (!Array.isArray(contents)) {
        return [];
      }

      const files: Array<{ downloadUrl: string; name: string; path: string; size: number }> = [];

      for (const item of contents) {
        if (item.type === 'file') {
          files.push({
            downloadUrl: item.download_url ?? '',
            name: item.name,
            path: item.path,
            size: item.size,
          });
        } else if (item.type === 'dir') {
          const subFiles = await this.listFiles(item.path);
          files.push(...subFiles);
        }
      }

      return files;
    },
  };
}
