CREATE TABLE
  IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    inviter_code INT UNSIGNED DEFAULT NULL COMMENT '邀请人的邀请码，直接使用 id，外部使用 sqids库 转码',
    created_at INT UNSIGNED NOT NULL COMMENT '创建时间, UNIX 秒 类型或BIGINT',
    updated_at INT UNSIGNED NOT NULL COMMENT '更新时间, UNIX 秒 类型或BIGINT',
    deleted_at INT UNSIGNED DEFAULT 0 COMMENT '删除时间',
    is_deleted TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否删除',
    version INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '用于并发控制，乐观锁',
    KEY idx_inviter_code (inviter_code)
  ) ENGINE = InnoDB;