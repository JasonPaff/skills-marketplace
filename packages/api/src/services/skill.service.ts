import type { forkSkillSchema, skillsQuerySchema } from '@emergent/shared';
import type { z } from 'zod';

import { and, eq, ilike, sql } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

import type { Database } from '../db/index.js';
import type { GitHubClient } from '../lib/github.js';

import { projects, projectSkills, skills } from '../db/schema.js';
import { insertSkillSchema } from '../db/validation.js';

export type SkillService = ReturnType<typeof createSkillService>;
type CreateSkillData = z.infer<typeof insertSkillSchema>;
type ForkSkillData = z.infer<typeof forkSkillSchema>;

type SkillsQuery = z.infer<typeof skillsQuerySchema>;

export function createSkillService(db: Database, github: GitHubClient) {
  async function deriveGithubPath(
    name: string,
    isGlobal: boolean,
    projectId?: null | string,
  ): Promise<string> {
    if (isGlobal) {
      return `skills/global/${name}`;
    }

    // Look up project slug
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId!));

    if (!project) {
      throw new HTTPException(404, { message: 'Project not found' });
    }

    const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
    return `skills/projects/${projectSlug}/${name}`;
  }

  return {
    async createSkill(data: CreateSkillData) {
      const { category, description, isGlobal, name, projectId, uploadedBy } = data;

      // Determine GitHub path
      const githubPath = await deriveGithubPath(name, isGlobal, projectId);

      // TODO: Commit files to GitHub via github.commitFiles()

      // Insert metadata into database
      const [skill] = await db
        .insert(skills)
        .values({
          category,
          description,
          githubPath,
          isGlobal,
          name,
          uploadedBy,
        })
        .returning();

      // If project-specific, create project_skills entry
      if (!isGlobal && projectId) {
        await db.insert(projectSkills).values({
          isCustomized: false,
          projectId,
          skillId: skill.id,
        });
      }

      return skill;
    },

    async downloadSkill(id: string) {
      const [skill] = await db.select().from(skills).where(eq(skills.id, id));

      if (!skill) {
        throw new HTTPException(404, { message: 'Skill not found' });
      }

      // Increment download count
      await db
        .update(skills)
        .set({ downloadCount: sql`${skills.downloadCount} + 1` })
        .where(eq(skills.id, id));

      // Fetch file listing from GitHub
      const files = await github.listFiles(skill.githubPath);

      return {
        files,
        githubPath: skill.githubPath,
        skill,
      };
    },

    async forkSkill(id: string, data: ForkSkillData) {
      const { newName, projectId } = data;

      // Get original skill
      const [original] = await db.select().from(skills).where(eq(skills.id, id));

      if (!original) {
        throw new HTTPException(404, { message: 'Skill not found' });
      }

      // Get project
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));

      if (!project) {
        throw new HTTPException(404, { message: 'Project not found' });
      }

      const skillName = newName ?? original.name;
      const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
      const githubPath = `skills/projects/${projectSlug}/${skillName}`;

      // TODO: Copy files from original.githubPath to new githubPath via GitHub API

      // Create new skill record
      const [forked] = await db
        .insert(skills)
        .values({
          category: original.category,
          description: original.description,
          githubPath,
          isGlobal: false,
          name: skillName,
          parentSkillId: original.id,
          uploadedBy: original.uploadedBy,
          version: original.version,
        })
        .returning();

      // Create project_skills entry
      await db.insert(projectSkills).values({
        isCustomized: true,
        projectId,
        skillId: forked.id,
      });

      return forked;
    },

    async getSkillById(id: string) {
      const [skill] = await db.select().from(skills).where(eq(skills.id, id));

      if (!skill) {
        throw new HTTPException(404, { message: 'Skill not found' });
      }

      return skill;
    },

    async getSkills(query?: SkillsQuery) {
      const conditions = [];

      if (query?.search) {
        conditions.push(ilike(skills.name, `%${query.search}%`));
      }
      if (query?.category) {
        conditions.push(eq(skills.category, query.category));
      }
      if (query?.isGlobal !== undefined) {
        conditions.push(eq(skills.isGlobal, query.isGlobal));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      return db.select().from(skills).where(where).orderBy(skills.name);
    },

    async rateSkill(id: string, rating: number) {
      const [skill] = await db.select().from(skills).where(eq(skills.id, id));

      if (!skill) {
        throw new HTTPException(404, { message: 'Skill not found' });
      }

      const newTotalRating = skill.totalRating + rating;
      const newRatingCount = skill.ratingCount + 1;
      const newAverageRating = (newTotalRating / newRatingCount).toFixed(2);

      const [updated] = await db
        .update(skills)
        .set({
          averageRating: newAverageRating,
          ratingCount: newRatingCount,
          totalRating: newTotalRating,
        })
        .where(eq(skills.id, id))
        .returning();

      return updated;
    },
  };
}
