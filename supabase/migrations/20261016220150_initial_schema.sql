CREATE TYPE "public"."coach_tier" AS ENUM('premium', 'standard');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('beginner', 'improver', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."enrolment_status" AS ENUM('active', 'paused', 'ended');--> statement-breakpoint
CREATE TYPE "public"."library_category" AS ENUM('breath', 'onset', 'range', 'agility');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('audio', 'video');--> statement-breakpoint
CREATE TYPE "public"."media_status" AS ENUM('pending', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."media_store" AS ENUM('local', 'bunny_stream', 'bunny_storage');--> statement-breakpoint
CREATE TYPE "public"."notification_kind" AS ENUM('feedback_ready', 'new_submission', 'practice_reminder');--> statement-breakpoint
CREATE TYPE "public"."offer_billing" AS ENUM('monthly', 'single');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('processing', 'awaiting_review', 'reviewed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."voice_type" AS ENUM('soprano', 'mezzo', 'alto', 'tenor', 'baritone', 'bass');--> statement-breakpoint
CREATE TABLE "events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" uuid,
	"kind" text NOT NULL,
	"entity_id" uuid,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"entity_id" uuid,
	"period_start" date,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"provider_message_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrolment_id" uuid NOT NULL,
	"library_item_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"feedback_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"coach_id" uuid NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"reply_media_id" uuid,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_submission_id_key" UNIQUE("submission_id")
);
--> statement-breakpoint
ALTER TABLE "feedback" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "feedback_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feedback_id" uuid NOT NULL,
	"t_seconds" double precision NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_comments_t_seconds_nonnegative" CHECK ("feedback_comments"."t_seconds" >= 0),
	CONSTRAINT "feedback_comments_body_not_empty" CHECK ("feedback_comments"."body" <> '')
);
--> statement-breakpoint
ALTER TABLE "feedback_comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrolment_id" uuid NOT NULL,
	"assignment_id" uuid,
	"library_item_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "submission_status" DEFAULT 'processing' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "enrolments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"coach_id" uuid NOT NULL,
	"offer_id" uuid NOT NULL,
	"status" "enrolment_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enrolments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "coach_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"tier" "coach_tier" NOT NULL,
	"name" text NOT NULL,
	"billing" "offer_billing" NOT NULL,
	"price_pence" integer NOT NULL,
	"submissions_per_period" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coach_offers_price_pence_nonnegative" CHECK ("coach_offers"."price_pence" >= 0),
	CONSTRAINT "coach_offers_submissions_per_period_positive" CHECK ("coach_offers"."submissions_per_period" > 0)
);
--> statement-breakpoint
ALTER TABLE "coach_offers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "coaches" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"tier" "coach_tier" NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"avatar_src" text NOT NULL,
	"turnaround_hours" integer NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coaches_turnaround_hours_positive" CHECK ("coaches"."turnaround_hours" > 0)
);
--> statement-breakpoint
ALTER TABLE "coaches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "students" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"voice_type" "voice_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "collection_items" (
	"collection_id" uuid NOT NULL,
	"library_item_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_items_collection_id_library_item_id_pk" PRIMARY KEY("collection_id","library_item_id"),
	CONSTRAINT "collection_items_collection_id_position_key" UNIQUE("collection_id","position")
);
--> statement-breakpoint
ALTER TABLE "collection_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"owner_coach_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "library_item_tags" (
	"library_item_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_item_tags_library_item_id_tag_id_pk" PRIMARY KEY("library_item_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "library_item_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "library_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"category" "library_category" NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"voice_types" "voice_type"[] NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"demo_media_id" uuid NOT NULL,
	"backing_track_media_id" uuid,
	"owner_coach_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_items_voice_types_not_empty" CHECK (cardinality("library_items"."voice_types") > 0)
);
--> statement-breakpoint
ALTER TABLE "library_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_kind_slug_key" UNIQUE("kind","slug")
);
--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "media_kind" NOT NULL,
	"owner_user_id" uuid,
	"store" "media_store" NOT NULL,
	"store_key" text NOT NULL,
	"status" "media_status" DEFAULT 'pending' NOT NULL,
	"src" text,
	"hls_src" text,
	"peaks_src" text,
	"duration_sec" double precision,
	"original_file_name" text DEFAULT '' NOT NULL,
	"size_bytes" bigint,
	"mime_type" text,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_duration_sec_positive" CHECK ("media_assets"."duration_sec" > 0),
	CONSTRAINT "media_assets_ready_is_playable" CHECK ("media_assets"."status" <> 'ready' or ("media_assets"."src" is not null and "media_assets"."peaks_src" is not null and "media_assets"."duration_sec" is not null))
);
--> statement-breakpoint
ALTER TABLE "media_assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_enrolment_id_enrolments_id_fk" FOREIGN KEY ("enrolment_id") REFERENCES "public"."enrolments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_library_item_id_library_items_id_fk" FOREIGN KEY ("library_item_id") REFERENCES "public"."library_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_feedback_id_feedback_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedback"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_coach_id_coaches_user_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_reply_media_id_media_assets_id_fk" FOREIGN KEY ("reply_media_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_comments" ADD CONSTRAINT "feedback_comments_feedback_id_feedback_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedback"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_enrolment_id_enrolments_id_fk" FOREIGN KEY ("enrolment_id") REFERENCES "public"."enrolments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_library_item_id_library_items_id_fk" FOREIGN KEY ("library_item_id") REFERENCES "public"."library_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrolments" ADD CONSTRAINT "enrolments_student_id_students_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrolments" ADD CONSTRAINT "enrolments_coach_id_coaches_user_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrolments" ADD CONSTRAINT "enrolments_offer_id_coach_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."coach_offers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_offers" ADD CONSTRAINT "coach_offers_coach_id_coaches_user_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_library_item_id_library_items_id_fk" FOREIGN KEY ("library_item_id") REFERENCES "public"."library_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_owner_coach_id_coaches_user_id_fk" FOREIGN KEY ("owner_coach_id") REFERENCES "public"."coaches"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_item_tags" ADD CONSTRAINT "library_item_tags_library_item_id_library_items_id_fk" FOREIGN KEY ("library_item_id") REFERENCES "public"."library_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_item_tags" ADD CONSTRAINT "library_item_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_demo_media_id_media_assets_id_fk" FOREIGN KEY ("demo_media_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_backing_track_media_id_media_assets_id_fk" FOREIGN KEY ("backing_track_media_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_owner_coach_id_coaches_user_id_fk" FOREIGN KEY ("owner_coach_id") REFERENCES "public"."coaches"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_user_id_profiles_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_kind_at_idx" ON "events" USING btree ("kind","at");--> statement-breakpoint
CREATE INDEX "events_user_id_at_idx" ON "events" USING btree ("user_id","at");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_once_per_entity" ON "notifications" USING btree ("kind","entity_id") WHERE entity_id is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_once_per_period" ON "notifications" USING btree ("kind","user_id","period_start") WHERE period_start is not null;--> statement-breakpoint
CREATE INDEX "assignments_enrolment_id_idx" ON "assignments" USING btree ("enrolment_id");--> statement-breakpoint
CREATE INDEX "assignments_library_item_id_idx" ON "assignments" USING btree ("library_item_id");--> statement-breakpoint
CREATE INDEX "assignments_feedback_id_idx" ON "assignments" USING btree ("feedback_id");--> statement-breakpoint
CREATE INDEX "feedback_coach_id_idx" ON "feedback" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "feedback_reply_media_id_idx" ON "feedback" USING btree ("reply_media_id");--> statement-breakpoint
CREATE INDEX "feedback_comments_feedback_id_idx" ON "feedback_comments" USING btree ("feedback_id");--> statement-breakpoint
CREATE INDEX "submissions_enrolment_id_idx" ON "submissions" USING btree ("enrolment_id");--> statement-breakpoint
CREATE INDEX "submissions_assignment_id_idx" ON "submissions" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "submissions_library_item_id_idx" ON "submissions" USING btree ("library_item_id");--> statement-breakpoint
CREATE INDEX "submissions_media_id_idx" ON "submissions" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "enrolments_student_id_idx" ON "enrolments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "enrolments_coach_id_idx" ON "enrolments" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "enrolments_offer_id_idx" ON "enrolments" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX "enrolments_status_idx" ON "enrolments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "enrolments_one_active_per_student" ON "enrolments" USING btree ("student_id") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "coach_offers_coach_id_idx" ON "coach_offers" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "coach_offers_active_idx" ON "coach_offers" USING btree ("active");--> statement-breakpoint
CREATE INDEX "coaches_active_idx" ON "coaches" USING btree ("active");--> statement-breakpoint
CREATE INDEX "collection_items_library_item_id_idx" ON "collection_items" USING btree ("library_item_id");--> statement-breakpoint
CREATE INDEX "collections_owner_coach_id_idx" ON "collections" USING btree ("owner_coach_id");--> statement-breakpoint
CREATE INDEX "collections_active_idx" ON "collections" USING btree ("active");--> statement-breakpoint
CREATE INDEX "library_item_tags_tag_id_idx" ON "library_item_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "library_items_demo_media_id_idx" ON "library_items" USING btree ("demo_media_id");--> statement-breakpoint
CREATE INDEX "library_items_backing_track_media_id_idx" ON "library_items" USING btree ("backing_track_media_id");--> statement-breakpoint
CREATE INDEX "library_items_owner_coach_id_idx" ON "library_items" USING btree ("owner_coach_id");--> statement-breakpoint
CREATE INDEX "library_items_active_idx" ON "library_items" USING btree ("active");--> statement-breakpoint
CREATE INDEX "media_assets_owner_user_id_idx" ON "media_assets" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "media_assets_status_idx" ON "media_assets" USING btree ("status");--> statement-breakpoint
CREATE POLICY "events_insert_own" ON "events" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("events"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "assignments_insert_as_coach" ON "assignments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1 from "enrolments"
    where "enrolments"."id" = "assignments"."enrolment_id" and "enrolments"."coach_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "assignments_select_as_coach" ON "assignments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
    select 1 from "enrolments"
    where "enrolments"."id" = "assignments"."enrolment_id" and "enrolments"."coach_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "assignments_select_as_student" ON "assignments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
    select 1 from "enrolments"
    where "enrolments"."id" = "assignments"."enrolment_id" and "enrolments"."student_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "feedback_insert_as_coach" ON "feedback" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (("feedback"."coach_id" = (select auth.uid()) and exists (
    select 1 from "submissions"
    inner join "enrolments" on "enrolments"."id" = "submissions"."enrolment_id"
    where "submissions"."id" = "feedback"."submission_id" and "enrolments"."coach_id" = (select auth.uid())
  )));--> statement-breakpoint
