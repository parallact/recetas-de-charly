-- Migration: Total time computed column
-- Replaces separate prep_time / cook_time filters in search.
-- total_time = COALESCE(prep_time, 0) + COALESCE(cooking_time, 0)
-- NULLs treated as 0 so recipes without times still appear in filters.

ALTER TABLE "public"."recipes"
ADD COLUMN IF NOT EXISTS "total_time" integer
GENERATED ALWAYS AS (COALESCE("prep_time", 0) + COALESCE("cooking_time", 0)) STORED;

CREATE INDEX IF NOT EXISTS "idx_recipes_total_time" ON "public"."recipes" ("total_time");
