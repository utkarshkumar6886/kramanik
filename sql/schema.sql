-- ============================================================
-- KRAMANIK - Coaching Institute Management SaaS
-- Database Schema v1.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS kramanik_db;
USE kramanik_db;

-- ============================================================
-- 1. INSTITUTES (multi-tenant root)
-- ============================================================
CREATE TABLE institutes (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    phone       VARCHAR(15)  NOT NULL,
    address     TEXT,
    plan        ENUM('FREE', 'BASIC', 'PRO') DEFAULT 'FREE',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. USERS (institute admins / staff)
-- ============================================================
CREATE TABLE users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    institute_id  BIGINT NOT NULL,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('ADMIN', 'STAFF') DEFAULT 'ADMIN',
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
);

-- ============================================================
-- 3. BATCHES (e.g. "Class 10 Science - Morning")
-- ============================================================
CREATE TABLE batches (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    institute_id  BIGINT NOT NULL,
    name          VARCHAR(100) NOT NULL,
    subject       VARCHAR(100),
    schedule_days VARCHAR(50),           -- e.g. "MON,WED,FRI"
    start_time    TIME,
    end_time      TIME,
    monthly_fee   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
);

-- ============================================================
-- 4. STUDENTS
-- ============================================================
CREATE TABLE students (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    institute_id    BIGINT NOT NULL,
    name            VARCHAR(100) NOT NULL,
    phone           VARCHAR(15),
    parent_name     VARCHAR(100),
    parent_phone    VARCHAR(15),
    parent_whatsapp VARCHAR(15),
    email           VARCHAR(100),
    date_of_birth   DATE,
    address         TEXT,
    join_date       DATE NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
);

-- ============================================================
-- 5. STUDENT_BATCHES (many-to-many enrollment)
-- ============================================================
CREATE TABLE student_batches (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id   BIGINT NOT NULL,
    batch_id     BIGINT NOT NULL,
    enrolled_on  DATE NOT NULL,
    left_on      DATE,
    is_active    BOOLEAN DEFAULT TRUE,
    UNIQUE KEY unique_enrollment (student_id, batch_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id)   REFERENCES batches(id)  ON DELETE CASCADE
);

-- ============================================================
-- 6. ATTENDANCE
-- ============================================================
CREATE TABLE attendance (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id   BIGINT NOT NULL,
    batch_id     BIGINT NOT NULL,
    date         DATE NOT NULL,
    status       ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL,
    marked_by    BIGINT,                -- user_id
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_attendance (student_id, batch_id, date),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id)   REFERENCES batches(id)  ON DELETE CASCADE
);

-- ============================================================
-- 7. FEE RECORDS
-- ============================================================
CREATE TABLE fee_records (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id     BIGINT NOT NULL,
    batch_id       BIGINT NOT NULL,
    month          VARCHAR(7) NOT NULL,   -- format: YYYY-MM
    amount_due     DECIMAL(10,2) NOT NULL,
    amount_paid    DECIMAL(10,2) DEFAULT 0.00,
    due_date       DATE NOT NULL,
    paid_date      DATE,
    status         ENUM('PENDING', 'PARTIAL', 'PAID', 'OVERDUE') DEFAULT 'PENDING',
    payment_mode   ENUM('CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'),
    notes          TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_fee (student_id, batch_id, month),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id)   REFERENCES batches(id)  ON DELETE CASCADE
);

-- ============================================================
-- 8. NOTIFICATIONS LOG
-- ============================================================
CREATE TABLE notifications (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    institute_id BIGINT NOT NULL,
    student_id   BIGINT,
    type         ENUM('FEE_REMINDER', 'ATTENDANCE_ALERT', 'ANNOUNCEMENT') NOT NULL,
    channel      ENUM('WHATSAPP', 'SMS', 'EMAIL') NOT NULL,
    message      TEXT NOT NULL,
    status       ENUM('SENT', 'FAILED', 'PENDING') DEFAULT 'PENDING',
    sent_at      DATETIME,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id)   REFERENCES students(id)  ON DELETE SET NULL
);

-- ============================================================
-- SEED: Demo Institute + Admin User
-- (password: Admin@123 — bcrypt hash)
-- ============================================================
INSERT INTO institutes (name, email, phone, address, plan)
VALUES ('Demo Academy', 'demo@kramanik.in', '9999999999', 'Bhubaneswar, Odisha', 'PRO');

INSERT INTO users (institute_id, name, email, password_hash, role)
VALUES (1, 'Admin User', 'admin@kramanik.in',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHi', 'ADMIN');

INSERT INTO batches (institute_id, name, subject, schedule_days, start_time, end_time, monthly_fee)
VALUES
    (1, 'Class 10 - Science Morning', 'Physics, Chemistry', 'MON,WED,FRI', '07:00:00', '09:00:00', 1500.00),
    (1, 'Class 12 - Maths Evening',   'Mathematics',        'TUE,THU,SAT', '17:00:00', '19:00:00', 1200.00);

-- ============================================================
-- 9. PLAN SUBSCRIPTIONS (Sprint 5)
-- ============================================================
CREATE TABLE plan_subscriptions (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    institute_id      BIGINT NOT NULL,
    plan              ENUM('FREE','BASIC','PRO') NOT NULL,
    started_on        DATE NOT NULL,
    expires_on        DATE,
    amount_paid       INT,
    payment_reference VARCHAR(100),
    status            ENUM('ACTIVE','EXPIRED','CANCELLED') DEFAULT 'ACTIVE',
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
);

-- Seed: FREE subscription for demo institute
INSERT INTO plan_subscriptions (institute_id, plan, started_on, status)
VALUES (1, 'FREE', CURDATE(), 'ACTIVE');
