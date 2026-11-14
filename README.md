# enaga

Markdown の原稿から、学習の構造を鉄道の路線図で表す静的ウェブサイトを作るオーサリングツール。概念を「駅」、内容のまとまりを「路線」に見立て、読者が自分の分野を選ぶと、その分野の目標までの道のりと応用が表示される。

最初のサイトは、大学数学を物理・情報の学生に届ける [MathEnaga](https://github.com/tmineno/mathenaga)(**[サイト](https://tmineno.github.io/mathenaga/)**)。

## サイトで使う

Node.js 22 以上が要る。サイトのリポジトリの `package.json` に、タグを指定して依存を書く。

```json
{
  "scripts": {
    "build": "enaga build",
    "dev": "enaga dev",
    "check": "enaga check",
    "refs:verify": "enaga refs:verify",
    "banner": "enaga banner"
  },
  "dependencies": {
    "enaga": "github:tmineno/enaga#v0.1.0"
  }
}
```

コマンドは、サイトのリポジトリのルートで実行する。原稿は `content/` から読み(`--content <dir>` で変えられる)、サイトは `dist/` に書く。

```sh
npm ci
npx enaga dev           # ビルドして http://127.0.0.1:8000/ で配信する。保存するたびに作り直す
npx enaga build         # content/ の原稿を検査し、dist/ にサイトを書き出す
npx enaga check         # 原稿の不変条件を確かめる。先に npx playwright install chromium が要る
npx enaga refs:verify   # 文献の実在を検索 API で確かめ、確認の記録を書く
npx enaga banner        # content/assets/logo.txt から README のバナー docs/assets/banner.svg を作る
```

原稿の形式とエラーコードは [content-format.md](docs/spec/content-format.md)、コマンド・環境変数・CI と公開は [build.md](docs/spec/build.md) にある。

## enaga を開発する

```sh
npm ci
npm run dev     # テスト用原稿(tests/fixtures/content/)をビルドして配信する
npm test        # テストを実行する。先に npx playwright install chromium が要る
npm run lint && npm run typecheck && npm run format:check
```

- 仕様書の一覧と用語:[docs/spec/](docs/spec/README.md)。仕様とコードが食い違ったら、ADR に理由がない限り仕様が正しい。
- 決定の記録:[docs/adr/](docs/adr/)
- 版はタグ(`v0.1.0` など)で配る。npm には公開しない([ADR-010](docs/adr/ADR-010-separate-repository.md))。

変更はブランチから PR を作り、CI の `check` が通ってからマージする。

## ライセンス

MIT([LICENSE](LICENSE))
