-- Migration: User-scoped tags
-- Each user can create their own custom tags.
-- Default tags (user_id IS NULL) are visible to all users.
-- Custom tags (user_id = <uuid>) are only visible to their owner.

-- Add user_id column (nullable — NULL means global/default tag)
ALTER TABLE tags ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Drop old global unique constraints
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_name_key;
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_slug_key;

-- Add composite unique constraints per user (handles user-owned tags)
-- Note: NULL user_id values are considered distinct by PostgreSQL,
-- so default tags uniqueness is enforced by the application (upsert logic).
CREATE UNIQUE INDEX IF NOT EXISTS tags_user_id_name_key ON tags (user_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS tags_user_id_slug_key ON tags (user_id, slug);

-- Partial unique indexes for default tags (user_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS tags_default_name_key ON tags (name) WHERE user_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tags_default_slug_key ON tags (slug) WHERE user_id IS NULL;

-- Index for filtering tags by user
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags (user_id);
