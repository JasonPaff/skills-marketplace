// Load .env file in development only (Vercel injects env vars natively)
if (process.env.NODE_ENV !== 'production') {
  await import('dotenv/config');
}

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { createDb } from './db/index.js';
import { createGitHubClient } from './lib/github.js';
import { clientsRouter } from './routes/clients.js';
import { projectsRouter } from './routes/projects.js';
import { skillsRouter } from './routes/skills.js';

type Env = {
  Bindings: {
    DATABASE_URL: string;
    GITHUB_OWNER: string;
    GITHUB_REPO: string;
    GITHUB_TOKEN: string;
  };
};

const app = new Hono<Env>();

// ─── Middleware ────────────────────────────────────────────────────

app.use('*', logger());
app.use(
  '/api/*',
  cors({
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    origin: ['http://localhost:3000'], // Add production domain(s) here
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

  c.set('db' as never, db);
  c.set('github' as never, github);
  await next();
});

// ─── Routes ───────────────────────────────────────────────────────

app.route('/api/skills', skillsRouter);
app.route('/api/projects', projectsRouter);
app.route('/api/clients', clientsRouter);

// ─── Health Check ─────────────────────────────────────────────────

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Global Error Handler ─────────────────────────────────────────

app.onError((err, c) => {
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

export default app;
