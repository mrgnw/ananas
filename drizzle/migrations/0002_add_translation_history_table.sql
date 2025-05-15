-- Migration script to add translation_history table

CREATE TABLE IF NOT EXISTS "translation_history" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text REFERENCES "users"("id") ON DELETE CASCADE,
  "input_text" text NOT NULL,
  "output_json" text NOT NULL,
  "source_lang" text NOT NULL,
  "target_langs" text NOT NULL,
  "created_at" integer NOT NULL
);