# ADR-010: enaga を MathEnaga と別のリポジトリにし、サイトは GitHub のタグで依存する

## Context

[ADR-009](ADR-009-site-independent-ui.md) で、画面の部品からサイト固有の値を外に出し、`content/` を差し替えれば同じ形の別サイトを作れるようにした。そのときは置き場所を変えず、ツールは MathEnaga のリポジトリの中に置いた。ADR-009 の Exit criteria には「パッケージにするか(npm workspaces か、npm への公開か)を決める」がある。

2026-11-14 に、人間が enaga を別のリポジトリにすると決めた。同じ日に、次のことも人間が決めた。

- リポジトリは `tmineno/enaga` で、公開する。
- MathEnaga は GitHub のタグで依存する(`"enaga": "github:tmineno/enaga#v0.1.0"`)。
- 履歴は移さず、1つ目のコミットから始める。
- ツールの仕様書と ADR(`docs/spec/`、ADR-001〜009)は enaga に移す。MathEnaga には、原稿(`content/`)、AGENTS.md、README、公開のワークフロー、README のバナーを残す。
- ADR-004 の「今の原稿」で確かめる不変条件は、enaga のコマンド `enaga check` にし、MathEnaga の CI がその原稿に対して実行する。

同じリポジトリにあったときは、ツールの変更と原稿の変更が同じ履歴と同じ CI に並んでいた。ツールの受け入れテストはテスト用原稿([ADR-004](ADR-004-frozen-test-manuscript.md))を入力にするので、ツールのテストのほとんどは、原稿がどこにあっても変わらない。原稿のリポジトリにあることが必要なのは、今の原稿で確かめる不変条件だけである。

## Decision

### リポジトリと配布

- enaga は `tmineno/enaga` に置く。1つ目のコミットは、MathEnaga の main(`5080a19`)のツールの部分(`src/`、`tests/`、`docs/spec/`、`docs/adr/`、設定ファイル)を写したものに、下の変更を加えたものにする。それより前の履歴は MathEnaga のリポジトリに残る。
- 版は `v0.1.0` から付け、タグで配る。npm には公開しない(`package.json` は `private: true`)。サイトは `package.json` の依存に `github:tmineno/enaga#<タグ>` と書き、版を上げるときはタグを書き換える。
- `package.json` の `files` は `src` と `tests` にする。`enaga check` が `tests/` の中のテストを実行するからである。`enaga check` がブラウザを使うので、`playwright` は依存(dependencies)にする。ブラウザそのものは、サイトの側でインストールする。

### コマンド

- コマンド `enaga` を `package.json` の `bin` で配る。サブコマンドは `build`・`dev`・`check`・`refs:verify`・`banner` で、どれもサイトのリポジトリのルートで実行する([build.md](../spec/build.md)「公開する入口」)。
- 原稿の場所の既定は、実行した場所の `content/` で、`--content <dir>` で変えられる。出力の場所は、実行した場所の `dist/` で、変えられない(build.md「Performance / Safety」の、消すのは `dist/` だけという要件)。
- `banner` は、実行した場所の `docs/assets/banner.svg` を書く([site.md](../spec/site.md)「ロゴと favicon」)。

### 仕様書と原稿の書き方

- enaga の `docs/spec/` と `docs/adr/` を、ツールの仕様の正本にする。
- 原稿の書き方(AGENTS.md)はサイトのリポジトリに置く。AGENTS.md から仕様書へのリンクは、依存しているタグの版を指す。

### サイトの原稿の確かめ方

- ADR-004 の「今の原稿」を、「サイトの原稿」と呼び直す。サイトのリポジトリの `content/` のことである。
- サイトの原稿で確かめる不変条件(ADR-004 の表)は、次の3つのテストファイルにまとめ、`enaga check` がサイトの原稿に対して実行する。サイトの原稿の場所は環境変数 `ENAGA_SITE_CONTENT`、サイトのリポジトリのルートは `ENAGA_SITE_ROOT` でテストに渡す。
  - `tests/integration/invariants.test.js`:ADR-004 の表の、ビルドと路線図の不変条件
  - `tests/browser/site-invariants.test.js`:ADR-004 の表の、[site.md](../spec/site.md) 10・15・33 の不変条件(ブラウザで確かめる)
  - `tests/integration/banner.test.js`:[site.md](../spec/site.md) の受け入れテスト 32(README のバナー)。サイトのリポジトリに `docs/assets/banner.svg` があるときだけ確かめる。代替テキストは、`site.yml` の name と比べる
