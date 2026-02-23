import type { CreateBatchUpload } from '@emergent/shared';

import type { GitHubClient } from '../lib/github.js';
import type { AgentService } from './agent.service.js';
import type { BundleService } from './bundle.service.js';
import type { RuleService } from './rule.service.js';
import type { SkillService } from './skill.service.js';

export type UploadService = ReturnType<typeof createUploadService>;

export function createUploadService(
  skillService: SkillService,
  agentService: AgentService,
  ruleService: RuleService,
  github: GitHubClient,
  bundleService: BundleService,
) {
  return {
    async batchUpload(data: CreateBatchUpload) {
      const { agents = [], rules = [], skills = [] } = data;

      // ── Phase 1: Validate all items before any side effects ──────

      const validatedSkills = skills.map((skill, index) => {
        try {
          return skillService.validateSkill(skill);
        } catch (err) {
          if (err instanceof Error && 'status' in err) throw err;
          const message = err instanceof Error ? err.message : 'Validation failed';
          throw new Error(`Skill "${skill.name}" (index ${index}): ${message}`);
        }
      });

      const validatedAgents = agents.map((agent, index) => {
        try {
          return agentService.validateAgent(agent);
        } catch (err) {
          if (err instanceof Error && 'status' in err) throw err;
          const message = err instanceof Error ? err.message : 'Validation failed';
          throw new Error(`Agent "${agent.name}" (index ${index}): ${message}`);
        }
      });

      const validatedRules = rules.map((rule, index) => {
        try {
          return ruleService.validateRule(rule);
        } catch (err) {
          if (err instanceof Error && 'status' in err) throw err;
          const message = err instanceof Error ? err.message : 'Validation failed';
          throw new Error(`Rule "${rule.name}" (index ${index}): ${message}`);
        }
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
        const record = await skillService.insertSkillRecord({
          description: skill.description,
          githubPath: skill.githubPath,
          name: skill.name,
        });
        insertedSkills.push(record);
      }

      const insertedAgents = [];
      for (const agent of validatedAgents) {
        const record = await agentService.insertAgentRecord({
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
        const record = await ruleService.insertRuleRecord({
          description: rule.description,
          githubPath: rule.githubPath,
          name: rule.name,
          paths: rule.frontmatter.paths,
        });
        insertedRules.push(record);
      }

      // ── Phase 4: Auto-create bundle for multi-item uploads ─────────

      const totalInserted = insertedSkills.length + insertedAgents.length + insertedRules.length;

      let bundle = null;
      if (totalInserted > 1) {
        const nameParts = [
          ...insertedSkills.map((s) => s.name),
          ...insertedAgents.map((a) => a.name),
          ...insertedRules.map((r) => r.name),
        ];
        const bundleName =
          nameParts.length <= 3 ? nameParts.join(', ') : `batch-${Date.now()}`;

        bundle = await bundleService.createBundleWithLinks({
          agentIds: insertedAgents.map((a) => a.id),
          description: `Batch upload containing ${totalInserted} items: ${nameParts.join(', ')}`,
          name: bundleName,
          ruleIds: insertedRules.map((r) => r.id),
          skillIds: insertedSkills.map((s) => s.id),
        });
      }

      return {
        agents: insertedAgents,
        bundle,
        rules: insertedRules,
        skills: insertedSkills,
      };
    },
  };
}