CREATE POLICY "feedback_select_as_coach" ON "feedback" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
    select 1 from "submissions"
    inner join "enrolments" on "enrolments"."id" = "submissions"."enrolment_id"
    where "submissions"."id" = "feedback"."submission_id" and "enrolments"."coach_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "feedback_select_as_student" ON "feedback" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
    select 1 from "submissions"
    inner join "enrolments" on "enrolments"."id" = "submissions"."enrolment_id"
    where "submissions"."id" = "feedback"."submission_id" and "enrolments"."student_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "feedback_comments_select" ON "feedback_comments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from "feedback" where "feedback"."id" = "feedback_comments"."feedback_id"));--> statement-breakpoint
CREATE POLICY "feedback_comments_insert_as_coach" ON "feedback_comments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
        select 1 from "feedback"
        where "feedback"."id" = "feedback_comments"."feedback_id" and "feedback"."coach_id" = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "submissions_select_as_student" ON "submissions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
    select 1 from "enrolments"
    where "enrolments"."id" = "submissions"."enrolment_id" and "enrolments"."student_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "submissions_insert_as_student" ON "submissions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1 from "enrolments"
    where "enrolments"."id" = "submissions"."enrolment_id" and "enrolments"."student_id" = (select auth.uid()) and "enrolments"."status" = 'active'
  ));--> statement-breakpoint
