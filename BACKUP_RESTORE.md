# バックアップと復元手順

## 📋 概要

このドキュメントは、アプリケーションとデータの**完全なバックアップ・復元方法**を説明します。

---

## 1️⃣ バックアップの保存場所

### アプリケーションコード
- **GitHub**: https://github.com/yuki-takeshi/resource-allocation-app
  - すべてのコード（サーバー、フロントエンド、設定ファイル）がバージョン管理されています
  - `.gitignore` で `.env` と `orders.db` は除外（セキュリティ目的）

### データベース（SQLite）
- **ローカル**: `C:\Users\yukit\resource-allocation-app\backups\`
  - タイムスタンプ付きバックアップが自動保存されます
  - 例: `orders_2026-09-11_12-06-19.db`

---

## 2️⃣ 通常のバックアップ（日常運用）

### 自動バックアップの実行
毎日または定期的に、以下の PowerShell コマンドを実行してください：

```powershell
# Windows のタスクスケジューラで定期実行を推奨
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
Copy-Item -Path "C:\Users\yukit\resource-allocation-app\server\orders.db" `
          -Destination "C:\Users\yukit\resource-allocation-app\backups\orders_$timestamp.db" -Force
```

または、バッチファイルを使用：
```batch
@echo off
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a-%%b)
copy "C:\Users\yukit\resource-allocation-app\server\orders.db" "C:\Users\yukit\resource-allocation-app\backups\orders_%mydate%_%mytime%.db"
```

---

## 3️⃣ 緊急：PC 故障時の復元手順

### 別の PC でアプリケーションを復元する場合

#### ステップ 1: Git をインストール
```powershell
winget install Git.Git
```

#### ステップ 2: GitHub からコードをクローン
```powershell
cd C:\Users\[ユーザー名]
git clone https://github.com/yuki-takeshi/resource-allocation-app.git
cd resource-allocation-app
```

#### ステップ 3: 依存パッケージをインストール
```powershell
# フロントエンド
npm install

# バックエンド
cd server
npm install
cd ..
```

#### ステップ 4: 環境設定ファイル（.env）を作成
```powershell
# サーバーの .env を作成
# 内容は別途提供を受けてください
```

#### ステップ 5: バックアップから orders.db を復元
```powershell
# backups フォルダから最新の orders_*.db をコピー
Copy-Item -Path "backups\orders_2026-09-11_12-06-19.db" `
          -Destination "server\orders.db" -Force
```

#### ステップ 6: アプリケーション起動
```powershell
# ターミナル 1: バックエンド起動
cd server
npm start

# ターミナル 2: フロントエンド起動
npm start
```

---

## 4️⃣ MySQL への移行後のバックアップ

MySQL に移行後は、以下の方法でバックアップしてください：

### MySQL のダンプ
```bash
mysqldump -h 124.248.147.181 -u mqmanage -p mqmanagedb > mqmanagedb_backup_$(date +%Y%m%d_%H%M%S).sql
```

### バックアップの復元
```bash
mysql -h 124.248.147.181 -u mqmanage -p mqmanagedb < mqmanagedb_backup_20260911_120619.sql
```

---

## 5️⃣ チェックリスト：復元後の確認

- [ ] Git がインストールされている
- [ ] コードが `C:\Users\[ユーザー名]\resource-allocation-app` にクローンされている
- [ ] `npm install` が正常に完了した
- [ ] `.env` ファイルが正しく設定されている
- [ ] `server\orders.db` が復元されている
- [ ] バックエンド（ポート 3001）が起動している
- [ ] フロントエンド（ポート 3000）が起動している
- [ ] ブラウザで `http://localhost:3000` にアクセスでき、データが表示されている

---

## 🚨 重要なポイント

1. **GitHub は「コードの完全バージョン管理」** → コード自体は常に復元可能
2. **backups フォルダは「データの時系列保存」** → データ消失から保護
3. **両方が揃って初めて「完全復旧が可能」**

---

## 📞 サポート

復元に失敗した場合は、以下を確認してください：

1. Git がインストールされているか
   ```powershell
   git --version
   ```

2. npm がインストールされているか
   ```powershell
   npm --version
   ```

3. バックアップファイルが存在するか
   ```powershell
   Get-ChildItem C:\Users\yukit\resource-allocation-app\backups
   ```

4. .env ファイルが正しく設定されているか
   ```powershell
   Get-Content C:\Users\yukit\resource-allocation-app\server\.env
   ```

---

**最終更新**: 2026-09-11
