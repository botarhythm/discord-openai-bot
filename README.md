# Discord OpenAI Bot

Discord上でOpenAI APIを使用した会話ボットです。

## 機能

- Discord上でのメッセージに対するAIレスポンス
- 会話履歴の保存（Supabase使用）
- OpenAI GPT-4o-miniモデルによる回答生成
- ヘルスチェックエンドポイント

## 必要条件

- Node.js 18以上
- Discord Bot Token
- OpenAI API Key
- Supabase アカウント

## 環境変数

`.env`ファイルに以下の環境変数を設定してください：

```
# Discord Bot設定
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
GUILD_ID=your_guild_id

# OpenAI API設定
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# Supabase設定
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# その他の設定
DEBUG=verbose
PREFIX=!
ALLOW_ALL_SERVERS=true
```

## インストール

```bash
npm install
```

## 実行

```bash
npm start
```

## Supabase設定

Supabaseで以下のテーブルを作成してください：

```sql
CREATE TABLE conversation_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_conversation_channel_user ON conversation_histories(channel_id, user_id);
CREATE INDEX idx_conversation_created_at ON conversation_histories(created_at);
```

## Railway.appへのデプロイ

このボットはRailway.appでのデプロイを前提に設計されています。GitHubリポジトリと連携することで自動デプロイが可能です。

## ライセンス

MIT