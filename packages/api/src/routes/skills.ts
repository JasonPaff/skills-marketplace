import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, ilike, and, sql } from "drizzle-orm";
import { createSkillSchema, skillsQuerySchema, rateSkillSchema, forkSkillSchema } from "@emergent/shared";
import type { Database } from "../db/index.js";
import type { GitHubClient } from "../lib/github.js";
import { skills, projectSkills, projects } from "../db/schema.js";

type Env = {
  Variables: {
    db: Database;
    github: GitHubClient;
  };
};

const skillsRouter = new Hono<Env>();

// GET /api/skills - List skills with optional filters
skillsRouter.get("/", zValidator("query", skillsQuerySchema), async (c) => {
  const { search, category, projectId, isGlobal } = c.req.valid("query");
  const db = c.get("db");

  const conditions = [];

  if (search) {
    conditions.push(ilike(skills.name, `%${search}%`));
  }
  if (category) {
    conditions.push(eq(skills.category, category));
  }
  if (isGlobal !== undefined) {
    conditions.push(eq(skills.isGlobal, isGlobal));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db.select().from(skills).where(where).orderBy(skills.name);

  return c.json({ data: results });
});

// GET /api/skills/:id - Get single skill
skillsRouter.get("/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");

  const [skill] = await db.select().from(skills).where(eq(skills.id, id));

  if (!skill) {
    return c.json({ error: "Not found", message: "Skill not found", statusCode: 404 }, 404);
  }

  return c.json({ data: skill });
});

// POST /api/skills - Create a new skill
skillsRouter.post("/", async (c) => {
  // NOTE: File upload handling (multipart/form-data) will be implemented
  // when building out the full endpoint. This handles the metadata portion.
  const db = c.get("db");
  const github = c.get("github");
  const body = await c.req.json();

  const parsed = createSkillSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation error", message: parsed.error.message, statusCode: 400 },
      400
    );
  }

  const { name, description, category, isGlobal, projectId, uploadedBy } = parsed.data;

  // Determine GitHub path
  let githubPath: string;
  if (isGlobal) {
    githubPath = `skills/global/${name}`;
  } else {
    // Look up project slug
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId!));

    if (!project) {
      return c.json(
        { error: "Not found", message: "Project not found", statusCode: 404 },
        404
      );
    }

    const projectSlug = project.name.toLowerCase().replace(/\s+/g, "-");
    githubPath = `skills/projects/${projectSlug}/${name}`;
  }

  // TODO: Commit files to GitHub via github.commitFiles()

  // Insert metadata into database
  const [skill] = await db
    .insert(skills)
    .values({
      name,
      description,
      category,
      githubPath,
      uploadedBy,
      isGlobal,
    })
    .returning();

  // If project-specific, create project_skills entry
  if (!isGlobal && projectId) {
    await db.insert(projectSkills).values({
      projectId,
      skillId: skill.id,
      isCustomized: false,
    });
  }

  return c.json({ data: skill }, 201);
});

// GET /api/skills/:id/download - Get download info and increment count
skillsRouter.get("/:id/download", async (c) => {
  const db = c.get("db");
  const github = c.get("github");
  const id = c.req.param("id");

  const [skill] = await db.select().from(skills).where(eq(skills.id, id));

  if (!skill) {
    return c.json({ error: "Not found", message: "Skill not found", statusCode: 404 }, 404);
  }

  // Increment download count
  await db
    .update(skills)
    .set({ downloadCount: sql`${skills.downloadCount} + 1` })
    .where(eq(skills.id, id));

  // Fetch file listing from GitHub
  const files = await github.listFiles(skill.githubPath);

  return c.json({
    data: {
      skill,
      githubPath: skill.githubPath,
      files,
    },
  });
});

// POST /api/skills/:id/rate - Rate a skill
skillsRouter.post("/:id/rate", zValidator("json", rateSkillSchema), async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const { rating } = c.req.valid("json");

  const [skill] = await db.select().from(skills).where(eq(skills.id, id));

  if (!skill) {
    return c.json({ error: "Not found", message: "Skill not found", statusCode: 404 }, 404);
  }

  const newTotalRating = skill.totalRating + rating;
  const newRatingCount = skill.ratingCount + 1;
  const newAverageRating = (newTotalRating / newRatingCount).toFixed(2);

  const [updated] = await db
    .update(skills)
    .set({
      totalRating: newTotalRating,
      ratingCount: newRatingCount,
      averageRating: newAverageRating,
    })
    .where(eq(skills.id, id))
    .returning();

  return c.json({ data: updated });
});

// POST /api/skills/:id/fork - Fork a skill to a project
skillsRouter.post("/:id/fork", zValidator("json", forkSkillSchema), async (c) => {
  const db = c.get("db");
  const github = c.get("github");
  const id = c.req.param("id");
  const { projectId, newName } = c.req.valid("json");

  // Get original skill
  const [original] = await db.select().from(skills).where(eq(skills.id, id));

  if (!original) {
    return c.json({ error: "Not found", message: "Skill not found", statusCode: 404 }, 404);
  }

  // Get project
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));

  if (!project) {
    return c.json({ error: "Not found", message: "Project not found", statusCode: 404 }, 404);
  }

  const skillName = newName ?? original.name;
  const projectSlug = project.name.toLowerCase().replace(/\s+/g, "-");
  const githubPath = `skills/projects/${projectSlug}/${skillName}`;

  // TODO: Copy files from original.githubPath to new githubPath via GitHub API

  // Create new skill record
  const [forked] = await db
    .insert(skills)
    .values({
      name: skillName,
      description: original.description,
      category: original.category,
      githubPath,
      uploadedBy: original.uploadedBy,
      isGlobal: false,
      parentSkillId: original.id,
      version: original.version,
    })
    .returning();

  // Create project_skills entry
  await db.insert(projectSkills).values({
    projectId,
    skillId: forked.id,
    isCustomized: true,
  });

  return c.json({ data: forked }, 201);
});

export { skillsRouter };
