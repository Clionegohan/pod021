# ARD-20241214-mastra-architecture-design

## Status
- [x] 実装済み

## Background
Pod021プロジェクトでMastraフレームワークを採用し、AIエージェントシステムを構築している。チーム全体でMastraの設計思想とアーキテクチャを統一理解する必要がある。

## Problem
Mastraフレームワークの各コンポーネント（Tools、Agents、Workflows）の役割と相互関係が明確でなく、開発者が統一されたパターンで開発を進められない状況。

## Solution
Mastraの設計思想と各コンポーネントの役割を体系的に文書化し、開発ガイドラインとして活用する。

## Mastra Framework Architecture

### 設計思想
1. **関心の分離**: 機能（Tool）、AI（Agent）、フロー（Workflow）を明確に分離
2. **再利用性**: 各コンポーネントは独立して再利用可能
3. **構成可能性**: 小さなコンポーネントを組み合わせて複雑な機能を実現
4. **型安全性**: Zodスキーマによる入出力の型保証

### コンポーネント構成

#### 1. Tools (`/tools/`)
**役割**: 具体的な機能実装・外部APIとの連携
- 単一責任の原則で機能を分割
- Zodスキーマで入出力を定義
- 外部APIやデータソースとの接続

```typescript
// 例: weather-tool.ts
export const weatherTool = createTool({
  id: 'get-weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name'),
  }),
  execute: async ({ context }) => {
    // 具体的な機能実装
  },
});
```

#### 2. Agents (`/agents/`)
**役割**: AIモデルとツールの統合・会話型インターフェース
- LLMモデル（Claude、GPT等）との連携
- ツールを使用するための指示文（instructions）
- メモリ機能によるコンテキスト保持

```typescript
// 例: weather-agent.ts
export const weatherAgent = new Agent({
  name: 'Weather Agent',
  instructions: '天気情報を提供するアシスタント',
  model: anthropic('claude-3-5-sonnet-20241022'),
  tools: { weatherTool },
  memory: new Memory({ storage: new LibSQLStore() }),
});
```

#### 3. Workflows (`/workflows/`)
**役割**: 複数のステップを連携させた複雑な処理フロー
- 複数のToolやAgentを組み合わせ
- ステップ間のデータフロー管理
- 条件分岐や並列処理の制御

```typescript
// 例: weather-workflow.ts
const weatherWorkflow = createWorkflow({
  id: 'weather-workflow',
  inputSchema: z.object({ city: z.string() }),
})
  .then(fetchWeather)
  .then(planActivities);
```

#### 4. Central Registry (`/index.ts`)
**役割**: 全コンポーネントの統合と設定管理
- エージェント、ワークフローの登録
- ストレージ、ログ設定
- アプリケーション全体の初期化

### データフロー

```
Input → Tool → Agent → Workflow → Output
   ↓       ↓       ↓        ↓
Schema → Execute → Instruct → Orchestrate
```

### ディレクトリ構造

```
src/mastra/
├── index.ts           # 統合・設定
├── agents/           # AIエージェント
│   └── *.ts
├── tools/            # 機能実装
│   └── *.ts
└── workflows/        # 処理フロー
    └── *.ts
```

## Implementation Details

### 開発パターン
1. **Tool First**: まず必要な機能をToolとして実装
2. **Agent Integration**: ToolをAgentに統合してAI機能を追加
3. **Workflow Orchestration**: 複数のコンポーネントをWorkflowで連携
4. **Central Registration**: index.tsで全体を統合

### 命名規則
- Tool: `{機能名}Tool` (例: weatherTool)
- Agent: `{目的}Agent` (例: weatherAgent)  
- Workflow: `{処理名}Workflow` (例: weatherWorkflow)

### 型安全性の実現
- 全ての入出力にZodスキーマを定義
- TypeScriptの型推論を活用
- 実行時の型検証

## Consequences

### Positive:
- 機能が明確に分離され、保守しやすい
- 各コンポーネントが独立してテスト可能
- 新機能追加時の影響範囲が限定的
- 型安全性により実行時エラーを削減

### Negative:
- 小さな機能でも複数ファイルが必要
- 初期学習コストがある
- 設定が分散する可能性

### Risks:
- コンポーネント間の依存関係が複雑化
- → 明確な設計原則とレビュープロセスで軽減

## Related Issues/PRs
- feature/pod042-response-system

## References
- [Mastra公式ドキュメント](https://docs.mastra.ai)
- 既存実装: weather-tool.ts, weather-agent.ts, weather-workflow.ts