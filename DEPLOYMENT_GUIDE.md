# 本番環境への展開ガイド

## 📋 概要

SQLite から MySQL への完全な移行が完了しました。本番環境への展開手順を説明します。

---

## ✅ 完了済みの作業

- ✅ MySQL データベースにすべてのデータを移行
  - Orders: 446 件
  - Targets: 7 件
  - Account Planning Categories: 7 件
  - Account Planning Accounts: 27 件
- ✅ SQLite バックアップを backups フォルダに保存
- ✅ GitHub にコード完全バックアップ
- ✅ ローカルで MySQL 接続テスト完了

---

## 🚀 本番環境展開手順

### **1. 前提条件**

- Node.js 16 以上がインストールされていること
- npm または yarn がインストールされていること
- 社内ネットワークから MySQL（124.248.147.181:3306）に接続可能であること
- VPN 経由でのアクセスの場合は、VPN に接続していること

### **2. アプリケーションの配置**

**社内サーバー側での設定：**

```bash
# 社内サーバーのホームディレクトリに配置
cd /var/www  # または適切なディレクトリ
git clone https://github.com/yuki-takeshi/resource-allocation-app.git
cd resource-allocation-app
```

### **3. 環境変数の設定**

**server/.env を作成:**

```
# Google API Key (既存のものを使用)
GOOGLE_API_KEY=AIzaSyCVB2y5L0QgHOIfsxkhTBl-33gHiqvwHWc

# Server Port
PORT=3001

# Database Configuration
DATABASE_TYPE=mysql

# MySQL Configuration (Production)
MYSQL_HOST=124.248.147.181
MYSQL_PORT=3306
MYSQL_USER=mqmanage          # 社内ネットワーク用ユーザー
MYSQL_PASSWORD=7RX=%q3MP85t
MYSQL_DATABASE=mqmanagedb

# VPN 経由の場合は以下を使用：
# MYSQL_USER=mqmanageout
# MYSQL_PASSWORD=ePX%7%p!5&GV
```

### **4. 依存パッケージのインストール**

```bash
# フロントエンド
npm install

# バックエンド
cd server
npm install
cd ..
```

### **5. サーバー起動**

**バックエンド起動（ポート 3001）:**

```bash
cd server
npm start
```

**フロントエンド起動（ポート 3000）- 別のターミナル:**

```bash
npm start
```

### **6. アクセス確認**

- **ローカルアクセス**: http://localhost:3000
- **ネットワークアクセス**: http://<server-ip>:3000

---

## 🔄 データベース接続確認

**MySQL への接続テスト:**

```bash
node -e "
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: '124.248.147.181',
  user: 'mqmanage',
  password: '7RX=%q3MP85t',
  database: 'mqmanagedb'
});

pool.getConnection().then(conn => {
  console.log('✅ MySQL 接続成功');
  conn.release();
  process.exit(0);
}).catch(err => {
  console.error('❌ MySQL 接続失敗:', err.message);
  process.exit(1);
});
"
```

---

## 📊 本番環境チェックリスト

- [ ] Node.js がインストール済みか確認
- [ ] npm install が正常に完了したか確認
- [ ] .env ファイルが正しく設定されているか確認
- [ ] MySQL への接続テストが成功したか確認
- [ ] バックエンド（ポート 3001）が起動したか確認
- [ ] フロントエンド（ポート 3000）が起動したか確認
- [ ] ブラウザでアクセスできるか確認
- [ ] 管理画面でデータが表示されるか確認

---

## 🆘 トラブルシューティング

### **MySQL 接続失敗**

```
Error: Access denied for user 'mqmanage'@'...'
```

**対策：**
1. VPN が接続されているか確認
2. ユーザー名とパスワードが正しいか確認
3. ファイアウォールポート 3306 が開いているか確認

### **ポートが既に使用されている**

```
Error: listen EADDRINUSE: address already in use :::3001
```

**対策：**
```bash
lsof -i :3001  # ポート 3001 を使用しているプロセスを確認
kill -9 <PID>  # プロセスを終了
```

### **モジュールが見つからない**

```
Error: Cannot find module 'mysql2'
```

**対策：**
```bash
cd server
npm install mysql2
```

---

## 📈 パフォーマンス最適化

### **本番環境での推奨設定**

1. **PM2 でプロセス管理**
```bash
npm install -g pm2
pm2 start server.js --name "resource-allocation-app"
pm2 save
pm2 startup
```

2. **Nginx をリバースプロキシとして使用**
```nginx
upstream app {
    server localhost:3001;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

3. **HTTPS 設定**
```bash
# Let's Encrypt で無料 SSL 証明書を取得
sudo apt install certbot
sudo certbot certonly --webroot -w /var/www/app -d your-domain.com
```

---

## 🔐 セキュリティチェックリスト

- [ ] .env ファイルが .gitignore に含まれているか確認
- [ ] データベース パスワードが環境変数で管理されているか確認
- [ ] HTTPS が設定されているか確認
- [ ] ファイアウォールルールが正しいか確認
- [ ] 定期的なバックアップスケジュールが設定されているか確認

---

## 💾 バックアップ戦略

**本番環境での MySQL バックアップ:**

```bash
# 定期的なバックアップスクリプト（cron で実行）
#!/bin/bash
BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)

mysqldump -h 124.248.147.181 -u mqmanage -p'7RX=%q3MP85t' \
  mqmanagedb > $BACKUP_DIR/mqmanagedb_$DATE.sql

# 7日以上前のバックアップを削除
find $BACKUP_DIR -name "mqmanagedb_*.sql" -mtime +7 -delete
```

crontab 設定（毎日 2:00 AM にバックアップ）：
```
0 2 * * * /backup/scripts/backup.sh
```

---

## 📞 サポート連絡先

問題が発生した場合は、以下を確認してください：

1. GitHub ページ: https://github.com/yuki-takeshi/resource-allocation-app
2. BACKUP_RESTORE.md: 復旧手順
3. README.md: セットアップガイド

---

**最終更新**: 2026-09-11
**マイグレーション完了日**: 2026-09-11
**バージョン**: MySQL Production
