CREATE TABLE "bundle_agents" (
	"agent_id" uuid NOT NULL,
	"bundle_id" uuid NOT NULL,
	CONSTRAINT "bundle_agents_bundle_id_agent_id_pk" PRIMARY KEY("bundle_id","agent_id")
);
--> statement-breakpoint
CREATE TABLE "bundle_rules" (
	"bundle_id" uuid NOT NULL,
	"rule_id" uuid NOT NULL,
	CONSTRAINT "bundle_rules_bundle_id_rule_id_pk" PRIMARY KEY("bundle_id","rule_id")
);
--> statement-breakpoint
CREATE TABLE "bundle_skills" (
	"bundle_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "bundle_skills_bundle_id_skill_id_pk" PRIMARY KEY("bundle_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "bundles" (
	"description" varchar(500) NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"github_path" varchar(500) NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bundle_agents" ADD CONSTRAINT "bundle_agents_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_agents" ADD CONSTRAINT "bundle_agents_bundle_id_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_rules" ADD CONSTRAINT "bundle_rules_bundle_id_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_rules" ADD CONSTRAINT "bundle_rules_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_skills" ADD CONSTRAINT "bundle_skills_bundle_id_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_skills" ADD CONSTRAINT "bundle_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;