const { createClient } = require('@supabase/supabase-js');

class ConversationHistory {
  constructor() {
    // Supabaseクライアントの初期化
    this.supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_ANON_KEY
    );
    
    // メモリ内キャッシュ
    this.memoryCache = new Map();
  }

  // 会話履歴の保存
  async saveConversation(channelId, userId, messages) {
    try {
      const { data, error } = await this.supabase
        .from('conversation_histories')
        .insert({
          channel_id: channelId,
          user_id: userId,
          messages: JSON.stringify(messages),
          created_at: new Date()
        });

      if (error) throw error;

      // メモリキャッシュも更新
      const cacheKey = `${channelId}-${userId}`;
      this.memoryCache.set(cacheKey, messages);

      return true;
    } catch (err) {
      console.error('会話履歴の保存エラー:', err);
      return false;
    }
  }

  // 会話履歴の取得
  async getConversation(channelId, userId, limit = 10) {
    // メモリキャッシュを最初にチェック
    const cacheKey = `${channelId}-${userId}`;
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey);
    }

    try {
      const { data, error } = await this.supabase
        .from('conversation_histories')
        .select('messages')
        .eq('channel_id', channelId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // 取得した履歴をメモリキャッシュに保存
      if (data && data.length > 0) {
        const messages = JSON.parse(data[0].messages);
        this.memoryCache.set(cacheKey, messages);
        return messages;
      }

      return [];
    } catch (err) {
      console.error('会話履歴の取得エラー:', err);
      return [];
    }
  }

  // 古い履歴の削除
  async pruneOldConversations(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      const { data, error } = await this.supabase
        .from('conversation_histories')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      console.log(`${data ? data.length : 0}件の古い会話履歴を削除しました`);
    } catch (err) {
      console.error('古い会話履歴の削除エラー:', err);
    }
  }
}

module.exports = ConversationHistory;