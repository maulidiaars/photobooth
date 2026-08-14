-- Run this ONLY if your `frames` table already exists from a previous version
-- (i.e. `npm run db:init` was run before the auto-slot-detection feature).
-- Fresh installs don't need this — `schema.sql` already includes the column.

USE clay_photobooth;

ALTER TABLE frames
  ADD COLUMN IF NOT EXISTS slot_layout TEXT NOT NULL DEFAULT '[]' AFTER slot;

-- Old frames created before this feature have no detected layout.
-- Easiest fix: delete them and re-upload via Kelola Frame so the
-- new auto-detection runs, or manually update `slot_layout` yourself
-- with a JSON array like: [{"x":0.08,"y":0.06,"w":0.84,"h":0.4}, ...]
