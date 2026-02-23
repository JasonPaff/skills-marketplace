import type { CreateSkill, skillsQuerySchema } from '@emergent/shared';
import type { z } from 'zod';

import { parseSkillMd } from '@emergent/shared';
import { HTTPException } from 'hono/http-exception';

import type { GitHubClient } from '../lib/github.js';
import type { SkillQueries } from '../queries/index.js';

export type SkillService = ReturnType<typeof createSkillService>;

type SkillsQuery = z.infer<typeof skillsQuerySchema>;

export function createSkillService(queries: SkillQueries, github: GitHubClient) {
  function deriveGithubPath(name: string): string {
    return `skills/${name}`;
  }

  return {
    async createSkill(data: CreateSkill) {
      const { description, files, name } = data;

      // Validate SKILL.md frontmatter before committing
      const skillMdFile = files.find((f) => f.path === 'SKILL.md');
      if (!skillMdFile) {
        throw new HTTPException(400, { message: 'A SKILL.md file is required' });
      }

      try {
        const decoded = Buffer.from(skillMdFile.content, 'base64').toString('utf-8');
        parseSkillMd(decoded);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid SKILL.md';
        throw new HTTPException(400, { message });
      }

      // Determine GitHub path
      const githubPath = deriveGithubPath(name);

      // Commit files to GitHub (before DB insert so a failure doesn't leave orphaned records)
      const githubFiles = files.map((file) => ({
        content: file.content,
        path: `${githubPath}/${file.path}`,
      }));
      await github.commitFiles(githubFiles, `Add skill: ${name}`);

      // Insert metadata into database
      const skill = await queries.insertSkill({
        description,
        githubPath,
        name,
      });

      return skill;
    },

    async downloadSkill(id: string) {
      const skill = await queries.selectSkillById(id);

      if (!skill) {
        throw new HTTPException(404, { message: 'Skill not found' });
      }

      // Increment download count
      await queries.incrementDownloadCount(id);

      // Fetch file listing from GitHub
      const files = await github.listFiles(skill.githubPath);

      return {
        files,
        githubPath: skill.githubPath,
        skill,
      };
    },

    async getSkillById(id: string) {
      const skill = await queries.selectSkillById(id);

      if (!skill) {
        throw new HTTPException(404, { message: 'Skill not found' });
      }

      return skill;
    },

    async getSkills(query?: SkillsQuery) {
      return queries.selectSkills(query);
    },
  };
}