- enaga 自身のテスト(`npm test`)では、環境変数を渡さないので、同じ3つのファイルがテスト用原稿に対して動く。そのために、`tests/fixtures/` をテスト用のサイトのリポジトリとみなし、MathEnaga の README の見出しと `docs/assets/banner.svg` の写しを `tests/fixtures/README.md` と `tests/fixtures/docs/assets/banner.svg` に置く。テスト用原稿(`tests/fixtures/content/`)は変えない。
- `invariants.test.js` は、それまでテスト用原稿と今の原稿の両方を1回の実行で確かめていた。この決定の後は、1回の実行で確かめる原稿は1つ(`enaga check` ではサイトの原稿、`npm test` ではテスト用原稿)になる。

## Consequences

- ツールの変更と原稿の変更を、1つの PR にまとめられなくなる。ツールを直したら、enaga でタグを付け、サイトのリポジトリで依存のタグを上げる PR を作る。
- 原稿の PR の CI は、enaga の受け入れテストを実行しなくなる。原稿で落ちうるのは、サイトの原稿の不変条件(`enaga check`)とビルドのエラーだけなので、確かめる範囲はそれまでの「今の原稿」の分と同じである。
- `npm ci` は、依存の取得のために GitHub からリポジトリを取り出す。lock ファイルには、タグが指すコミットの SHA が書かれる。
- AGENTS.md の仕様書へのリンクは、依存のタグを上げるときに書き換える。
- MathEnaga の `git log` で追えるツールの履歴は `5080a19` までで、それより後の履歴は enaga のリポジトリにある。enaga の1つ目のコミットより前を追うときは、MathEnaga の履歴を見る。
- ADR-004 の本文の「今の原稿」と、`content/` を指すリンクは、書いた時点の記録として直さない。仕様書の受け入れテストの節は「サイトの原稿」に直す。
- ADR-009 の Exit criteria のうち「パッケージにするか」は、この ADR で決まった。古い環境変数の名前(`MATHENAGA_*`)を受け付ける処理は残す。消すのは、それを使うサイトがなくなったときである。

## Alternatives

| 方式 | 内容 | 長所 | 短所 |
|---|---|---|---|
| 別のリポジトリにし、GitHub のタグで依存する(採用) | 上のとおり | npm のアカウントも公開の手順も要らない。サイトは版をタグで固定できる | `npm ci` が GitHub に依存する。版を上げるたびにサイトの PR が要る |
| npm に公開する | 版を付けて npm に公開する | 取り込みが速く、GitHub に依存しない | 公開の手順とアカウントが要り、名前の衝突も調べることになる。利用者が MathEnaga だけのうちは、公開 API の互換を守る責任だけが増える |
| git submodule | MathEnaga に enaga を submodule で取り込む | 版の固定とソースの参照が直接できる | clone と CI に submodule の手順が増える。npm の依存の解決と別の仕組みが2つになる |
| MathEnaga の中に置いたまま(ADR-009) | ディレクトリを分けるだけ | 変更が1つの PR で済む | 人間が別のリポジトリにすると決めた |
| 履歴を移す(git filter-repo) | ツールの部分の履歴を enaga に写す | enaga の中で履歴を追える | 人間が、履歴は移さないと決めた。元の履歴は MathEnaga に残る |
| サイトの原稿の不変条件を MathEnaga に残す | 3つのテストファイルを MathEnaga に写す | enaga に環境変数の受け口が要らない | テストのコードが2か所に分かれ、ツールの変更に合わせて両方を直すことになる |

## Exit criteria

次のどれかが起きたら、この決定を見直す。

- GitHub から取り出せない環境でサイトを作る必要ができたとき、または利用者が増えて版の互換を約束する必要ができたとき。npm への公開を検討する。
- サイトの原稿の不変条件に、サイトごとに違う値が要るようになったとき。`enaga check` に設定を足すか、サイトの側でテストを書くかを決める。
