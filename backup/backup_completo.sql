


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."audit_trigger_func"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO audit_logs (org_id, table_name, operation, record_id, user_id, user_email, old_values, new_values, created_at)
  VALUES (
    COALESCE(NEW.org_id, OLD.org_id, '550e8400-e29b-41d4-a716-446655440000'),
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    (auth.jwt() ->> 'sub')::uuid,
    (auth.jwt() ->> 'email'),
    CASE WHEN TG_OP IN ('DELETE', 'UPDATE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    now()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_trigger_func"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "table_name" "text" NOT NULL,
    "operation" "text" NOT NULL,
    "record_id" "uuid",
    "user_id" "uuid",
    "user_email" "text",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "audit_logs_operation_check" CHECK (("operation" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" DEFAULT 'operator'::"text",
    "cpf" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "auth_users_role_check" CHECK (("role" = ANY (ARRAY['root'::"text", 'admin'::"text", 'operator'::"text", 'customer'::"text"])))
);


ALTER TABLE "public"."auth_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collections" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "order" integer DEFAULT 0
);


ALTER TABLE "public"."collections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."color_grades" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "order" integer DEFAULT 0
);


ALTER TABLE "public"."color_grades" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "customer_code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "cpf" bigint
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cut_shapes" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "order" integer DEFAULT 0
);


ALTER TABLE "public"."cut_shapes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finishes" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "order" integer DEFAULT 0
);


ALTER TABLE "public"."finishes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jewelry_certificates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "cert_code" "text" NOT NULL,
    "serial_number" "text" NOT NULL,
    "is_root" boolean DEFAULT false,
    "parent_cert_id" "uuid",
    "title" "text" NOT NULL,
    "collection" "text",
    "model" "text",
    "manufacturer" "text",
    "manufacturer_logo_url" "text",
    "manufacturing_date" "date",
    "issue_date" "date",
    "metal_purity" "text",
    "metal_color" "text",
    "gross_weight_grams" numeric(10,2),
    "width_cm" numeric(5,2),
    "finish" "text",
    "has_stones" boolean DEFAULT false,
    "stones" "jsonb",
    "warranty_months" integer,
    "warranty_terms" "text",
    "warranty_status" "text" DEFAULT 'Ativa'::"text",
    "authenticity_hash" "text" NOT NULL,
    "estimated_value_brl" numeric(15,2),
    "care_guide" "jsonb",
    "current_owner_name" "text",
    "owner_cpf" "text",
    "owner_email" "text",
    "owner_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "images" "text"[] DEFAULT '{}'::"text"[],
    CONSTRAINT "jewelry_certificates_warranty_status_check" CHECK (("warranty_status" = ANY (ARRAY['Ativa'::"text", 'Expirada'::"text", 'Em Manutenção'::"text", 'Vitalícia'::"text"])))
);


ALTER TABLE "public"."jewelry_certificates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maintenance_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cert_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "maintenance_date" "date" NOT NULL,
    "maintenance_type" "text",
    "performer" "text",
    "notes" "text",
    "verified_by_appraiser" "text",
    "customer_name" "text",
    "customer_cpf" "text",
    "customer_email" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."maintenance_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manufacturers" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "order" integer DEFAULT 0
);


ALTER TABLE "public"."manufacturers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."metal_colors" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "order" integer DEFAULT 0
);


ALTER TABLE "public"."metal_colors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."metal_purities" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "order" integer DEFAULT 0
);


ALTER TABLE "public"."metal_purities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid",
    "name" "text",
    "responsible_name" "text",
    "phone" "text",
    "email" "text",
    "internal_notes" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "display_name" character varying(18)
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."setting_types" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "order" integer DEFAULT 0
);


ALTER TABLE "public"."setting_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stone_types" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "order" integer DEFAULT 0
);


