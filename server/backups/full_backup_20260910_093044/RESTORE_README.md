# バックアップ復元手順

**バックアップ作成日時:** 2026-09-10 09:30:44

## 📦 バックアップ内容

このバックアップには以下が含まれています：

1. **orders.db** - SQLiteデータベース（全ての案件データ）
2. **customerOrder_backup.json** - 顧客の並び順情報
3. **src/** - フロントエンドソースコード
4. **server.js** - バックエンドサーバーコード
5. **api.js** - API定義
6. **package.json / package-lock.json** - 依存パッケージ設定

## 🔄 復元手順

### 1. データベースの復元
```bash
# バックアップからorders.dbをコピー
Copy-Item -Path "full_backup_20260910_093044\orders.db" -Destination "C:\Users\yukit\resource-allocation-app\server\orders.db" -Force
```

### 2. 顧客並び順の復元
```bash
# customerOrder_backup.jsonをコピー
Copy-Item -Path "full_backup_20260910_093044\customerOrder_backup.json" -Destination "C:\Users\yukit\resource-allocation-app\server\customerOrder_backup.json" -Force
```

### 3. ソースコードの復元

#### フロントエンド
```bash
# src/フォルダ全体をコピー
Copy-Item -Path "full_backup_20260910_093044\src" -Destination "C:\Users\yukit\resource-allocation-app\src" -Recurse -Force
```

#### バックエンド
```bash
# server.js と api.js をコピー
Copy-Item -Path "full_backup_20260910_093044\server.js" -Destination "C:\Users\yukit\resource-allocation-app\server\server.js" -Force
Copy-Item -Path "full_backup_20260910_093044\api.js" -Destination "C:\Users\yukit\resource-allocation-app\src\api.js" -Force
```

### 4. 設定ファイルの復元
```bash
# package.json をコピー
Copy-Item -Path "full_backup_20260910_093044\package.json" -Destination "C:\Users\yukit\resource-allocation-app\package.json" -Force
Copy-Item -Path "full_backup_20260910_093044\package-lock.json" -Destination "C:\Users\yukit\resource-allocation-app\package-lock.json" -Force
```

### 5. アプリケーション再起動
```bash
# Node.js プロセスを停止して再起動
# サーバーとクライアントを再起動して完了
```

## 📝 バックアップの特徴

- **完全なデータベース状態** - 全案件、顧客順序、目標値が保含まれています
- **ソースコード整合性** - 最新の修正（受注日保持、背景クリックでモーダル閉鎖など）が含まれています
- **復元容易性** - PowerShell コマンドで簡単に復元可能

## ⚠️ 復元後の確認項目

- [ ] データベース接続確認
- [ ] 案件一覧が正しく表示されることを確認
- [ ] 顧客の並び順が正しいことを確認
- [ ] ダッシュボードが正常に動作することを確認
- [ ] 受注残管理タブで編集時に受注日が保持されることを確認
- [ ] ダッシュボードのモーダルが背景クリックで閉じることを確認

## 🆘 トラブルシューティング

### データベースが読み込めない場合
- orders.db ファイルが正しくコピーされているか確認
- サーバープロセスがデータベースファイルをロックしていないか確認

### ソースコードが反映されない場合
- キャッシュをクリアしてブラウザをリロード（Ctrl+Shift+R）
- Node.js サーバーを完全に再起動

### 顧客の並び順が復元されない場合
- customerOrder_backup.json が正しくコピーされているか確認
- React のローカルストレージをクリアして再度ロード

---

**最後の修正時刻:** 2026-09-10 09:30:44
**対応バージョン:** すべてのセクション移動、背景クリック機能、受注日保持機能を含む
