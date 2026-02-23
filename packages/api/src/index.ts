// Load .env file in development only (Vercel injects env vars natively)
if (process.env.NODE_ENV !== 'production') {
  await import('dotenv/config');
}

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';

import type { AppEnv } from './types/env.js';

import { createDb } from './db/index.js';
import { createGitHubClient } from './lib/github.js';
import { createAgentQueries, createRuleQueries, createSkillQueries } from './queries/index.js';
import { agentsRouter } from './routes/agents.js';
import { rulesRouter } from './routes/rules.js';
import { skillsRouter } from './routes/skills.js';
import { uploadRouter } from './routes/upload.js';
import { createAgentService, createRuleService, createSkillService, createUploadService } from './services/index.js';

const app = new Hono<AppEnv>();

// ─── Middleware ────────────────────────────────────────────────────

app.use('*', logger());
app.use(
  '/api/*',
  cors({
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    origin: ['http://localhost:3000', ...(process.env.WEB_URL ? [process.env.WEB_URL] : [])],
  }),
);

// Inject database and GitHub client into context
app.use('/api/*', async (c, next) => {
  const db = createDb(c.env.DATABASE_URL ?? process.env.DATABASE_URL!);
  const github = createGitHubClient({
    owner: c.env.GITHUB_OWNER ?? process.env.GITHUB_OWNER!,
    repo: c.env.GITHUB_REPO ?? process.env.GITHUB_REPO!,
    token: c.env.GITHUB_TOKEN ?? process.env.GITHUB_TOKEN!,
  });

  c.set('db', db);
  c.set('github', github);

  const agentQueries = createAgentQueries(db);
  const ruleQueries = createRuleQueries(db);
  const skillQueries = createSkillQueries(db);

  const agentService = createAgentService(agentQueries, github);
  const ruleService = createRuleService(ruleQueries, github);
  const skillService = createSkillService(skillQueries, github);
  const uploadService = createUploadService(skillService, agentService, ruleService, github);

  c.set('agentService', agentService);
  c.set('ruleService', ruleService);
  c.set('skillService', skillService);
  c.set('uploadService', uploadService);

  await next();
});

// ─── Routes ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used only for AppType export
const routes = app
  .route('/api/agents', agentsRouter)
  .route('/api/rules', rulesRouter)
  .route('/api/skills', skillsRouter)
  .route('/api/upload', uploadRouter);

// ─── Health Check ─────────────────────────────────────────────────

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Global Error Handler ─────────────────────────────────────────

app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      message: 'Route not found',
      statusCode: 404,
    },
    404,
  );
});

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error('Unhandled error:', err);
  return c.json(
    {
      error: 'Internal server error',
      message: err.message,
      statusCode: 500,
    },
    500,
  );
});

// ─── Local Dev Server ─────────────────────────────────────────────

// When running locally with tsx, start on port 8787
// For Vercel/Cloudflare deployment, the platform handles this
const isLocalDev = process.env.NODE_ENV !== 'production';
if (isLocalDev) {
  const { serve } = await import('@hono/node-server');
  serve({ fetch: app.fetch, port: 8787 }, (info) => {
    console.log(`🔥 API running at http://localhost:${info.port}`);
  });
}

export type AppType = typeof routes;
export default app;
