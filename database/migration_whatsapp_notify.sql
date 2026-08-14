-- Run this ONLY if your `photos` table already exists from a previous
-- version (i.e. before the WhatsApp hand-off + admin notification
-- feature). Fresh installs don't need this — `schema.sql` already
-- includes these columns.

USE clay_photobooth;

ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(30) NULL AFTER image_result,
  ADD COLUMN IF NOT EXISTS notified TINYINT(1) NOT NULL DEFAULT 0 AFTER status;

-- Mark everything that already exists as "seen" so the admin
-- notification bell only lights up for genuinely new sessions going
-- forward.
UPDATE photos SET notified = 1 WHERE notified = 0;
