import type { CreateSkill, ForkSkill, skillsQuerySchema } from '@emergent/shared';
import type { z } from 'zod';

import { HTTPException } from 'hono/http-exception';

import type { GitHubClient } from '../lib/github.js';
import type { SkillQueries } from '../queries/index.js';

export type SkillService = ReturnType<typeof createSkillService>;

type SkillsQuery = z.infer<typeof skillsQuerySchema>;

export function createSkillService(queries: SkillQueries, github: GitHubClient) {
  async function deriveGithubPath(
    name: string,
    isGlobal: boolean,
    projectId?: null | string,
  ): Promise<string> {
    if (isGlobal) {
      return `skills/global/${name}`;
    }

    // Look up project slug
    const project = await queries.selectProjectById(projectId!);

    if (!project) {
      throw new HTTPException(404, { message: 'Project not found' });
    }

    const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
    return `skills/projects/${projectSlug}/${name}`;
  }

  return {
    async createSkill(data: CreateSkill) {
      const { category, description, files, isGlobal, name, projectId, uploadedBy } = data;

      // Determine GitHub path
      const githubPath = await deriveGithubPath(name, isGlobal, projectId);

      // Commit files to GitHub (before DB insert so a failure doesn't leave orphaned records)
      const githubFiles = files.map((file) => ({
        content: file.content,
        path: `${githubPath}/${file.path}`,
      }));
      await github.commitFiles(githubFiles, `Add skill: ${name}`);

      // Insert metadata into database
      const skill = await queries.insertSkill({
        category,
        description,
        githubPath,
        isGlobal,
        name,
        uploadedBy,
      });

      // If project-specific, create project_skills entry
      if (!isGlobal && projectId) {
        await queries.insertProjectSkill({
          isCustomized: false,
          projectId,
          skillId: skill.id,
        });
      }

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

    async forkSkill(id: string, data: ForkSkill) {
      const { newName, projectId } = data;

      // Get original skill
      const original = await queries.selectSkillById(id);

      if (!original) {
        throw new HTTPException(404, { message: 'Skill not found' });
      }

      // Get project
      const project = await queries.selectProjectById(projectId);

      if (!project) {
        throw new HTTPException(404, { message: 'Project not found' });
      }

      const skillName = newName ?? original.name;
      const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
      const githubPath = `skills/projects/${projectSlug}/${skillName}`;

      // TODO: Copy files from original.githubPath to new githubPath via GitHub API

      // Create new skill record
      const forked = await queries.insertSkill({
        category: original.category,
        description: original.description,
        githubPath,
        isGlobal: false,
        name: skillName,
        parentSkillId: original.id,
        uploadedBy: original.uploadedBy,
        version: original.version,
      });

      // Create project_skills entry
      await queries.insertProjectSkill({
        isCustomized: true,
        projectId,
        skillId: forked.id,
      });

      return forked;
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

    async rateSkill(id: string, rating: number) {
      const skill = await queries.selectSkillById(id);

      if (!skill) {
        throw new HTTPException(404, { message: 'Skill not found' });
      }

      const newTotalRating = skill.totalRating + rating;
      const newRatingCount = skill.ratingCount + 1;
      const newAverageRating = newTotalRating / newRatingCount;

      const updated = await queries.updateSkillRating(id, {
        averageRating: newAverageRating,
        ratingCount: newRatingCount,
        totalRating: newTotalRating,
      });

      return updated;
    },
  };
}
