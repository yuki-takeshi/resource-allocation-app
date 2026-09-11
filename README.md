# resource-allocation-app

受注残管理・STRAC ダッシュボード・顧客計画管理・アカウントプラン管理アプリケーション

## 機能

- **受注残管理**：注文情報の一覧表示・追加・修正・削除
- **STRAC ダッシュボード**：バランスシート形式の受注残表示
- **顧客計画管理**：顧客別アカウントプラン管理
- **アカウントプラン管理**：顧客分類と営業活動管理
- **管理画面**：管理者向けデータ修正画面（注文・目標・顧客計画・ユーザー管理）
- **ユーザー管理**：初回パスワード設定・パスワード有効期限管理

## 前提条件

- Node.js 16.x 以上
- npm または yarn
- ローカル SQLite（開発用）または MySQL（本番用）

## セットアップ手順

### 1. リポジトリをクローン

\\\ash
git clone https://github.com/yuki-takeshi/resource-allocation-app.git
cd resource-allocation-app
\\\

### 2. 依存パッケージをインストール

#### バックエンド（Express）
\\\ash
cd server
npm install
\\\

#### フロントエンド（React）
\\\ash
cd ../
npm install
\\\

### 3. 環境設定ファイルを作成

バックエンドの設定ファイルを作成：

\\\ash
cd server
cp .env.example .env
\\\

\.env\ ファイルを編集：
\\\
GOOGLE_API_KEY=your_google_api_key_here
PORT=3001

# メール送信設定（本番環境用）
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
\\\

**注意**：
- 開発環境では \SMTP_USER\ をコメントアウトしたまま使用してください
- メール送信はコンソール出力で確認できます
- 本番環境では Gmail の設定方法を参照してください

### 4. アプリケーションを起動

#### ターミナル 1：バックエンド（Express）
\\\ash
cd server
npm start
\\\

サーバーが \http://localhost:3001\ で起動します

#### ターミナル 2：フロントエンド（React）
\\\ash
npm start
\\\

アプリケーションが \http://localhost:3000\ で起動します

### 5. ログイン

初期ユーザーでログイン：
- **ユーザー名**：takeshi_bu
- **パスワード**：password123

## データベース

### 開発環境（SQLite）
- ファイル保存先：\server/orders.db\
- 自動作成されます

### 本番環境（MySQL）
- MySQL サーバーに接続
- 接続情報は環境変数で設定
- 初回実行時にテーブルが自動作成されます

## 主要な技術スタック

- **フロントエンド**：React、Tailwind CSS、Recharts
- **バックエンド**：Express.js、better-sqlite3（開発）/ mysql2（本番）
- **認証**：bcryptjs、express-session
- **メール**：nodemailer

## プロジェクト構成

\\\
resource-allocation-app/
├── server/                 # バックエンド（Express）
│   ├── server.js          # メインサーバーファイル
│   ├── orders.db          # SQLite データベース
│   ├── .env               # 環境変数（Git に登録しない）
│   └── .env.example       # 環境変数のテンプレート
├── src/                   # フロントエンド（React）
│   ├── App.js            # メインコンポーネント
│   ├── AdminPanel.jsx    # 管理画面
│   ├── components/       # コンポーネント
│   └── ...
├── .gitignore            # Git 無視ファイル
└── README.md             # このファイル
\\\

## API エンドポイント

### 認証
- \POST /api/auth/login\ - ログイン
- \POST /api/auth/logout\ - ログアウト
- \GET /api/auth/session\ - セッション確認
- \POST /api/auth/change-password\ - パスワード変更

### 管理画面
- \GET /api/admin/orders\ - 注文一覧
- \PUT /api/admin/orders/:id\ - 注文修正
- \DELETE /api/admin/orders/:id\ - 注文削除
- \GET /api/admin/targets\ - 目標一覧
- \PUT /api/admin/targets/:id\ - 目標修正
- \GET /api/admin/users\ - ユーザー一覧
- \POST /api/admin/users\ - ユーザー作成
- \POST /api/admin/users/:id/reset-password\ - パスワードリセット

詳細は \server.js\ を参照してください。

## PCが壊れた場合の対応

このアプリケーションは GitHub で管理されているため、別の PC で簡単に復旧できます：

### 復旧手順

1. 別の PC で Git と Node.js をインストール
2. 本リポジトリをクローン
3. セットアップ手順に従う
4. バックアップされたデータベース（MySQL）から復旧

本番環境では MySQL を使用しているため、データベースがサーバーに保存されており、PC が壊れてもデータが失われません。

## 開発時の注意事項

- コード修正後は必ず自分でテストしてから報告してください
- サーバー起動時は両ポート（3001 と 3000）が起動したか確認してください
- ユーザーに「起動してください」と指示しないで、自分で全確認を済ませてください

## トラブルシューティング

### ポート 3000 または 3001 が既に使用中の場合

別のポートを使用するか、既存プロセスを終了してください：

\\\ash
# Windows: ポート 3001 を使用しているプロセスを確認
netstat -ano | findstr :3001

# プロセスを終了
taskkill /PID <PID> /F
\\\

### npm install でエラーが出た場合

キャッシュをクリアして再実行：

\\\ash
npm cache clean --force
npm install
\\\

## ライセンス

内部用途のみ

## 連絡先

開発者：武 勇樹（yuki.takeshi@nextam.jp）
