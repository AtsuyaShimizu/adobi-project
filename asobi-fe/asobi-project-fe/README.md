# AsobiProjectFe

このプロジェクトは [Angular CLI](https://github.com/angular/angular-cli) バージョン 20.0.5 を使用して生成されました。

## 開発サーバー

ローカル開発サーバーを起動するには次のコマンドを実行します:

```bash
ng serve
```

サーバー起動後、ブラウザで `http://localhost:4200/` にアクセスしてください。ソースファイルを変更するとアプリケーションは自動的にリロードされます。

## モック API

モックのタスクデータを利用するには JSON Server を起動します:

```bash
npm run mock-api
```

タスクのエンドポイントは `http://localhost:3000/tasks` で確認できます。

## コードスキャフォールディング

Angular CLI には強力なコードスキャフォールディングツールが含まれています。新しいコンポーネントを生成するには次のコマンドを実行します:

```bash
ng generate component component-name
```

利用可能なスキーマティック（`components`、`directives`、`pipes` など）の一覧を表示するには以下を実行します:

```bash
ng generate --help
```

## ビルド

プロジェクトをビルドするには次を実行します:

```bash
ng build
```

このコマンドはプロジェクトをコンパイルし、ビルド成果物を `dist/` ディレクトリに出力します。デフォルトでは本番ビルドはアプリケーションを性能と速度のために最適化します。

## 単体テストの実行

[Karma](https://karma-runner.github.io) テストランナーを使用して単体テストを実行するには次のコマンドを実行します:

```bash
ng test
```

## E2E テストの実行

エンドツーエンド (e2e) テストを実行するには以下を使用します:

```bash
ng e2e
```

Angular CLI にはデフォルトで E2E テストフレームワークは含まれていません。必要に応じて適切なフレームワークを選択してください。

## 追加リソース

Angular CLI の詳細なコマンドリファレンスなどについては [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) を参照してください。
