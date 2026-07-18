CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"shop_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"items" jsonb NOT NULL,
	"total" double precision NOT NULL,
	"delivery_fee" double precision DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"mode" text NOT NULL,
	"address" text,
	"payment_method" text NOT NULL,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;