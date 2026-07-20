# groovecast-site

sub.groovecast.tokyo（GrooveCast サブサイト）の静的ホスティング（GitHub Pages）。
旧 WordPress（ロリポップ）から 2026-07 に移行。

## 構成

| パス | 内容 |
|------|------|
| `/` | 本店 (www.groovecast.tokyo) へのリダイレクト |
| `/faq/` | よくある質問（自動納品フローの新文面） |
| `/attention/` | 演奏上の注意 |
| `/team/` | Team 紹介 |
| `/iframeteam/` | BASE トップページに埋め込まれる Team 一覧 iframe |
| `/会社概要/` | 会社概要 |
| `/wp-content/...` | 旧 WP のテーマ CSS・画像類（BASE テーマが originalstyle.css を参照するためパス維持） |
| `404.html` | 旧マイページ終了の案内つき 404 |

## 更新方法

このリポジトリの HTML を編集して main に push すると GitHub Pages に自動反映される。
旧 WordPress の会員機能（マイページ／再ダウンロード）は廃止。再DL依頼はメール対応。

関連リポジトリ: [groovecast-autostamp](https://github.com/sagbrain/groovecast-autostamp)（楽譜自動印字・納品システム）
