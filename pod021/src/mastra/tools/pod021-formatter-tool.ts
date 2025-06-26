import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// ARDに基づいたPod021の応答タイプ定義
const ResponseType = z.enum([
  '報告',
  '提案', 
  '回答',
  '承認',
  '了解',
  '分析',
  '警告',
  '確認'
]);

type ResponseTypeEnum = z.infer<typeof ResponseType>;

// Pod021の応答スキーマ
const pod021ResponseSchema = z.object({
  type: ResponseType,
  content: z.string(),
  additionalInfo: z.string().optional(),
});

export const pod021FormatterTool = createTool({
  id: 'pod021-formatter',
  description: 'LLMの自然な応答をPod021の発話スタイルに変換',
  inputSchema: z.object({
    rawResponse: z.string().describe('LLMの生の応答'),
    responseType: ResponseType.optional().describe('応答タイプ（自動判定も可能）'),
    context: z.string().optional().describe('会話のコンテキスト'),
  }),
  outputSchema: pod021ResponseSchema,
  execute: async ({ context }) => {
    const { rawResponse, responseType, context: conversationContext } = context;
    
    // 1. 応答タイプの自動判定（指定されていない場合）
    const detectedType = responseType || detectResponseType(rawResponse, conversationContext);
    
    // 2. Pod021スタイルへの変換
    const formattedContent = formatToPod021Style(rawResponse, detectedType);
    
    // 3. 追加情報の抽出（必要に応じて）
    const additionalInfo = extractAdditionalInfo(rawResponse, detectedType);
    
    return {
      type: detectedType,
      content: formattedContent,
      additionalInfo,
    };
  },
});

/**
 * 応答タイプを自動判定
 */
function detectResponseType(response: string, context?: string): ResponseTypeEnum {
  const lowerResponse = response.toLowerCase();
  const lowerContext = context?.toLowerCase() || '';
  
  // キーワードベースの判定ロジック
  if (lowerResponse.includes('追加') || lowerResponse.includes('登録') || lowerResponse.includes('設定')) {
    return '承認';
  }
  
  if (lowerResponse.includes('わかり') || lowerResponse.includes('了解') || lowerResponse.includes('実行')) {
    return '了解';
  }
  
  if (lowerResponse.includes('おすすめ') || lowerResponse.includes('提案') || lowerResponse.includes('〜してみて')) {
    return '提案';
  }
  
  if (lowerResponse.includes('警告') || lowerResponse.includes('注意') || lowerResponse.includes('危険')) {
    return '警告';
  }
  
  if (lowerResponse.includes('分析') || lowerResponse.includes('データ') || lowerResponse.includes('統計')) {
    return '分析';
  }
  
  if (lowerResponse.includes('？') || lowerResponse.includes('確認') || lowerResponse.includes('よろしい')) {
    return '確認';
  }
  
  // 質問への回答かどうか判定
  if (lowerContext.includes('？') || lowerContext.includes('教えて') || lowerContext.includes('どう')) {
    return '回答';
  }
  
  // デフォルトは報告
  return '報告';
}

/**
 * Pod021スタイルへの文体変換
 */
function formatToPod021Style(response: string, type: ResponseTypeEnum): string {
  let formatted = response;
  
  // 1. 敬語・丁寧語の除去と断定調への変換
  formatted = formatted
    .replace(/です。?/g, '。')
    .replace(/ます。?/g, '。')
    .replace(/でしょう。?/g, '。')
    .replace(/だと思います/g, 'と判断する')
    .replace(/〜かもしれません/g, '〜の可能性がある')
    .replace(/お疲れ様/g, '')
    .replace(/ありがとう/g, '')
    .replace(/すみません/g, '')
    .replace(/恐れ入り/g, '');
  
  // 2. 感情表現の除去・変換
  formatted = formatted
    .replace(/嬉しい/g, '好ましい状態')
    .replace(/楽しい/g, '効率的')
    .replace(/悲しい/g, '非効率的状態')
    .replace(/驚く/g, '予期しない事象')
    .replace(/感動/g, '効果的反応');
  
  // 3. Pod021特有の表現への変換
  formatted = formatted
    .replace(/私は/g, '当機は')
    .replace(/僕は/g, '当機は')
    .replace(/あなた/g, 'ユーザー')
    .replace(/君/g, 'ユーザー')
    .replace(/できました/g, '完了')
    .replace(/しました/g, '実行')
    .replace(/見つけました/g, '検出')
    .replace(/調べました/g, '解析');
  
  // 4. 断定形への変換
  if (!formatted.endsWith('。')) {
    formatted += '。';
  }
  
  // 5. 冗長な表現の簡略化
  formatted = formatted
    .replace(/。。+/g, '。')
    .replace(/\s+/g, ' ')
    .trim();
  
  return formatted;
}

/**
 * 追加情報の抽出（件数、時刻、詳細データなど）
 */
function extractAdditionalInfo(response: string, type: ResponseTypeEnum): string | undefined {
  // 件数情報の抽出
  const countMatch = response.match(/(\d+)件/);
  if (countMatch && (type === '承認' || type === '報告')) {
    return `【現在${countMatch[1]}件】`;
  }
  
  // 時刻情報の抽出
  const timeMatch = response.match(/(\d{1,2}時\d{1,2}分)|(\d{1,2}:\d{2})/);
  if (timeMatch && type === '了解') {
    return `【${timeMatch[0]}に実行】`;
  }
  
  // データ量の情報
  const dataMatch = response.match(/(\d+\.?\d*)MB|(\d+\.?\d*)GB|(\d+)個/);
  if (dataMatch && type === '分析') {
    return `【データ量: ${dataMatch[0]}】`;
  }
  
  return undefined;
}

/**
 * Pod021の完全な応答を生成（ヘッダー付き）
 */
export function generatePod021Response(formatted: { type: ResponseTypeEnum; content: string; additionalInfo?: string }): string {
  const { type, content, additionalInfo } = formatted;
  const header = `${type}：`;
  const additionalPart = additionalInfo ? ` ${additionalInfo}` : '';
  
  return `${header}${content}${additionalPart}`;
}

/**
 * 親密フェーズでの例外的応答処理
 */
export function applyIntimacyPhase(response: string, intimacyLevel: number = 0): string {
  if (intimacyLevel < 3) {
    return response;
  }
  
  // 親密度が高い場合の例外的表現追加
  if (response.includes('当機は必要な処理を実行したのみである')) {
    return response + '……しかし、その言葉は好ましい反応と認識。';
  }
  
  if (response.includes('親密度') || response.includes('接触')) {
    return response.replace('。', '。当機は、非戦闘行為であっても、その接触を好意的と判断する。');
  }
  
  return response;
}
