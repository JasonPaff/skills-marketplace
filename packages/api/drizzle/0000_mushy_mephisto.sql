CREATE TABLE "agents" (
	"color" varchar(50),
	"description" varchar(500) NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"github_path" varchar(500) NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model" varchar(100),
	"name" varchar(100) NOT NULL,
	"tools" text[],
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rules" (
	"description" varchar(500) NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"github_path" varchar(500) NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"paths" text[],
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"description" varchar(500) NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"github_path" varchar(500) NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" varchar(20) DEFAULT '1.0.0' NOT NULL
);
