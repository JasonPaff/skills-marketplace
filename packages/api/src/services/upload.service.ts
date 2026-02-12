import type { CreateBatchUpload } from '@emergent/shared';

import { parseAgentMd, parseRuleMd, parseSkillMd } from '@emergent/shared';
import { HTTPException } from 'hono/http-exception';

import type { GitHubClient } from '../lib/github.js';
import type { AgentQueries, RuleQueries, SkillQueries } from '../queries/index.js';

export type UploadService = ReturnType<typeof createUploadService>;

export function createUploadService(
  skillQueries: SkillQueries,
  agentQueries: AgentQueries,
  ruleQueries: RuleQueries,
  github: GitHubClient,
) {
  return {
    async batchUpload(data: CreateBatchUpload) {
      const { agents = [], rules = [], skills = [] } = data;

      // ── Phase 1: Validate all items before any side effects ──────

      const validatedSkills = skills.map((skill, index) => {
        const skillMdFile = skill.files.find((f) => f.path === 'SKILL.md');
        if (!skillMdFile) {
          throw new HTTPException(400, {
            message: `Skill "${skill.name}" (index ${index}) is missing a SKILL.md file`,
          });
        }

        try {
          const decoded = Buffer.from(skillMdFile.content, 'base64').toString('utf-8');
          parseSkillMd(decoded);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Invalid SKILL.md';
          throw new HTTPException(400, {
            message: `Skill "${skill.name}" (index ${index}): ${message}`,
          });
        }

        const githubPath = `skills/global/${skill.name}`;
        return { ...skill, githubPath };
      });

      const validatedAgents = agents.map((agent, index) => {
        const mdFile = agent.files.find((f) => f.path.endsWith('.md'));
        if (!mdFile) {
          throw new HTTPException(400, {
            message: `Agent "${agent.name}" (index ${index}) is missing a .md file`,
          });
        }

        let frontmatter: ReturnType<typeof parseAgentMd>['frontmatter'];
        try {
          const decoded = Buffer.from(mdFile.content, 'base64').toString('utf-8');
          const parsed = parseAgentMd(decoded);
          frontmatter = parsed.frontmatter;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Invalid agent .md';
          throw new HTTPException(400, {
            message: `Agent "${agent.name}" (index ${index}): ${message}`,
          });
        }

        const githubPath = `agents/global/${agent.name}`;
        return { ...agent, frontmatter, githubPath };
      });

      const validatedRules = rules.map((rule, index) => {
        const mdFile = rule.files.find((f) => f.path.endsWith('.md'));
        if (!mdFile) {
          throw new HTTPException(400, {
            message: `Rule "${rule.name}" (index ${index}) is missing a .md file`,
          });
        }

        let frontmatter: ReturnType<typeof parseRuleMd>['frontmatter'];
        try {
          const decoded = Buffer.from(mdFile.content, 'base64').toString('utf-8');
          const parsed = parseRuleMd(decoded);
          frontmatter = parsed.frontmatter;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Invalid rule .md';
          throw new HTTPException(400, {
            message: `Rule "${rule.name}" (index ${index}): ${message}`,
          });
        }

        const githubPath = `rules/global/${rule.name}`;
        return { ...rule, frontmatter, githubPath };
      });

      // ── Phase 2: Collect all files for a single atomic GitHub commit ──

      const allFiles: Array<{ content: string; path: string }> = [];

      for (const skill of validatedSkills) {
        for (const file of skill.files) {
          allFiles.push({
            content: file.content,
            path: `${skill.githubPath}/${file.path}`,
          });
        }
      }

      for (const agent of validatedAgents) {
        for (const file of agent.files) {
          allFiles.push({
            content: file.content,
            path: `${agent.githubPath}/${file.path}`,
          });
        }
      }

      for (const rule of validatedRules) {
        for (const file of rule.files) {
          allFiles.push({
            content: file.content,
            path: `${rule.githubPath}/${file.path}`,
          });
        }
      }

      const itemNames = [
        ...validatedSkills.map((s) => s.name),
        ...validatedAgents.map((a) => a.name),
        ...validatedRules.map((r) => r.name),
      ];
      const commitMessage = `Batch upload: ${itemNames.join(', ')}`;

      await github.commitFiles(allFiles, commitMessage);

      // ── Phase 3: Insert database records sequentially ─────────────

      const insertedSkills = [];
      for (const skill of validatedSkills) {
        const record = await skillQueries.insertSkill({
          description: skill.description,
          githubPath: skill.githubPath,
          name: skill.name,
        });
        insertedSkills.push(record);
      }

      const insertedAgents = [];
      for (const agent of validatedAgents) {
        const record = await agentQueries.insertAgent({
          color: agent.frontmatter.color ?? undefined,
          description: agent.description,
          githubPath: agent.githubPath,
          model: agent.frontmatter.model ?? undefined,
          name: agent.name,
          tools: agent.frontmatter.tools,
        });
        insertedAgents.push(record);
      }

      const insertedRules = [];
      for (const rule of validatedRules) {
        const record = await ruleQueries.insertRule({
          description: rule.description,
          githubPath: rule.githubPath,
          name: rule.name,
          paths: rule.frontmatter.paths,
        });
        insertedRules.push(record);
      }

      return {
        agents: insertedAgents,
        rules: insertedRules,
        skills: insertedSkills,
      };
    },
  };
}
