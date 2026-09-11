-- =====================================================================
-- CƠ SỞ DỮ LIỆU: WEBSITE ĐỌC SÁCH ONLINE
-- Engine: InnoDB | Charset: utf8mb4 (hỗ trợ tiếng Việt + emoji)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS online_book_reading
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE online_book_reading;

-- =====================================================================
-- 1. NGƯỜI DÙNG
-- =====================================================================
CREATE TABLE users (
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
username VARCHAR(50) NOT NULL UNIQUE,
email VARCHAR(150) NOT NULL UNIQUE,
password_hash VARCHAR(255) NOT NULL,
full_name VARCHAR(150),
avatar_url VARCHAR(500),
bio TEXT,
role ENUM('reader','author','moderator','admin') NOT NULL DEFAULT 'reader',
status ENUM('active','banned','pending') NOT NULL DEFAULT 'active',
coin_balance INT UNSIGNED NOT NULL DEFAULT 0, -- xu để mua chương VIP
email_verified_at DATETIME NULL,
last_login_at DATETIME NULL,
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
INDEX idx_users_role (role),
INDEX idx_users_status (status)
) ENGINE=InnoDB;

-- =====================================================================
-- 2. TÁC GIẢ (có thể khác với tài khoản người dùng đăng truyện)
-- =====================================================================
CREATE TABLE authors (
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
user_id BIGINT UNSIGNED NULL, -- nếu tác giả có tài khoản trên hệ thống
pen_name VARCHAR(150) NOT NULL,
bio TEXT,
avatar_url VARCHAR(500),
country VARCHAR(100),
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
INDEX idx_authors_pen_name (pen_name)
) ENGINE=InnoDB;

