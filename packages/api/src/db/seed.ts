import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("Seeding database...");

  // Clear existing data (order matters for FK constraints)
  await db.delete(schema.projectSkills);
  await db.delete(schema.skills);
  await db.delete(schema.projects);
  await db.delete(schema.clients);

  // Create clients
  const [acme] = await db
    .insert(schema.clients)
    .values({ name: "Acme Corp", description: "Large enterprise client" })
    .returning();

  const [northwind] = await db
    .insert(schema.clients)
    .values({ name: "Northwind Traders", description: "Mid-market retail client" })
    .returning();

  console.log(`  Created ${2} clients`);

  // Create projects
  const [acmeWeb] = await db
    .insert(schema.projects)
    .values({ clientId: acme.id, name: "Acme Web Portal", description: "Customer-facing web application" })
    .returning();

  const [acmeApi] = await db
    .insert(schema.projects)
    .values({ clientId: acme.id, name: "Acme API Platform", description: "Internal API microservices" })
    .returning();

  const [northwindApp] = await db
    .insert(schema.projects)
    .values({ clientId: northwind.id, name: "Northwind Mobile App", description: "React Native mobile application" })
    .returning();

  console.log(`  Created ${3} projects`);

  // Create global skills
  const globalSkills = await db
    .insert(schema.skills)
    .values([
      {
        name: "react-component-patterns",
        description: "Best practices for React component architecture including compound components, render props, and hooks patterns.",
        category: "react",
        githubPath: "skills/global/react-component-patterns",
        uploadedBy: "jason.paff@emergent.com",
        isGlobal: true,
      },
      {
        name: "dotnet-api-scaffolding",
        description: "Generate .NET Web API controllers, services, and DTOs following Emergent coding standards.",
        category: "dotnet",
        githubPath: "skills/global/dotnet-api-scaffolding",
        uploadedBy: "sarah.chen@emergent.com",
        isGlobal: true,
        downloadCount: 12,
        totalRating: 20,
        ratingCount: 5,
        averageRating: "4.00",
      },
      {
        name: "sql-query-optimizer",
        description: "Analyze and optimize SQL queries for performance, suggesting index improvements and query rewrites.",
        category: "sql",
        githubPath: "skills/global/sql-query-optimizer",
        uploadedBy: "mike.johnson@emergent.com",
        isGlobal: true,
        downloadCount: 8,
        totalRating: 14,
        ratingCount: 3,
        averageRating: "4.67",
      },
      {
        name: "typescript-strict-mode",
        description: "Enforce strict TypeScript patterns including proper null checks, exhaustive switch statements, and branded types.",
        category: "typescript",
        githubPath: "skills/global/typescript-strict-mode",
        uploadedBy: "jason.paff@emergent.com",
        isGlobal: true,
        downloadCount: 25,
        totalRating: 45,
        ratingCount: 10,
        averageRating: "4.50",
      },
      {
        name: "unit-test-generator",
        description: "Generate comprehensive unit tests with arrange-act-assert pattern, mocking strategies, and edge case coverage.",
        category: "testing",
        githubPath: "skills/global/unit-test-generator",
        uploadedBy: "sarah.chen@emergent.com",
        isGlobal: true,
        downloadCount: 18,
        totalRating: 30,
        ratingCount: 7,
        averageRating: "4.29",
      },
      {
        name: "docker-compose-setup",
        description: "Create Docker Compose configurations for local development with database, cache, and service dependencies.",
        category: "devops",
        githubPath: "skills/global/docker-compose-setup",
        uploadedBy: "mike.johnson@emergent.com",
        isGlobal: true,
        downloadCount: 6,
        totalRating: 9,
        ratingCount: 2,
        averageRating: "4.50",
      },
      {
        name: "security-audit-checklist",
        description: "Run through OWASP Top 10 security checks on code, identifying vulnerabilities and suggesting mitigations.",
        category: "security",
        githubPath: "skills/global/security-audit-checklist",
        uploadedBy: "jason.paff@emergent.com",
        isGlobal: true,
        downloadCount: 3,
        totalRating: 5,
        ratingCount: 1,
        averageRating: "5.00",
      },
      {
        name: "react-native-navigation",
        description: "Set up and configure React Navigation with typed routes, deep linking, and authentication flows.",
        category: "react-native",
        githubPath: "skills/global/react-native-navigation",
        uploadedBy: "sarah.chen@emergent.com",
        isGlobal: true,
        downloadCount: 4,
        totalRating: 7,
        ratingCount: 2,
        averageRating: "3.50",
      },
    ])
    .returning();

  console.log(`  Created ${globalSkills.length} global skills`);

  // Create project-specific skills
  const projectSpecificSkills = await db
    .insert(schema.skills)
    .values([
      {
        name: "acme-api-conventions",
        description: "Acme-specific API naming conventions, error response formats, and pagination patterns.",
        category: "dotnet",
        githubPath: "skills/projects/acme-api-platform/acme-api-conventions",
        uploadedBy: "jason.paff@emergent.com",
        isGlobal: false,
        parentSkillId: globalSkills.find((s) => s.name === "dotnet-api-scaffolding")!.id,
      },
      {
        name: "northwind-component-library",
        description: "Northwind brand-specific React Native components with their design system tokens and accessibility requirements.",
        category: "react-native",
        githubPath: "skills/projects/northwind-mobile-app/northwind-component-library",
        uploadedBy: "sarah.chen@emergent.com",
        isGlobal: false,
      },
    ])
    .returning();

  console.log(`  Created ${projectSpecificSkills.length} project-specific skills`);

  // Link project-specific skills
  await db.insert(schema.projectSkills).values([
    { projectId: acmeApi.id, skillId: projectSpecificSkills[0].id, isCustomized: true },
    { projectId: northwindApp.id, skillId: projectSpecificSkills[1].id, isCustomized: false },
  ]);

  console.log(`  Created ${2} project-skill links`);
  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
