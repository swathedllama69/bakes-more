
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" bigint NOT NULL,
    "full_name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "address" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."customers" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."customers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."filling_ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "filling_id" "uuid",
    "ingredient_id" "uuid",
    "amount_grams_ml" numeric NOT NULL
);


CREATE TABLE IF NOT EXISTS "public"."fillings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


CREATE TABLE IF NOT EXISTS "public"."ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "unit" "text" NOT NULL,
    "purchase_price" numeric NOT NULL,
    "purchase_quantity" numeric NOT NULL,
    "current_stock" numeric DEFAULT 0,
    "min_stock_level" numeric DEFAULT 500,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "image_url" "text"
);


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "recipe_id" "uuid",
    "filling_id" "uuid",
    "size_inches" integer NOT NULL,
    "layers" integer DEFAULT 1,
    "quantity" integer DEFAULT 1,
    "custom_extras" "jsonb" DEFAULT '[]'::"jsonb",
    "item_price" numeric NOT NULL,
    "item_cost" numeric,
    "created_at" timestamp with time zone DEFAULT "now"()
);


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_name" "text" NOT NULL,
    "customer_phone" "text",
    "delivery_date" timestamp with time zone,
    "status" "text" DEFAULT 'Pending'::"text",
    "payment_status" "text" DEFAULT 'Unpaid'::"text",
    "total_price" numeric DEFAULT 0,
    "total_cost" numeric DEFAULT 0,
    "profit" numeric DEFAULT 0,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "amount_paid" numeric DEFAULT 0,
    "discount" numeric DEFAULT 0,
    "tip" numeric DEFAULT 0,
    "vat" numeric DEFAULT 0,
    "vat_type" "text" DEFAULT 'none'::"text",
    "production_snapshot" "jsonb",
    "customer_id" bigint,
    "source" "text" DEFAULT 'Website'::"text",
    "customer_notes" "text",
    "payment_receipt_url" "text",
    "customer_email" "text",
    "unique_token" "uuid" DEFAULT "gen_random_uuid"(),
    CONSTRAINT "orders_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['Unpaid'::"text", 'Deposit'::"text", 'Paid'::"text"]))),
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['Pending'::"text", 'Baking'::"text", 'Ready'::"text", 'Delivered'::"text", 'Cancelled'::"text"])))
);


CREATE TABLE IF NOT EXISTS "public"."recipe_ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid",
    "ingredient_id" "uuid",
    "amount_grams_ml" numeric NOT NULL,
    "display_amount_cups" "text"
);


CREATE TABLE IF NOT EXISTS "public"."recipes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "base_markup_price" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "baking_duration_minutes" numeric DEFAULT 45,
    "instructions" "text" DEFAULT ''::"text",
    "category" "text" DEFAULT 'Cake'::"text",
    "yield_amount" numeric DEFAULT 1,
    "yield_unit" "text" DEFAULT 'Unit'::"text",
    "base_size_inches" numeric,
    "base_cost" numeric DEFAULT 0,
    "selling_price" numeric DEFAULT 0
);


CREATE TABLE IF NOT EXISTS "public"."settings" (
    "id" bigint NOT NULL,
    "company_name" "text" DEFAULT 'Bakes & More'::"text",
    "company_address" "text" DEFAULT ''::"text",
    "company_phone" "text" DEFAULT ''::"text",
    "vat_rate" numeric DEFAULT 7.5,
    "currency_symbol" "text" DEFAULT 'Γéª'::"text",
    "low_stock_threshold" integer DEFAULT 1000,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "gas_rate_per_minute" numeric DEFAULT 50,
    "electricity_rate_per_minute" numeric DEFAULT 30
);


ALTER TABLE "public"."settings" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."settings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."filling_ingredients"
    ADD CONSTRAINT "filling_ingredients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fillings"
    ADD CONSTRAINT "fillings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipe_ingredients"
    ADD CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."filling_ingredients"
    ADD CONSTRAINT "filling_ingredients_filling_id_fkey" FOREIGN KEY ("filling_id") REFERENCES "public"."fillings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."filling_ingredients"
    ADD CONSTRAINT "filling_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_filling_id_fkey" FOREIGN KEY ("filling_id") REFERENCES "public"."fillings"("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."recipe_ingredients"
    ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipe_ingredients"
    ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;



CREATE POLICY "Allow all for local dev" ON "public"."ingredients" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all for local dev" ON "public"."recipe_ingredients" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all for local dev" ON "public"."recipes" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access for all users" ON "public"."customers" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access for all users" ON "public"."settings" USING (true) WITH CHECK (true);



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ingredients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recipe_ingredients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recipes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "postgres";
GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."customers_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."customers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."customers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."customers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."filling_ingredients" TO "postgres";
GRANT ALL ON TABLE "public"."filling_ingredients" TO "anon";
GRANT ALL ON TABLE "public"."filling_ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."filling_ingredients" TO "service_role";



GRANT ALL ON TABLE "public"."fillings" TO "postgres";
GRANT ALL ON TABLE "public"."fillings" TO "anon";
GRANT ALL ON TABLE "public"."fillings" TO "authenticated";
GRANT ALL ON TABLE "public"."fillings" TO "service_role";



GRANT ALL ON TABLE "public"."ingredients" TO "postgres";
GRANT ALL ON TABLE "public"."ingredients" TO "anon";
GRANT ALL ON TABLE "public"."ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."ingredients" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "postgres";
GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "postgres";
GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."recipe_ingredients" TO "postgres";
GRANT ALL ON TABLE "public"."recipe_ingredients" TO "anon";
GRANT ALL ON TABLE "public"."recipe_ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_ingredients" TO "service_role";



GRANT ALL ON TABLE "public"."recipes" TO "postgres";
GRANT ALL ON TABLE "public"."recipes" TO "anon";
GRANT ALL ON TABLE "public"."recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."recipes" TO "service_role";



GRANT ALL ON TABLE "public"."settings" TO "postgres";
GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."settings_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."settings_id_seq" TO "service_role";
