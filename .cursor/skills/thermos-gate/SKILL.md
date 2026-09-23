---
name: thermos-gate
description: >-
  Mandatory post-implementation review gate. Runs thermo-nuclear-review and
  thermo-nuclear-code-quality-review in parallel before declaring done, PR-ready,
  or mergeable. Use when finishing a feature, before commit/push/PR, after
  substantive code edits, or when the user mentions サーモス / thermos / thermos-gate.
---

# サーモス・ゲート

ソースを足したら、完了・PR 準備・マージ可の前に必ずこれを走らせる。`/ai-review` は使わない。

docs・ルール・コメントのみは省略可。

## 手順

1. ベースは `origin/main`（無ければ `origin/HEAD`）。`git fetch` してから:
   - `git diff --stat <base>...HEAD`
   - `git diff <base>...HEAD`
   - 変更ファイルの必要箇所を読む
2. 同じメッセージで次を並列起動する（`run_in_background: true` 可）:
   - バグ・破壊・セキュリティ・devex・フラグ漏れ
   - 保守性・構造・肥大化・code judo
3. 各 Task のプロンプトに必ず含める:
   - `### Git / diff output`
   - `### Changed file contents`
   - ブランチ名と PR 番号（あれば）
4. 親が統合する。重複は潰し、重なりを重く見る。High から列挙する。
5. High（と必要な Medium）を直してから完了宣言する。実質的な再変更があれば再実行する。
6. 最終返答または PR 本文に「サーモス実施・主な指摘と対応」を短く残す。

## 起動の分岐

この実行環境の Task `subagent_type` に次があればそれを使う:

- `thermo-nuclear-review-subagent`
- `thermo-nuclear-code-quality-review-subagent`

無ければ `generalPurpose` を2本並列し、プロンプト先頭で次を読むよう指示する:

- `thermo-nuclear-review` スキル
- `thermo-nuclear-code-quality-review` スキル

プラグインのインストールは試みない。モデルは省略時 `inherit`。利用者がこの会話で指示しない限り `fast` / `xhigh` / `max` は付けない。
