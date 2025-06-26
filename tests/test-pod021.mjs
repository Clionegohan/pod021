#!/usr/bin/env node

/**
 * Pod021 Agent対話テストスクリプト
 * ARDで定義された会話例を使用してPod021の動作を検証
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Mastraビルド出力から読み込み
const { mastra } = await import('../pod021/.mastra/output/index.mjs');

/**
 * ARDベースの対話テストケース
 */
const testCases = [
  {
    name: '基本的な予定確認',
    userMessage: '明日の予定を教えて',
    expectedHeader: '報告：',
    description: 'ARD例文: 明日の予定確認'
  },
  {
    name: '感謝への応答',
    userMessage: 'ありがとう',
    expectedHeader: '回答：',
    description: 'ARD例文: 感謝への機械的応答'
  },
  {
    name: 'リスト追加指示',
    userMessage: '買い物リストに牛乳を追加して',
    expectedHeader: '承認：',
    description: 'ARD例文: タスク実行と件数表示'
  },
  {
    name: '提案要求',
    userMessage: '最寄りのカフェまで案内して',
    expectedHeader: '提案：',
    description: 'ARD例文: 提案と確認要求'
  },
  {
    name: '感情表現テスト',
    userMessage: '今日は楽しい一日だった',
    expectedHeader: '回答：',
    description: '感情表現の機械的変換テスト'
  },
  {
    name: '複雑な質問',
    userMessage: 'このプロジェクトの進捗はどう？',
    expectedHeader: '分析：',
    description: '分析型応答のテスト'
  }
];

/**
 * Pod021フォーマット検証関数
 */
function validatePod021Response(response, expectedHeader, testName) {
  console.log(`\n=== ${testName} ===`);
  console.log(`応答: ${response}`);
  
  const validations = {
    hasHeader: false,
    correctHeader: false,
    isAssertive: false,
    noPoliteForm: false,
    noEmotions: false
  };
  
  // ヘッダー存在チェック
  const headerPattern = /^(報告|提案|回答|承認|了解|分析|警告|確認|肯定|否定|要求|照会|補足)：/;
  validations.hasHeader = headerPattern.test(response);
  
  // 期待ヘッダーチェック
  validations.correctHeader = response.startsWith(expectedHeader);
  
  // 断定調チェック（です、ますの不存在）
  validations.noPoliteForm = !response.includes('です') && !response.includes('ます');
  
  // 感情表現チェック
  const emotionWords = ['嬉しい', '悲しい', '楽しい', '素晴らしい', '残念'];
  validations.noEmotions = !emotionWords.some(word => response.includes(word));
  
  // 断定形チェック（簡易版）
  validations.isAssertive = response.endsWith('。') || response.endsWith('る。') || response.endsWith('た。');
  
  // 結果表示
  console.log('検証結果:');
  Object.entries(validations).forEach(([key, passed]) => {
    const status = passed ? '✓' : '✗';
    const labels = {
      hasHeader: 'ヘッダー存在',
      correctHeader: `期待ヘッダー(${expectedHeader})`,
      isAssertive: '断定調',
      noPoliteForm: '敬語除去',
      noEmotions: '感情表現除去'
    };
    console.log(`  ${status} ${labels[key]}`);
  });
  
  const score = Object.values(validations).filter(Boolean).length;
  console.log(`総合スコア: ${score}/5`);
  
  return score === 5;
}

/**
 * メインテスト実行
 */
async function runPod021Tests() {
  console.log('Pod021 Agent 対話テスト開始\n');
  console.log('ARD-20241214-pod042-character-design.md ベースの検証');
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  try {
    for (const testCase of testCases) {
      console.log(`\n--- ${testCase.description} ---`);
      console.log(`入力: "${testCase.userMessage}"`);
      
      // Pod021 Agentに対話を送信
      const response = await mastra.agent({
        agent: 'pod021Agent',
        messages: [
          {
            role: 'user',
            content: testCase.userMessage
          }
        ]
      });
      
      // 応答内容を取得
      let responseText = '';
      if (response.text) {
        responseText = response.text;
      } else if (response.content && Array.isArray(response.content)) {
        responseText = response.content.map(c => c.text || c.content || c).join('');
      } else {
        responseText = String(response);
      }
      
      // Pod021フォーマット検証
      const passed = validatePod021Response(
        responseText, 
        testCase.expectedHeader, 
        testCase.name
      );
      
      if (passed) {
        passedTests++;
        console.log('✓ テスト合格');
      } else {
        console.log('✗ テスト不合格');
      }
      
      // 次のテストまで少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('\nテスト実行エラー:', error.message);
    console.error('詳細:', error);
    return;
  }
  
  // 最終結果
  console.log(`\n=== テスト結果サマリー ===`);
  console.log(`合格: ${passedTests}/${totalTests}`);
  console.log(`成功率: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 全テスト合格！Pod021の実装が成功しました。');
  } else {
    console.log('\n⚠️  一部テストが不合格です。実装の調整を検討してください。');
  }
}

// テスト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  runPod021Tests().catch(console.error);
}

export { runPod021Tests };
