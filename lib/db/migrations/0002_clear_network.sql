ALTER TABLE "shops" ADD COLUMN "owner_phone" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "owner_name" text;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_owner_phone_unique" UNIQUE("owner_phone");