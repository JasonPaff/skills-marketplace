import type { agentsQuerySchema, CreateAgent } from '@emergent/shared';
import type { z } from 'zod';

import { parseAgentMd } from '@emergent/shared';
import { HTTPException } from 'hono/http-exception';

import type { GitHubClient } from '../lib/github.js';
import type { AgentQueries } from '../queries/index.js';

export type AgentService = ReturnType<typeof createAgentService>;

type AgentsQuery = z.infer<typeof agentsQuerySchema>;

export function createAgentService(queries: AgentQueries, github: GitHubClient) {
  function deriveGithubPath(name: string): string {
    return `agents/${name}`;
  }

  return {
    async createAgent(data: CreateAgent) {
      const validated = this.validateAgent(data);

      // Commit files to GitHub (before DB insert so a failure doesn't leave orphaned records)
      const githubFiles = data.files.map((file) => ({
        content: file.content,
        path: `${validated.githubPath}/${file.path}`,
      }));
      await github.commitFiles(githubFiles, `Add agent: ${data.name}`);

      // Insert metadata into database
      return this.insertAgentRecord({
        color: validated.frontmatter.color ?? undefined,
        description: validated.description,
        githubPath: validated.githubPath,
        model: validated.frontmatter.model ?? undefined,
        name: validated.name,
        tools: validated.frontmatter.tools,
      });
    },

    async downloadAgent(id: string) {
      const agent = await queries.selectAgentById(id);

      if (!agent) {
        throw new HTTPException(404, { message: 'Agent not found' });
      }

      // Increment download count
      await queries.incrementDownloadCount(id);

      // Fetch file listing from GitHub
      const files = await github.listFiles(agent.githubPath);

      return {
        agent,
        files,
        githubPath: agent.githubPath,
      };
    },

    async getAgentById(id: string) {
      const agent = await queries.selectAgentById(id);

      if (!agent) {
        throw new HTTPException(404, { message: 'Agent not found' });
      }

      return agent;
    },

    async getAgents(query?: AgentsQuery) {
      return queries.selectAgents(query);
    },

    insertAgentRecord(values: {
      color?: string;
      description: string;
      githubPath: string;
      model?: string;
      name: string;
      tools?: string[];
    }) {
      return queries.insertAgent(values);
    },

    validateAgent(data: CreateAgent) {
      const { description, files, name } = data;

      const mdFile = files.find((f) => f.path.endsWith('.md'));
      if (!mdFile) {
        throw new HTTPException(400, { message: 'At least one .md file is required' });
      }

      let frontmatter: { color?: null | string; model?: null | string; tools?: string[] };
      try {
        const decoded = Buffer.from(mdFile.content, 'base64').toString('utf-8');
        const parsed = parseAgentMd(decoded);
        frontmatter = parsed.frontmatter;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid agent .md file';
        throw new HTTPException(400, { message });
      }

      const githubPath = deriveGithubPath(name);
      return { ...data, description, frontmatter, githubPath, name };
    },
  };
}
