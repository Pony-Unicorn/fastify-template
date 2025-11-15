-- ============================================
-- 文件: 001-create-posts-table.sql
-- 描述: 创建文章表
-- 表: posts
-- 创建时间: 2025-01-15
-- 作者: Pony
-- ============================================
CREATE TABLE
  IF NOT EXISTS posts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL COMMENT '作者用户ID',
    title VARCHAR(255) NOT NULL COMMENT '文章标题',
    content TEXT NOT NULL COMMENT '文章内容',
    status ENUM ('draft', 'published', 'archived') NOT NULL DEFAULT 'draft' COMMENT '文章状态',
    view_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '浏览次数',
    created_at INT UNSIGNED NOT NULL COMMENT '创建时间, UNIX 秒',
    updated_at INT UNSIGNED NOT NULL COMMENT '更新时间, UNIX 秒',
    published_at INT UNSIGNED DEFAULT NULL COMMENT '发布时间, UNIX 秒',
    deleted_at INT UNSIGNED DEFAULT 0 COMMENT '删除时间',
    is_deleted TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否删除',
    version INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '用于并发控制，乐观锁',
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  ) ENGINE = InnoDB;
