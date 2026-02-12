import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema.js';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('Seeding database...');

  // Clear existing data (order matters for FK constraints)
  await db.delete(schema.projectSkills);
  await db.delete(schema.skills);
  await db.delete(schema.projects);
  await db.delete(schema.clients);

  // Create clients
  const [acme] = await db
    .insert(schema.clients)
    .values({ description: 'Large enterprise client', name: 'Acme Corp' })
    .returning();

  const [northwind] = await db
    .insert(schema.clients)
    .values({ description: 'Mid-market retail client', name: 'Northwind Traders' })
    .returning();

  console.log(`  Created ${2} clients`);

  // Create projects
  await db
    .insert(schema.projects)
    .values({
      clientId: acme.id,
      description: 'Customer-facing web application',
      name: 'Acme Web Portal',
    })
    .returning();

  const [acmeApi] = await db
    .insert(schema.projects)
    .values({
      clientId: acme.id,
      description: 'Internal API microservices',
      name: 'Acme API Platform',
    })
    .returning();

  const [northwindApp] = await db
    .insert(schema.projects)
    .values({
      clientId: northwind.id,
      description: 'React Native mobile application',
      name: 'Northwind Mobile App',
    })
    .returning();

  console.log(`  Created ${3} projects`);

  // Create global skills
  const globalSkillData: {
    description: string;
    downloadCount?: number;
    githubPath: string;
    name: string;
  }[] = [
    {
      description:
        'Best practices for React component architecture including compound components, render props, and hooks patterns.',
      githubPath: 'skills/global/react-component-patterns',
      name: 'react-component-patterns',
    },
    {
      description:
        'Generate .NET Web API controllers, services, and DTOs following Emergent coding standards.',
      downloadCount: 12,
      githubPath: 'skills/global/dotnet-api-scaffolding',
      name: 'dotnet-api-scaffolding',
    },
    {
      description:
        'Analyze and optimize SQL queries for performance, suggesting index improvements and query rewrites.',
      downloadCount: 8,
      githubPath: 'skills/global/sql-query-optimizer',
      name: 'sql-query-optimizer',
    },
    {
      description:
        'Enforce strict TypeScript patterns including proper null checks, exhaustive switch statements, and branded types.',
      downloadCount: 25,
      githubPath: 'skills/global/typescript-strict-mode',
      name: 'typescript-strict-mode',
    },
    {
      description:
        'Generate comprehensive unit tests with arrange-act-assert pattern, mocking strategies, and edge case coverage.',
      downloadCount: 18,
      githubPath: 'skills/global/unit-test-generator',
      name: 'unit-test-generator',
    },
    {
      description:
        'Create Docker Compose configurations for local development with database, cache, and service dependencies.',
      downloadCount: 6,
      githubPath: 'skills/global/docker-compose-setup',
      name: 'docker-compose-setup',
    },
    {
      description:
        'Run through OWASP Top 10 security checks on code, identifying vulnerabilities and suggesting mitigations.',
      downloadCount: 3,
      githubPath: 'skills/global/security-audit-checklist',
      name: 'security-audit-checklist',
    },
    {
      description:
        'Set up and configure React Navigation with typed routes, deep linking, and authentication flows.',
      downloadCount: 4,
      githubPath: 'skills/global/react-native-navigation',
      name: 'react-native-navigation',
    },
  ];

  const globalSkills = await db
    .insert(schema.skills)
    .values(globalSkillData)
    .returning();

  console.log(`  Created ${globalSkills.length} global skills`);

  // Create project-specific skills
  const projectSkillData: {
    description: string;
    githubPath: string;
    name: string;
    parentSkillId?: string;
  }[] = [
    {
      description:
        'Acme-specific API naming conventions, error response formats, and pagination patterns.',
      githubPath: 'skills/projects/acme-api-platform/acme-api-conventions',
      name: 'acme-api-conventions',
      parentSkillId: globalSkills.find((s) => s.name === 'dotnet-api-scaffolding')!.id,
    },
    {
      description:
        'Northwind brand-specific React Native components with their design system tokens and accessibility requirements.',
      githubPath: 'skills/projects/northwind-mobile-app/northwind-component-library',
      name: 'northwind-component-library',
    },
  ];

  const projectSpecificSkills = await db
    .insert(schema.skills)
    .values(projectSkillData)
    .returning();

  console.log(`  Created ${projectSpecificSkills.length} project-specific skills`);

  // Link project-specific skills
  await db.insert(schema.projectSkills).values([
    { isCustomized: true, projectId: acmeApi.id, skillId: projectSpecificSkills[0].id },
    { isCustomized: false, projectId: northwindApp.id, skillId: projectSpecificSkills[1].id },
  ]);

  console.log(`  Created ${2} project-skill links`);
  console.log('Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
