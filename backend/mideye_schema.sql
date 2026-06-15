-- ============================================================
--  Mideye Travel Agency – MySQL Database Schema
--  Run this in phpMyAdmin or MySQL CLI before starting server
-- ============================================================

-- 1. Create & select database
CREATE DATABASE IF NOT EXISTS mideye_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mideye_db;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  phone       VARCHAR(20)   DEFAULT NULL,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('user','admin') NOT NULL DEFAULT 'user',
  profile_image VARCHAR(500) DEFAULT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT           DEFAULT NULL,
  trip_type        ENUM('oneway','roundtrip') NOT NULL DEFAULT 'oneway',
  passenger_name   VARCHAR(150)  NOT NULL,
  phone            VARCHAR(20)   NOT NULL,
  email            VARCHAR(150)  NOT NULL,
  origin           VARCHAR(10)   NOT NULL,
  destination      VARCHAR(10)   NOT NULL,
  travel_date      DATE          NOT NULL,
  return_date      DATE          DEFAULT NULL,
  adults           TINYINT       NOT NULL DEFAULT 1,
  children         TINYINT       NOT NULL DEFAULT 0,
  infants          TINYINT       NOT NULL DEFAULT 0,
  cabin_class      ENUM('economy','business') NOT NULL DEFAULT 'economy',
  seat_preference  VARCHAR(50)   DEFAULT NULL,
  special_requests TEXT          DEFAULT NULL,
  status           ENUM('Pending','Confirmed','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: cargo
-- ============================================================
CREATE TABLE IF NOT EXISTS cargo (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  tracking_id        VARCHAR(20)   NOT NULL UNIQUE,
  user_id            INT           DEFAULT NULL,
  sender_name        VARCHAR(150)  NOT NULL,
  sender_phone       VARCHAR(20)   NOT NULL,
  sender_email       VARCHAR(150)  DEFAULT NULL,
  sender_address     VARCHAR(255)  DEFAULT NULL,
  recipient_name     VARCHAR(150)  NOT NULL,
  recipient_phone    VARCHAR(20)   NOT NULL,
  origin             VARCHAR(50)   NOT NULL DEFAULT 'Galkacyo (GLK)',
  destination        VARCHAR(10)   NOT NULL,
  cargo_type         VARCHAR(50)   NOT NULL,
  pieces             INT           NOT NULL DEFAULT 1,
  weight             DECIMAL(8,2)  NOT NULL,
  length_cm          DECIMAL(8,2)  DEFAULT NULL,
  width_cm           DECIMAL(8,2)  DEFAULT NULL,
  description        TEXT          DEFAULT NULL,
  shipping_speed     ENUM('standard','express') NOT NULL DEFAULT 'standard',
  insurance          TINYINT(1)    NOT NULL DEFAULT 0,
  fragile            TINYINT(1)    NOT NULL DEFAULT 0,
  signature_required TINYINT(1)    NOT NULL DEFAULT 0,
  special_requests   TEXT          DEFAULT NULL,
  status             ENUM('Received','In Transit','Arrived','Cancelled') NOT NULL DEFAULT 'Received',
  created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- DEFAULT ADMIN ACCOUNT
-- Password: admin123  (bcrypt hash — change after first login!)
-- ============================================================
INSERT IGNORE INTO users (full_name, email, phone, password, role)
VALUES (
  'Mideye Admin',
  'admin@mideye.so',
  '+252 615 000000',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsCob7JK7FHrB3UTbj2QL8szDcCi',
  'admin'
);