ALTER TABLE "public"."stone_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_orgs" (
    "user_id" "uuid" NOT NULL,
    "org_id" "text" DEFAULT 'default'::"text" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_orgs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_users"
    ADD CONSTRAINT "auth_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."auth_users"
    ADD CONSTRAINT "auth_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."color_grades"
    ADD CONSTRAINT "color_grades_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."color_grades"
    ADD CONSTRAINT "color_grades_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_cpf_unique" UNIQUE ("cpf");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_org_id_customer_code_key" UNIQUE ("org_id", "customer_code");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cut_shapes"
    ADD CONSTRAINT "cut_shapes_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."cut_shapes"
    ADD CONSTRAINT "cut_shapes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finishes"
    ADD CONSTRAINT "finishes_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."finishes"
    ADD CONSTRAINT "finishes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jewelry_certificates"
    ADD CONSTRAINT "jewelry_certificates_authenticity_hash_key" UNIQUE ("authenticity_hash");



ALTER TABLE ONLY "public"."jewelry_certificates"
    ADD CONSTRAINT "jewelry_certificates_org_id_cert_code_key" UNIQUE ("org_id", "cert_code");



ALTER TABLE ONLY "public"."jewelry_certificates"
    ADD CONSTRAINT "jewelry_certificates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maintenance_records"
    ADD CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manufacturers"
    ADD CONSTRAINT "manufacturers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."manufacturers"
    ADD CONSTRAINT "manufacturers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."metal_colors"
    ADD CONSTRAINT "metal_colors_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."metal_colors"
    ADD CONSTRAINT "metal_colors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."metal_purities"
    ADD CONSTRAINT "metal_purities_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."metal_purities"
    ADD CONSTRAINT "metal_purities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."setting_types"
    ADD CONSTRAINT "setting_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."setting_types"
    ADD CONSTRAINT "setting_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stone_types"
    ADD CONSTRAINT "stone_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."stone_types"
    ADD CONSTRAINT "stone_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_orgs"
    ADD CONSTRAINT "user_orgs_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_org_id" ON "public"."audit_logs" USING "btree" ("org_id");



CREATE INDEX "idx_audit_logs_table_name" ON "public"."audit_logs" USING "btree" ("table_name");



CREATE INDEX "idx_auth_users_email" ON "public"."auth_users" USING "btree" ("email");



CREATE INDEX "idx_auth_users_org_id" ON "public"."auth_users" USING "btree" ("org_id");



CREATE INDEX "idx_customers_org_id" ON "public"."customers" USING "btree" ("org_id");



CREATE INDEX "idx_jewelry_certs_authenticity" ON "public"."jewelry_certificates" USING "btree" ("authenticity_hash");



CREATE INDEX "idx_jewelry_certs_cert_code" ON "public"."jewelry_certificates" USING "btree" ("cert_code");



CREATE INDEX "idx_jewelry_certs_org_id" ON "public"."jewelry_certificates" USING "btree" ("org_id");



CREATE INDEX "idx_jewelry_certs_owner_id" ON "public"."jewelry_certificates" USING "btree" ("owner_id");



CREATE INDEX "idx_jewelry_certs_parent" ON "public"."jewelry_certificates" USING "btree" ("parent_cert_id");



CREATE INDEX "idx_jewelry_certs_serial" ON "public"."jewelry_certificates" USING "btree" ("serial_number");



CREATE INDEX "idx_maintenance_cert_id" ON "public"."maintenance_records" USING "btree" ("cert_id");



CREATE INDEX "idx_maintenance_date" ON "public"."maintenance_records" USING "btree" ("maintenance_date");



CREATE INDEX "idx_maintenance_org_id" ON "public"."maintenance_records" USING "btree" ("org_id");



CREATE INDEX "idx_user_orgs_org_id" ON "public"."user_orgs" USING "btree" ("org_id");



CREATE INDEX "idx_user_orgs_user_id" ON "public"."user_orgs" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "audit_auth_users_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."auth_users" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_func"();



CREATE OR REPLACE TRIGGER "audit_customers_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_func"();



CREATE OR REPLACE TRIGGER "audit_jewelry_certificates_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."jewelry_certificates" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_func"();



CREATE OR REPLACE TRIGGER "audit_maintenance_records_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."maintenance_records" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_func"();



CREATE OR REPLACE TRIGGER "audit_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_func"();



ALTER TABLE ONLY "public"."jewelry_certificates"
    ADD CONSTRAINT "jewelry_certificates_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."jewelry_certificates"
    ADD CONSTRAINT "jewelry_certificates_parent_cert_id_fkey" FOREIGN KEY ("parent_cert_id") REFERENCES "public"."jewelry_certificates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."maintenance_records"
    ADD CONSTRAINT "maintenance_records_cert_id_fkey" FOREIGN KEY ("cert_id") REFERENCES "public"."jewelry_certificates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_orgs"
    ADD CONSTRAINT "user_orgs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow public read" ON "public"."jewelry_certificates" FOR SELECT USING (true);



CREATE POLICY "Allow public read Customers" ON "public"."customers" FOR SELECT USING (true);



CREATE POLICY "Allow public read maintenance_records" ON "public"."maintenance_records" FOR SELECT USING (true);



CREATE POLICY "Users can view their own org mapping" ON "public"."user_orgs" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."auth_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "create_org_certs" ON "public"."jewelry_certificates" FOR INSERT WITH CHECK ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



CREATE POLICY "create_org_customers" ON "public"."customers" FOR INSERT WITH CHECK ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



CREATE POLICY "create_org_maintenance" ON "public"."maintenance_records" FOR INSERT WITH CHECK ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_org_certs" ON "public"."jewelry_certificates" FOR DELETE USING ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



CREATE POLICY "delete_org_customers" ON "public"."customers" FOR DELETE USING ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



CREATE POLICY "delete_org_maintenance" ON "public"."maintenance_records" FOR DELETE USING ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



ALTER TABLE "public"."jewelry_certificates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maintenance_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "manage_org_users" ON "public"."auth_users" USING (((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")) AND (("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['root'::"text", 'admin'::"text"])))) WITH CHECK (((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")) AND ((("auth"."jwt"() ->> 'role'::"text") = 'root'::"text") OR ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text") AND ("role" = ANY (ARRAY['customer'::"text", 'operator'::"text"]))))));



ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_view_certs" ON "public"."jewelry_certificates" FOR SELECT USING (true);



CREATE POLICY "update_org_certs" ON "public"."jewelry_certificates" FOR UPDATE USING ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text"))) WITH CHECK ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



CREATE POLICY "update_org_customers" ON "public"."customers" FOR UPDATE USING ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text"))) WITH CHECK ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



CREATE POLICY "update_org_maintenance" ON "public"."maintenance_records" FOR UPDATE USING ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text"))) WITH CHECK ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



CREATE POLICY "update_own_org" ON "public"."organizations" FOR UPDATE USING (((("id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")) AND (("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['root'::"text", 'admin'::"text"])))) WITH CHECK ((("id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



ALTER TABLE "public"."user_orgs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "view_org_audit_logs" ON "public"."audit_logs" FOR SELECT USING (("org_id" = (("auth"."jwt"() ->> 'org_id'::"text"))::"uuid"));



CREATE POLICY "view_org_certs" ON "public"."jewelry_certificates" FOR SELECT USING ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



CREATE POLICY "view_org_customers" ON "public"."customers" FOR SELECT USING ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



CREATE POLICY "view_org_maintenance" ON "public"."maintenance_records" FOR SELECT USING ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



CREATE POLICY "view_org_users" ON "public"."auth_users" FOR SELECT USING ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



CREATE POLICY "view_own_org" ON "public"."organizations" FOR SELECT USING ((("id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."audit_trigger_func"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_trigger_func"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_trigger_func"() TO "service_role";


















GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."auth_users" TO "anon";
GRANT ALL ON TABLE "public"."auth_users" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_users" TO "service_role";



GRANT ALL ON TABLE "public"."collections" TO "anon";
GRANT ALL ON TABLE "public"."collections" TO "authenticated";
GRANT ALL ON TABLE "public"."collections" TO "service_role";



GRANT ALL ON TABLE "public"."color_grades" TO "anon";
GRANT ALL ON TABLE "public"."color_grades" TO "authenticated";
GRANT ALL ON TABLE "public"."color_grades" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."cut_shapes" TO "anon";
GRANT ALL ON TABLE "public"."cut_shapes" TO "authenticated";
GRANT ALL ON TABLE "public"."cut_shapes" TO "service_role";



GRANT ALL ON TABLE "public"."finishes" TO "anon";
GRANT ALL ON TABLE "public"."finishes" TO "authenticated";
GRANT ALL ON TABLE "public"."finishes" TO "service_role";



GRANT ALL ON TABLE "public"."jewelry_certificates" TO "anon";
GRANT ALL ON TABLE "public"."jewelry_certificates" TO "authenticated";
GRANT ALL ON TABLE "public"."jewelry_certificates" TO "service_role";



GRANT ALL ON TABLE "public"."maintenance_records" TO "anon";
GRANT ALL ON TABLE "public"."maintenance_records" TO "authenticated";
GRANT ALL ON TABLE "public"."maintenance_records" TO "service_role";



GRANT ALL ON TABLE "public"."manufacturers" TO "anon";
GRANT ALL ON TABLE "public"."manufacturers" TO "authenticated";
GRANT ALL ON TABLE "public"."manufacturers" TO "service_role";



GRANT ALL ON TABLE "public"."metal_colors" TO "anon";
GRANT ALL ON TABLE "public"."metal_colors" TO "authenticated";
GRANT ALL ON TABLE "public"."metal_colors" TO "service_role";



GRANT ALL ON TABLE "public"."metal_purities" TO "anon";
GRANT ALL ON TABLE "public"."metal_purities" TO "authenticated";
GRANT ALL ON TABLE "public"."metal_purities" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."setting_types" TO "anon";
GRANT ALL ON TABLE "public"."setting_types" TO "authenticated";
GRANT ALL ON TABLE "public"."setting_types" TO "service_role";



GRANT ALL ON TABLE "public"."stone_types" TO "anon";
GRANT ALL ON TABLE "public"."stone_types" TO "authenticated";
GRANT ALL ON TABLE "public"."stone_types" TO "service_role";



GRANT ALL ON TABLE "public"."user_orgs" TO "anon";
GRANT ALL ON TABLE "public"."user_orgs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_orgs" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































