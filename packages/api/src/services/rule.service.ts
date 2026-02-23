import type { CreateRule, rulesQuerySchema } from '@emergent/shared';
import type { z } from 'zod';

import { parseRuleMd } from '@emergent/shared';
import { HTTPException } from 'hono/http-exception';

import type { GitHubClient } from '../lib/github.js';
import type { RuleQueries } from '../queries/index.js';

export type RuleService = ReturnType<typeof createRuleService>;

type RulesQuery = z.infer<typeof rulesQuerySchema>;

export function createRuleService(queries: RuleQueries, github: GitHubClient) {
  function deriveGithubPath(name: string): string {
    return `rules/${name}`;
  }

  return {
    async createRule(data: CreateRule) {
      const validated = this.validateRule(data);

      // Commit files to GitHub (before DB insert so a failure doesn't leave orphaned records)
      const githubFiles = data.files.map((file) => ({
        content: file.content,
        path: `${validated.githubPath}/${file.path}`,
      }));
      await github.commitFiles(githubFiles, `Add rule: ${data.name}`);

      // Insert metadata into database
      return this.insertRuleRecord({
        description: validated.description,
        githubPath: validated.githubPath,
        name: validated.name,
        paths: validated.frontmatter.paths,
      });
    },

    async downloadRule(id: string) {
      const rule = await queries.selectRuleById(id);

      if (!rule) {
        throw new HTTPException(404, { message: 'Rule not found' });
      }

      // Increment download count
      await queries.incrementDownloadCount(id);

      // Fetch file listing from GitHub
      const files = await github.listFiles(rule.githubPath);

      return {
        files,
        githubPath: rule.githubPath,
        rule,
      };
    },

    async getRuleById(id: string) {
      const rule = await queries.selectRuleById(id);

      if (!rule) {
        throw new HTTPException(404, { message: 'Rule not found' });
      }

      return rule;
    },

    async getRules(query?: RulesQuery) {
      return queries.selectRules(query);
    },

    insertRuleRecord(values: {
      description: string;
      githubPath: string;
      name: string;
      paths?: string[];
    }) {
      return queries.insertRule(values);
    },

    validateRule(data: CreateRule) {
      const { description, files, name } = data;

      const mdFile = files.find((f) => f.path.endsWith('.md'));
      if (!mdFile) {
        throw new HTTPException(400, { message: 'At least one .md file is required' });
      }

      let frontmatter: { paths?: string[] };
      try {
        const decoded = Buffer.from(mdFile.content, 'base64').toString('utf-8');
        const parsed = parseRuleMd(decoded);
        frontmatter = parsed.frontmatter;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid RULE.md';
        throw new HTTPException(400, { message });
      }

      const githubPath = deriveGithubPath(name);
      return { ...data, description, frontmatter, githubPath, name };
    },
  };
}
