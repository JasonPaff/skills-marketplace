import { Octokit } from "octokit";

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export function createGitHubClient(config: GitHubConfig) {
  const octokit = new Octokit({ auth: config.token });

  return {
    /**
     * Commit a single file to the repository.
     */
    async commitFile(path: string, content: string, message: string) {
      const response = await octokit.rest.repos.createOrUpdateFileContents({
        owner: config.owner,
        repo: config.repo,
        path,
        message,
        content: Buffer.from(content).toString("base64"),
      });
      return response.data;
    },

    /**
     * Get the contents of a file or directory from the repository.
     */
    async getContents(path: string) {
      const response = await octokit.rest.repos.getContent({
        owner: config.owner,
        repo: config.repo,
        path,
      });
      return response.data;
    },

    /**
     * List all files in a directory (recursive).
     */
    async listFiles(path: string): Promise<Array<{ name: string; path: string; downloadUrl: string; size: number }>> {
      const contents = await this.getContents(path);

      if (!Array.isArray(contents)) {
        return [];
      }

      return contents
        .filter((item) => item.type === "file")
        .map((item) => ({
          name: item.name,
          path: item.path,
          downloadUrl: item.download_url ?? "",
          size: item.size,
        }));
    },

    /**
     * Commit multiple files in a single commit using the Git tree API.
     */
    async commitFiles(
      files: Array<{ path: string; content: string }>,
      message: string
    ) {
      // Get the latest commit SHA on the default branch
      const { data: ref } = await octokit.rest.git.getRef({
        owner: config.owner,
        repo: config.repo,
        ref: "heads/main",
      });
      const latestCommitSha = ref.object.sha;

      // Create blobs for each file
      const blobs = await Promise.all(
        files.map(async (file) => {
          const { data: blob } = await octokit.rest.git.createBlob({
            owner: config.owner,
            repo: config.repo,
            content: Buffer.from(file.content).toString("base64"),
            encoding: "base64",
          });
          return { path: file.path, sha: blob.sha };
        })
      );

      // Create a new tree
      const { data: tree } = await octokit.rest.git.createTree({
        owner: config.owner,
        repo: config.repo,
        base_tree: latestCommitSha,
        tree: blobs.map((blob) => ({
          path: blob.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blob.sha,
        })),
      });

      // Create a commit
      const { data: commit } = await octokit.rest.git.createCommit({
        owner: config.owner,
        repo: config.repo,
        message,
        tree: tree.sha,
        parents: [latestCommitSha],
      });

      // Update the reference
      await octokit.rest.git.updateRef({
        owner: config.owner,
        repo: config.repo,
        ref: "heads/main",
        sha: commit.sha,
      });

      return commit;
    },
  };
}

export type GitHubClient = ReturnType<typeof createGitHubClient>;
