# Architecture Record Documents (ARD)

このディレクトリは、開発過程での重要な決定や実装の背景を記録するためのアーキテクチャ記録文書（ARD）を管理します。

## ARDの目的

- **決定の透明性**: なぜその実装を選択したかの理由を明確化
- **知識の継承**: 将来の開発者が過去の判断を理解できるよう支援
- **議論の基盤**: 実装方法の変更時に過去の検討内容を参照

## ファイル命名規則

```
ARD-YYYYMMDD-brief-description.md
```

例：
- `ARD-20241213-pod042-character-implementation.md`
- `ARD-20241213-system-prompt-redesign.md`

## テンプレート構造

各ARDは以下の構造で記述：

1. **Status**: 提案中/承認済み/実装済み/廃止
2. **Background**: 解決したい課題・背景
3. **Problem**: 具体的な問題点
4. **Solution**: 採用する解決策
5. **Alternatives**: 検討した代替案
6. **Implementation**: 実装詳細
7. **Consequences**: 影響・トレードオフ

## 作成タイミング

- 新機能の設計・実装前
- 既存機能の大幅な変更前
- アーキテクチャに影響する決定時
- 技術的な課題の解決時
