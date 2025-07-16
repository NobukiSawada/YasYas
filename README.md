# 農産物価格可視化サイト

## 概要

WAGRI APIから取得した農産物の価格データをグラフで可視化する静的サイトです。

## 特徴

- **静的サイト**: GitHub Pagesでホスティング可能
- **自動更新**: GitHub Actionsで毎日データを自動更新
- **モダンな設計**: データ取得とフロントエンドを分離

## セットアップ

1. リポジトリをクローンします。
2. `scripts/requirements.txt` を使ってPythonの依存ライブラリをインストールします。
3. GitHubリポジトリのSecretsに `WAGRI_API_KEY` と `GH_PAT` を設定します。

## 使い方

- `index.html` をブラウザで開くと、価格推移のグラフが表示されます。
- データは `data/prices.json` に保存されています。