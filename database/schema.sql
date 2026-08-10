-- Clay Photobooth Database Schema
CREATE DATABASE IF NOT EXISTS clay_photobooth
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE clay_photobooth;

CREATE TABLE IF NOT EXISTS frames (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  thumbnail VARCHAR(500) NOT NULL,
  frame_png VARCHAR(500) NOT NULL,
  slot TINYINT UNSIGNED NOT NULL DEFAULT 4,
  slot_layout TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS photos (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  frame_id VARCHAR(36) NOT NULL,
  image_result VARCHAR(500) NOT NULL,
  whatsapp_number VARCHAR(30) NULL,
  status ENUM('pending', 'printed') NOT NULL DEFAULT 'pending',
  notified TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_photos_frame
    FOREIGN KEY (frame_id) REFERENCES frames(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_photos_status ON photos (status);
CREATE INDEX idx_photos_frame_id ON photos (frame_id);
