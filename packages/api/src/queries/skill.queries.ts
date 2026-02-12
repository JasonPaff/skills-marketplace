import { and, eq, ilike, sql } from 'drizzle-orm';

import type { Database } from '../db/index.js';

import { projects, projectSkills, skills } from '../db/schema.js';

export type SkillQueries = ReturnType<typeof createSkillQueries>;

export function createSkillQueries(db: Database) {
  return {
    async incrementDownloadCount(id: string) {
      await db
        .update(skills)
        .set({ downloadCount: sql`${skills.downloadCount} + 1` })
        .where(eq(skills.id, id));
    },

    async insertProjectSkill(values: {
      isCustomized: boolean;
      projectId: string;
      skillId: string;
    }) {
      await db.insert(projectSkills).values(values);
    },

    async insertSkill(values: {
      description: string;
      githubPath: string;
      name: string;
      parentSkillId?: string;
      version?: string;
    }) {
      const [skill] = await db.insert(skills).values(values).returning();
      return skill;
    },

    async selectProjectById(projectId: string) {
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      return project as typeof project | undefined;
    },

    async selectSkillById(id: string) {
      const [skill] = await db.select().from(skills).where(eq(skills.id, id));
      return skill as typeof skill | undefined;
    },

    async selectSkills(filters?: { search?: string }) {
      const conditions = [];

      if (filters?.search) {
        conditions.push(ilike(skills.name, `%${filters.search}%`));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      return db.select().from(skills).where(where).orderBy(skills.name);
    },

    async updateSkillRating(
      id: string,
      data: { averageRating: number; ratingCount: number; totalRating: number },
    ) {
      const [updated] = await db
        .update(skills)
        .set({
          averageRating: data.averageRating,
          ratingCount: data.ratingCount,
          totalRating: data.totalRating,
        })
        .where(eq(skills.id, id))
        .returning();
      return updated;
    },
  };
}
