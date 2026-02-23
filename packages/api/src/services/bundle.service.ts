import type { bundlesQuerySchema } from '@emergent/shared';
import type { z } from 'zod';

import { HTTPException } from 'hono/http-exception';

import type { GitHubClient } from '../lib/github.js';
import type { BundleQueries } from '../queries/index.js';

export type BundleService = ReturnType<typeof createBundleService>;

type BundlesQuery = z.infer<typeof bundlesQuerySchema>;

export function createBundleService(queries: BundleQueries, github: GitHubClient) {
  function deriveGithubPath(name: string): string {
    return `bundles/${name}`;
  }

  return {
    async createBundle(data: { description: string; name: string }) {
      const githubPath = deriveGithubPath(data.name);

      return queries.insertBundle({
        description: data.description,
        githubPath,
        name: data.name,
      });
    },

    async createBundleWithLinks(data: {
      agentIds?: string[];
      description: string;
      name: string;
      ruleIds?: string[];
      skillIds?: string[];
    }) {
      const bundle = await this.createBundle({
        description: data.description,
        name: data.name,
      });

      // Link each skill to the bundle
      if (data.skillIds) {
        for (const skillId of data.skillIds) {
          await queries.linkSkillToBundle(bundle.id, skillId);
        }
      }

      // Link each agent to the bundle
      if (data.agentIds) {
        for (const agentId of data.agentIds) {
          await queries.linkAgentToBundle(bundle.id, agentId);
        }
      }

      // Link each rule to the bundle
      if (data.ruleIds) {
        for (const ruleId of data.ruleIds) {
          await queries.linkRuleToBundle(bundle.id, ruleId);
        }
      }

      return bundle;
    },

    async downloadBundle(id: string) {
      const bundle = await this.getBundleById(id);

      // Increment download count
      await queries.incrementDownloadCount(id);

      // Aggregate all GitHub files from linked items
      const allFiles: Array<{ downloadUrl: string; name: string; path: string; size: number }> = [];

      // Fetch files for each linked skill
      if (bundle.skills) {
        for (const skill of bundle.skills) {
          const files = await github.listFiles(skill.githubPath);
          allFiles.push(...files);
        }
      }

      // Fetch files for each linked agent
      if (bundle.agents) {
        for (const agent of bundle.agents) {
          const files = await github.listFiles(agent.githubPath);
          allFiles.push(...files);
        }
      }

      // Fetch files for each linked rule
      if (bundle.rules) {
        for (const rule of bundle.rules) {
          const files = await github.listFiles(rule.githubPath);
          allFiles.push(...files);
        }
      }

      return {
        bundle,
        files: allFiles,
        githubPath: bundle.githubPath,
      };
    },

    async getBundleById(id: string) {
      const bundle = await queries.selectBundleWithItems(id);

      if (!bundle) {
        throw new HTTPException(404, { message: 'Bundle not found' });
      }

      return bundle;
    },

    async getBundles(query?: BundlesQuery) {
      return queries.selectBundles(query);
    },
  };
}
