# 共通パターン集

## 頻繁に使用するコマンドパターン

### 開発コマンド
```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクション実行
npm run start
```

### Git操作パターン
```bash
# 機能開発ブランチ作成
git checkout -b feature/機能名

# 変更をコミット（日本語メッセージ）
git add .
git commit -m "機能名: 変更内容の説明"

# リモートにプッシュ
git push origin feature/機能名
```

### ファイル構造確認
```bash
# プロジェクト構造確認
find . -name "*.ts" -not -path "./node_modules/*" | head -10

# 特定パターンのファイル検索
find . -name "*agent*" -type f
```

## 定型的な実装テンプレート

### Tool実装テンプレート
```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const functionNameTool = createTool({
  id: 'function-identifier',
  description: '機能の説明',
  inputSchema: z.object({
    // 入力パラメータ定義
    param: z.string().describe('パラメータの説明'),
  }),
  outputSchema: z.object({
    // 出力データ定義
    result: z.string(),
    status: z.boolean(),
  }),
  execute: async ({ context }) => {
    try {
      // 実装ロジック
      const result = await someFunction(context.param);
      return {
        result,
        status: true,
      };
    } catch (error) {
      throw new Error(`エラーメッセージ: ${error.message}`);
    }
  },
});
```

### Agent実装テンプレート
```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { functionNameTool } from '../tools/function-name-tool';

export const purposeAgent = new Agent({
  name: 'エージェント名',
  instructions: `
    あなたは指定された役割を持つエージェントです。

    主な機能:
    - 機能1の説明
    - 機能2の説明

    応答時の注意点:
    - 注意点1
    - 注意点2

    利用可能なツール:
    - ツール名: ツールの説明
  `,
  model: anthropic('claude-3-5-sonnet-20241022'),
  tools: { functionNameTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
  }),
});
```

### Workflow実装テンプレート
```typescript
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

const step1 = createStep({
  id: 'step-1-name',
  description: 'ステップ1の説明',
  inputSchema: z.object({
    // 入力スキーマ
  }),
  outputSchema: z.object({
    // 出力スキーマ
  }),
  execute: async ({ inputData }) => {
    // ステップ1の処理
    return {
      // 結果データ
    };
  },
});

const step2 = createStep({
  id: 'step-2-name',
  description: 'ステップ2の説明',
  inputSchema: z.object({
    // step1の出力スキーマと一致
  }),
  outputSchema: z.object({
    // 最終出力スキーマ
  }),
  execute: async ({ inputData }) => {
    // ステップ2の処理
    return {
      // 最終結果
    };
  },
});

export const processNameWorkflow = createWorkflow({
  id: 'workflow-name',
  inputSchema: z.object({
    // 初期入力スキーマ
  }),
  outputSchema: z.object({
    // 最終出力スキーマ
  }),
})
  .then(step1)
  .then(step2);

processNameWorkflow.commit();
```

### エラーハンドリングパターン
```typescript
// API呼び出し時のエラーハンドリング
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  
  // データ検証
  if (!data.results?.[0]) {
    throw new Error(`データが見つかりません: ${searchTerm}`);
  }
  
  return data;
} catch (error) {
  throw new Error(`API呼び出しエラー: ${error.message}`);
}
```

### 型定義パターン
```typescript
// API レスポンス型定義
interface ApiResponse {
  results: {
    id: string;
    name: string;
    data: Record<string, any>;
  }[];
  status: 'success' | 'error';
  message?: string;
}

// Zodスキーマパターン
const configSchema = z.object({
  apiKey: z.string().min(1, 'APIキーは必須です'),
  baseUrl: z.string().url('有効なURLを入力してください'),
  timeout: z.number().positive().default(5000),
});
```

## デバッグパターン

### ログ出力パターン
```typescript
// 開発時のデバッグログ
console.log('[DEBUG]', '処理開始:', { inputData });
console.log('[INFO]', 'API呼び出し:', { url, params });
console.log('[ERROR]', 'エラー発生:', error);
```

### 型チェックパターン
```typescript
// 実行時型チェック
const validatedInput = inputSchema.parse(rawInput);
const validatedOutput = outputSchema.parse(result);
```

## テストパターン

### 基本テスト構造
```typescript
import { describe, it, expect } from 'vitest';
import { functionNameTool } from './function-name-tool';

describe('functionNameTool', () => {
  it('正常ケース: テストケース名', async () => {
    const input = { /* テストデータ */ };
    const result = await functionNameTool.execute({ context: input });
    
    expect(result).toEqual({
      // 期待する結果
    });
  });

  it('異常ケース: エラーケース名', async () => {
    const input = { /* 異常なテストデータ */ };
    
    await expect(functionNameTool.execute({ context: input }))
      .rejects.toThrow('期待するエラーメッセージ');
  });
});
```