-- ============================================
-- 文件: 002-create-posts-indexes.sql
-- 描述: 为文章表添加索引
-- 表: posts
-- 创建时间: 2025-01-15
-- 作者: Pony
-- ============================================

-- 用户文章索引（查询某个用户的所有文章）
CREATE INDEX idx_user_id ON posts (user_id);

-- 状态索引（查询特定状态的文章）
CREATE INDEX idx_status ON posts (status);

-- 发布时间索引（按发布时间排序）
CREATE INDEX idx_published_at ON posts (published_at);

-- 软删除索引（过滤已删除的文章）
CREATE INDEX idx_is_deleted ON posts (is_deleted);

-- 复合索引：用户+状态（查询某用户特定状态的文章）
CREATE INDEX idx_user_status ON posts (user_id, status);

-- 复合索引：状态+发布时间（查询已发布文章并按时间排序）
CREATE INDEX idx_status_published ON posts (status, published_at);
