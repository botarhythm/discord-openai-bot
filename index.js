require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const OpenAI = require('openai');
const ConversationHistory = require('./utils/conversationHistory');
const express = require('express');

// ヘルスチェック用のExpressサーバー設定
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/health`);
});

// Discordクライアントの初期化
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

// OpenAI APIの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 会話履歴管理
const conversationHistory = new ConversationHistory();

// ボット起動時の情報出力
client.once('ready', () => {
  console.log(`Discord.js Version: ${require('discord.js').version}`);
  console.log(`Node.js Version: ${process.version}`);
  console.log(`Bot Version: ${require('./package.json').version}`);
  console.log('Ready! Logged in as', client.user.tag);
  console.log(`Discord.js Version: ${require('discord.js').version}`);
  console.log(`Bot User ID: ${client.user.id}`);
  console.log(`Bot Username: ${client.user.username}`);
  console.log(`Bot Discriminator: ${client.user.discriminator}`);
  console.log(`Bot Tag: ${client.user.tag}`);
  console.log(`Direct Messages intent enabled: ${client.options.intents.has(GatewayIntentBits.DirectMessages)}`);
  console.log(`Message Content intent enabled: ${client.options.intents.has(GatewayIntentBits.MessageContent)}`);
  
  // API設定状態確認
  if (!process.env.OPENAI_API_KEY) {
    console.log('OpenAI API設定状態: 未設定');
    console.warn('WARNING: OpenAI API service is not configured. Bot will use fallback responses.');
  } else {
    console.log('OpenAI API設定状態: 設定済み');
    console.log(`OpenAI Model: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`);
  }
});

// メッセージイベントハンドラー
client.on('messageCreate', async (message) => {
  try {
    // ボット自身のメッセージは無視
    if (message.author.bot) return;

    // コンテキスト取得
    const channelId = message.channel.id;
    const userId = message.author.id;

    // 過去の会話履歴を取得
    const previousMessages = await conversationHistory.getConversation(channelId, userId);

    // AIレスポンス生成
    const aiResponse = await generateAIResponse(previousMessages, message.content);

    // 応答の送信
    await message.reply(aiResponse);

    // 会話履歴の保存
    const updatedMessages = [
      ...previousMessages, 
      { role: 'user', content: message.content },
      { role: 'assistant', content: aiResponse }
    ];
    await conversationHistory.saveConversation(channelId, userId, updatedMessages);

  } catch (error) {
    console.error('メッセージ処理中にエラーが発生:', error);
    message.reply('申し訳ありません。エラーが発生しました。');
  }
});

// AIレスポンス生成関数
async function generateAIResponse(previousMessages, newMessage) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return 'OpenAI APIキーが設定されていません。環境変数を確認してください。';
    }

    // OpenAI APIに送信するためのメッセージ形式に変換
    const messages = formatMessagesForOpenAI(previousMessages, newMessage);

    // OpenAI API呼び出し
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('AI応答生成エラー:', error);
    return 'すみません。うまく応答できません。';
  }
}

// OpenAI API用メッセージフォーマット関数
function formatMessagesForOpenAI(previousMessages, newMessage) {
  // システムメッセージを追加
  const systemMessage = {
    role: 'system',
    content: 'あなたは親切で丁寧なアシスタントです。ユーザーの質問に対して適切かつ正確に答えてください。'
  };

  // 直近の会話履歴を使用(最大5件)
  const contextMessages = previousMessages.slice(-5);
  
  // OpenAI API形式のメッセージ配列を構築
  const messages = [
    systemMessage,
    ...contextMessages,
    { role: 'user', content: newMessage }
  ];

  return messages;
}

// 定期的に古い会話履歴を削除
setInterval(() => {
  conversationHistory.pruneOldConversations();
}, 24 * 60 * 60 * 1000); // 24時間ごと

// Discordボットログイン
client.login(process.env.DISCORD_TOKEN);