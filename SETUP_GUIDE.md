# リソースアロケーション管理アプリ - セットアップガイド

このガイドは、新しいPC で本アプリを立ち上げる際の手順です。

## 前提条件

- Node.js 16以上がインストールされていること
- npm がインストールされていること

## セットアップ手順

### 1. 環境準備

```bash
# プロジェクトディレクトリに移動
cd C:\Users\yukit\resource-allocation-app

# 依存パッケージをインストール
npm install

# サーバーディレクトリでも依存パッケージをインストール
cd server
npm install
cd ..
```

### 2. 環境変数の設定（必要に応じて）

`.env` ファイルがあれば、サーバーディレクトリにコピーしてください。

```bash
# サーバーディレクトリ内
PORT=3001  # バックエンドポート（デフォルト: 3001）
```

### 3. データベースの初期化

初回起動時は自動的にSQLiteデータベースが作成されます。

**既存データを復元する場合：**

バックアップファイル（`backup_YYYY-MM-DD.json`）をサーバーディレクトリに配置して：

```bash
cd server
node restore-data.js backup_YYYY-MM-DD.json
cd ..
```

### 4. アプリの起動

**ターミナルまたはPowerShellで以下を実行：**

#### ターミナル1: バックエンドサーバーを起動

```bash
cd server
npm start
```

起動メッセージ: `Server running on http://localhost:3001`

#### ターミナル2: フロントエンド開発サーバーを起動

```bash
npm start
```

起動後、自動的にブラウザで `http://localhost:3000` が開きます。

## アプリの機能

### 1. 受注残管理タブ
- 案件の登録・編集・削除
- ランク（A/B/C/D/E）による分類
- 部署別フィルタリング
- 案件名での検索
- KPI表示（受注済み、ランクAB、受注残など）
- 見込みvs目標の分析
- 完了案件・失注案件の管理

### 2. アカウントプラン管理タブ
- ターゲット企業の管理
- カテゴリー分類（大手コンサル・メガSIer など）
- 企業情報の記録（担当者、アプローチ日、行動計画、期待金額）
- 目標金額の設定
- 進捗状況の可視化（円グラフ）
- 企業記録の複製

## データのバックアップ

### 自動バックアップ（毎回の起動時に推奨）

```bash
cd server
node export-data.js
```

バックアップファイルは `backup_YYYY-MM-DD.json` として保存されます。

### 手動でのバックアップ
- サーバーディレクトリの `orders.db` ファイルをコピーして保存

## トラブルシューティング

### ポート3000/3001がすでに使用されている場合

```bash
# Windows PowerShellで使用中のプロセスを確認
Get-NetTCPConnection -LocalPort 3001

# プロセスを停止（PIDを確認してから実行）
Stop-Process -Id <PID> -Force
```

### データベースが破損した場合

1. `server/orders.db` を削除
2. アプリを再起動（自動的に新規DBが作成される）
3. バックアップから復元:
```bash
cd server
node restore-data.js backup_YYYY-MM-DD.json
```

### npm パッケージの問題

```bash
# キャッシュをクリア
npm cache clean --force

# node_modules を削除して再インストール
rm -r node_modules
npm install
```

## ディレクトリ構成

```
resource-allocation-app/
├── src/
│   ├── App.js                    # メインアプリケーション
│   ├── OrderBacklogApp.jsx        # 受注残管理タブ
│   ├── AccountPlanningApp.jsx     # アカウントプラン管理タブ
│   ├── ResourceAllocationApp.jsx  # リソースアロケーション（準備中）
│   ├── api.js                     # API呼び出し関数
│   └── index.js
├── server/
│   ├── server.js                 # Express.jsサーバー
│   ├── orders.db                 # SQLiteデータベース
│   ├── export-data.js            # データエクスポートスクリプト
│   ├── restore-data.js           # データ復元スクリプト
│   └── package.json
├── public/
├── package.json
└── SETUP_GUIDE.md               # このファイル
```

## 重要なファイル

- **orders.db**: SQLiteデータベース（本体）
- **backup_YYYY-MM-DD.json**: データバックアップファイル（重要）
- **.env**: 環境変数設定（サーバーディレクトリ内）

## MySQL への移行について

現在はSQLiteを使用していますが、将来MySQLへの移行を計画しています。
その場合は、別途手順書が提供される予定です。
