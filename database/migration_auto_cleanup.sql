-- Migration: index buat mempercepat query auto-cleanup foto 24 jam
-- (lihat src/lib/cleanup.ts) yang filter/delete berdasarkan created_at.
USE clay_photobooth;

CREATE INDEX idx_photos_created_at ON photos (created_at);