CREATE POLICY "submissions_select_as_coach" ON "submissions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
    select 1 from "enrolments"
    where "enrolments"."id" = "submissions"."enrolment_id" and "enrolments"."coach_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "submissions_update_as_coach" ON "submissions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1 from "enrolments"
    where "enrolments"."id" = "submissions"."enrolment_id" and "enrolments"."coach_id" = (select auth.uid())
  )) WITH CHECK (exists (
    select 1 from "enrolments"
    where "enrolments"."id" = "submissions"."enrolment_id" and "enrolments"."coach_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "enrolments_select_as_student" ON "enrolments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("enrolments"."student_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "enrolments_select_as_coach" ON "enrolments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("enrolments"."coach_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "coach_offers_select_active" ON "coach_offers" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("coach_offers"."active");--> statement-breakpoint
CREATE POLICY "coach_offers_select_own" ON "coach_offers" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("coach_offers"."coach_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "coach_offers_update_own" ON "coach_offers" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("coach_offers"."coach_id" = (select auth.uid())) WITH CHECK ("coach_offers"."coach_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "coaches_select_active" ON "coaches" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("coaches"."active");--> statement-breakpoint
CREATE POLICY "coaches_select_own" ON "coaches" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("coaches"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "coaches_update_own" ON "coaches" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("coaches"."user_id" = (select auth.uid())) WITH CHECK ("coaches"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "profiles_select_own" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("profiles"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "profiles_update_own" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("profiles"."id" = (select auth.uid())) WITH CHECK ("profiles"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "profiles_select_active_coach" ON "profiles" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (
        select 1 from "coaches" where "coaches"."user_id" = "profiles"."id" and "coaches"."active"
      ));--> statement-breakpoint
CREATE POLICY "profiles_select_enrolment_counterpart" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((exists (
    select 1 from "enrolments"
    where "enrolments"."coach_id" = "profiles"."id" and "enrolments"."student_id" = (select auth.uid())
  ) or exists (
    select 1 from "enrolments"
    where "enrolments"."student_id" = "profiles"."id" and "enrolments"."coach_id" = (select auth.uid())
  )));--> statement-breakpoint
CREATE POLICY "students_select_own" ON "students" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("students"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "students_update_own" ON "students" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("students"."user_id" = (select auth.uid())) WITH CHECK ("students"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "students_select_by_coach" ON "students" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
    select 1 from "enrolments"
    where "enrolments"."student_id" = "students"."user_id" and "enrolments"."coach_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "collection_items_select" ON "collection_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "collections_select_active" ON "collections" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("collections"."active");--> statement-breakpoint
CREATE POLICY "library_item_tags_select" ON "library_item_tags" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "library_items_select_active" ON "library_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("library_items"."active");--> statement-breakpoint
CREATE POLICY "tags_select" ON "tags" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "media_assets_select_own" ON "media_assets" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("media_assets"."owner_user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "media_assets_select_library" ON "media_assets" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from "library_items"
        where "library_items"."active"
          and ("library_items"."demo_media_id" = "media_assets"."id" or "library_items"."backing_track_media_id" = "media_assets"."id")
      ));--> statement-breakpoint
CREATE POLICY "media_assets_select_submission" ON "media_assets" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from "submissions" where "submissions"."media_id" = "media_assets"."id"));--> statement-breakpoint
CREATE POLICY "media_assets_select_feedback_reply" ON "media_assets" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from "feedback" where "feedback"."reply_media_id" = "media_assets"."id"));--> statement-breakpoint
CREATE POLICY "media_assets_insert_own_pending" ON "media_assets" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("media_assets"."owner_user_id" = (select auth.uid()) and "media_assets"."status" = 'pending');