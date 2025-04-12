-- 会話履歴テーブルの作成
CREATE TABLE IF NOT EXISTS conversation_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_conversation_channel_user 
ON conversation_histories(channel_id, user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_created_at 
ON conversation_histories(created_at);

-- 外部キー制約のための拡張機能が必要な場合
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