-- =====================================================================
-- 3. THỂ LOẠI & TAG
-- =====================================================================
CREATE TABLE categories (
id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100) NOT NULL UNIQUE,
slug VARCHAR(120) NOT NULL UNIQUE,
description VARCHAR(500),
parent_id INT UNSIGNED NULL, -- hỗ trợ thể loại con
FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE tags (
id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(50) NOT NULL UNIQUE,
slug VARCHAR(70) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- =====================================================================
-- 4. SÁCH / TRUYỆN
-- =====================================================================
CREATE TABLE books (
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
title VARCHAR(255) NOT NULL,
slug VARCHAR(280) NOT NULL UNIQUE,
author_id BIGINT UNSIGNED NOT NULL,
cover_image_url VARCHAR(500),
description TEXT,
status ENUM('ongoing','completed','paused','dropped') NOT NULL DEFAULT 'ongoing',
is_vip BOOLEAN NOT NULL DEFAULT FALSE, -- có chương trả phí không
total_chapters INT UNSIGNED NOT NULL DEFAULT 0,
total_views BIGINT UNSIGNED NOT NULL DEFAULT 0,
total_favorites INT UNSIGNED NOT NULL DEFAULT 0,
avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
rating_count INT UNSIGNED NOT NULL DEFAULT 0,
created_by BIGINT UNSIGNED NULL, -- user đăng truyện (nếu là tự đăng)
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE RESTRICT,
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
FULLTEXT INDEX ft_books_title_desc (title, description),
INDEX idx_books_status (status),
INDEX idx_books_author (author_id)
) ENGINE=InnoDB;

CREATE TABLE book_categories (
book_id BIGINT UNSIGNED NOT NULL,
category_id INT UNSIGNED NOT NULL,
PRIMARY KEY (book_id, category_id),
FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE book_tags (
book_id BIGINT UNSIGNED NOT NULL,
tag_id INT UNSIGNED NOT NULL,
PRIMARY KEY (book_id, tag_id),
FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 5. CHƯƠNG
-- =====================================================================
CREATE TABLE chapters (
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
book_id BIGINT UNSIGNED NOT NULL,
chapter_number INT UNSIGNED NOT NULL,
title VARCHAR(255) NOT NULL,
content LONGTEXT NOT NULL, -- nội dung chương (HTML/Markdown)
is_vip BOOLEAN NOT NULL DEFAULT FALSE,
price_coin INT UNSIGNED NOT NULL DEFAULT 0, -- giá xu nếu là VIP
word_count INT UNSIGNED NOT NULL DEFAULT 0,
views BIGINT UNSIGNED NOT NULL DEFAULT 0,
status ENUM('draft','published','hidden') NOT NULL DEFAULT 'published',
published_at DATETIME NULL,
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
UNIQUE KEY uk_book_chapter_number (book_id, chapter_number),
INDEX idx_chapters_book (book_id)
) ENGINE=InnoDB;

-- Mua chương VIP (ghi nhận user nào đã mở khoá chương nào)
CREATE TABLE chapter_purchases (
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
user_id BIGINT UNSIGNED NOT NULL,
chapter_id BIGINT UNSIGNED NOT NULL,
price_paid INT UNSIGNED NOT NULL,
purchased_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
UNIQUE KEY uk_user_chapter (user_id, chapter_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 6. LỊCH SỬ ĐỌC & TIẾN ĐỘ
-- =====================================================================
CREATE TABLE reading_history (
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
user_id BIGINT UNSIGNED NOT NULL,
book_id BIGINT UNSIGNED NOT NULL,
last_chapter_id BIGINT UNSIGNED NULL,
last_read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
FOREIGN KEY (last_chapter_id) REFERENCES chapters(id) ON DELETE SET NULL,
UNIQUE KEY uk_user_book (user_id, book_id),
INDEX idx_reading_history_user (user_id, last_read_at)
) ENGINE=InnoDB;

-- =====================================================================
-- 7. YÊU THÍCH / TỦ SÁCH
-- =====================================================================
CREATE TABLE favorites (
user_id BIGINT UNSIGNED NOT NULL,
book_id BIGINT UNSIGNED NOT NULL,
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (user_id, book_id),
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE reading_lists (
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
user_id BIGINT UNSIGNED NOT NULL,
name VARCHAR(150) NOT NULL,
is_public BOOLEAN NOT NULL DEFAULT FALSE,
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE reading_list_items (
reading_list_id BIGINT UNSIGNED NOT NULL,
book_id BIGINT UNSIGNED NOT NULL,
added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (reading_list_id, book_id),
FOREIGN KEY (reading_list_id) REFERENCES reading_lists(id) ON DELETE CASCADE,
FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 8. ĐÁNH GIÁ & BÌNH LUẬN
-- =====================================================================
CREATE TABLE ratings (
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
user_id BIGINT UNSIGNED NOT NULL,
book_id BIGINT UNSIGNED NOT NULL,
stars TINYINT UNSIGNED NOT NULL CHECK (stars BETWEEN 1 AND 5),
review TEXT,
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
UNIQUE KEY uk_user_book_rating (user_id, book_id)
) ENGINE=InnoDB;

CREATE TABLE comments (
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
user_id BIGINT UNSIGNED NOT NULL,
book_id BIGINT UNSIGNED NOT NULL,
chapter_id BIGINT UNSIGNED NULL, -- NULL = bình luận chung cho cả sách
parent_id BIGINT UNSIGNED NULL, -- trả lời bình luận khác
content TEXT NOT NULL,
like_count INT UNSIGNED NOT NULL DEFAULT 0,
status ENUM('visible','hidden','deleted') NOT NULL DEFAULT 'visible',
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
INDEX idx_comments_book (book_id),
INDEX idx_comments_chapter (chapter_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 9. THEO DÕI TÁC GIẢ / SÁCH
-- =====================================================================
CREATE TABLE author_follows (
user_id BIGINT UNSIGNED NOT NULL,
author_id BIGINT UNSIGNED NOT NULL,
followed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (user_id, author_id),
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 10. THÔNG BÁO
-- =====================================================================
CREATE TABLE notifications (
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
user_id BIGINT UNSIGNED NOT NULL,
type ENUM('new_chapter','comment_reply','system','promotion') NOT NULL,
title VARCHAR(255) NOT NULL,
content VARCHAR(500),
link_url VARCHAR(500),
is_read BOOLEAN NOT NULL DEFAULT FALSE,
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
INDEX idx_notifications_user (user_id, is_read)
) ENGINE=InnoDB;

-- =====================================================================
-- 11. GIAO DỊCH NẠP XU (thanh toán)
-- =====================================================================
CREATE TABLE payment_transactions (
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
user_id BIGINT UNSIGNED NOT NULL,
amount_money DECIMAL(12,2) NOT NULL, -- số tiền thật (VND/USD...)
coin_received INT UNSIGNED NOT NULL,
payment_method ENUM('momo','vnpay','banking','paypal','stripe') NOT NULL,
status ENUM('pending','success','failed') NOT NULL DEFAULT 'pending',
transaction_ref VARCHAR(150), -- mã giao dịch từ cổng thanh toán
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 12. BÁO CÁO VI PHẠM (nội dung xấu, spam...)
-- =====================================================================
CREATE TABLE reports (
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
reporter_id BIGINT UNSIGNED NOT NULL,
target_type ENUM('book','chapter','comment','user') NOT NULL,
target_id BIGINT UNSIGNED NOT NULL,
reason VARCHAR(255) NOT NULL,
status ENUM('pending','reviewed','dismissed') NOT NULL DEFAULT 'pending',
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
INDEX idx_reports_target (target_type, target_id)
) ENGINE=InnoDB;

-- =====================================================================
-- GỢI Ý TRIGGER / VIỆC CẬP NHẬT SỐ LIỆU TỔNG HỢP
-- (tuỳ chọn - có thể xử lý ở tầng ứng dụng thay vì DB trigger)
-- =====================================================================
-- Ví dụ: cập nhật avg_rating & rating_count của books mỗi khi có rating mới
-- có thể làm bằng trigger AFTER INSERT/UPDATE/DELETE trên bảng ratings,
-- hoặc bằng scheduled job / application logic tuỳ theo quy mô hệ thống.
