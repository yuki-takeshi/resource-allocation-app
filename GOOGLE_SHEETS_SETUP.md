# Google Sheets バックエンド セットアップガイド

このアプリを Google Sheets をバックエンドとして使うようにセットアップするための手順書です。

---

## ステップ 1️⃣：Google Sheets を作成

1. [Google Sheets](https://sheets.google.com) にアクセス
2. **「新規」→「スプレッドシート」** をクリック
3. 名前を「リソースアロケーション管理」などに変更

---

## ステップ 2️⃣：シートを作成して列ヘッダーを設定

スプレッドシート内に **4つのシート** を作成します。

### シート 1: `Projects`（案件）

以下の列を作成：

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| id | name | customer | confidence | startMonth | duration | requiredManMonths | requiredSkills |

### シート 2: `Members`（メンバー）

| A | B |
|---|---|
| id | name |

### シート 3: `Allocation`（稼働率）

| A | B | C |
|---|---|---|
| memberId | month | rate |

### シート 4: `Skills`（スキル）

| A | B | C |
|---|---|---|
| memberId | skill | level |

---

## ステップ 3️⃣：Google Apps Script にコードを追加

1. スプレッドシート内で **「拡張機能」→「Apps Script」** をクリック
2. 表示された Script Editor タブで、既存のコードを全て削除
3. 以下のファイルの内容をコピー＆ペーストしてください：

```
C:\Users\yukit\resource-allocation-app\Code.gs
```

4. **保存** をクリック（Ctrl+S）

---

## ステップ 4️⃣：初期データを投入

1. Apps Script エディタで、**「実行」** というドロップダウンから **`setupInitialData`** を選択
2. **再生ボタン（▶️）** をクリック
3. 「認可が必要です」と出たら、Google アカウントで認可する
4. 実行ログに「初期データの投入が完了しました！」と表示されたら成功

※ スプレッドシートに自動的にサンプルデータが入ります

---

## ステップ 5️⃣：Web アプリとしてデプロイ

1. Apps Script エディタの左側で **「デプロイ」** をクリック
2. **「新しいデプロイ」** をクリック
3. **種類** で **「ウェブアプリ」** を選択
4. 以下を設定：
   - **説明**: 「リソースアロケーション管理 API」
   - **次のユーザーとして実行**: あなたの Google アカウント
   - **アクセスできるユーザー**: 「全員」（重要！）
5. **デプロイ** をクリック
6. 表示された URL をコピー（例：`https://script.google.com/macros/d/YOUR_SCRIPT_ID/userweb?v=VERSION`）

---

## ステップ 6️⃣：React アプリの設定を更新

1. テキストエディタで以下のファイルを開く：
```
C:\Users\yukit\resource-allocation-app\src\api.js
```

2. 先頭の `GAS_URL` の値を、ステップ 5️⃣ でコピーした URL に置き換える：

```javascript
// 変更前：
const GAS_URL = 'https://script.google.com/macros/d/YOUR_SCRIPT_ID/userweb';

// 変更後：
const GAS_URL = 'https://script.google.com/macros/d/YOUR_ACTUAL_SCRIPT_ID/userweb?v=YOUR_VERSION';
```

3. ファイルを保存

---

## ステップ 7️⃣：React アプリを起動

PowerShell で以下を実行：

```powershell
cd C:\Users\yukit\resource-allocation-app
npm start
```

ブラウザが自動的に `http://localhost:3000` で起動します。

---

## ✅ 動作確認

### 1. データ読み込み確認
ページが開いて、案件やメンバーが表示されれば OK

### 2. 案件の追加・削除
「案件パイプライン」タブで：
- 「新規案件を追加」ボタンで案件を追加
- スプレッシートに反映されることを確認

### 3. メンバー管理
「メンバー管理」タブで：
- メンバーを追加・削除
- スプレッドシートに反映されることを確認

### 4. 稼働率の編集
「要員稼働状況」タブで：
- 稼働率の数字をクリックして編集
- スプレッドシートの `Allocation` シートに反映されることを確認

### 5. スキルの編集
「スキルマップ」タブで：
- スキルレベルを 1～5 で変更
- スプレッドシートの `Skills` シートに反映されることを確認

---

## 🔧 トラブルシューティング

### エラー：「Cannot fetch from GAS_URL」
→ `src/api.js` の `GAS_URL` が正しいか確認してください

### エラー：「Access Denied」
→ デプロイ時に「アクセスできるユーザー：全員」が選択されているか確認してください

### スプレッドシートに反映されない
→ ブラウザの コンソール（F12）でエラーを確認してください

---

## 📝 使用例

### 案件を追加したい場合
1. 「案件パイプライン」タブで「新規案件を追加」
2. 案件情報を入力
3. 「保存」をクリック
4. Google Sheets の `Projects` シートに自動反映

### メンバーのスキルを追加したい場合
1. 「スキルマップ」タブでメンバーを選択
2. スキル行の ドロップダウンでレベルを変更
3. 自動的に Google Sheets の `Skills` シートに反映

---

## 🚀 本番環境への移行

このセットアップは**開発用**です。本番環境で使う場合：
- 複数ユーザーでの同時編集に対応（スプレッドシートの行ロック機能など）
- 認可方式を OAuth に変更
- データバージョニング機能を追加

など、の対応が必要になる場合があります。

---

質問や問題が発生した場合は、ブラウザのコンソール（F12）でエラーメッセージを確認してください。
