const SPREADSHEET_ID = '1M4NCBYlbuTnNXYForK6cCCxPyjlG7df8o4Rkbetz3K8';
const ORDERS_SHEET = 'Orders';
const TARGETS_SHEET = 'Targets';
const LOG_SHEET = 'Log';

function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .addHeader('Access-Control-Allow-Origin', '*')
    .addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .addHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// 初期化スクリプト（初回実行時のみ実行してください）
function initializeSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Orders シート作成
  let ordersSheet = ss.getSheetByName(ORDERS_SHEET);
  if (!ordersSheet) {
    ordersSheet = ss.insertSheet(ORDERS_SHEET);
  } else {
    ordersSheet.clearContents();
  }
  ordersSheet.appendRow(['id', 'name', 'customer', 'amount', 'orderDate', 'deliveryMonth', 'department', 'rank', 'remarks']);

  // Targets シート作成
  let targetsSheet = ss.getSheetByName(TARGETS_SHEET);
  if (!targetsSheet) {
    targetsSheet = ss.insertSheet(TARGETS_SHEET);
  } else {
    targetsSheet.clearContents();
  }
  targetsSheet.appendRow(['month', 'target']);

  // Log シート作成
  let logSheet = ss.getSheetByName(LOG_SHEET);
  if (!logSheet) {
    logSheet = ss.insertSheet(LOG_SHEET);
  } else {
    logSheet.clearContents();
  }
  logSheet.appendRow(['id', 'timestamp', 'message', 'type']);

  Logger.log('✓ シートの初期化が完了しました');
}

function doGet(e) {
  const action = e.parameter.action;

  try {
    const response = (() => {
      switch (action) {
        case 'getOrders':
          return getOrders();
        case 'getTargets':
          return getTargets();
        case 'getLog':
          return getLog();
        default:
          return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' }))
            .setMimeType(ContentService.MimeType.JSON);
      }
    })();

    return response.addHeader('Access-Control-Allow-Origin', '*')
      .addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .addHeader('Access-Control-Allow-Headers', 'Content-Type');
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader('Access-Control-Allow-Origin', '*');
  }
}

function doPost(e) {
  const action = e.parameter.action;
  const payload = JSON.parse(e.postData.contents);

  try {
    const response = (() => {
      switch (action) {
        case 'saveOrder':
          return saveOrder(payload);
        case 'deleteOrder':
          return deleteOrder(payload.id);
        case 'saveTarget':
          return saveTarget(payload.month, payload.target);
        case 'deleteTarget':
          return deleteTarget(payload.month);
        case 'saveLog':
          return saveLog(payload.id, payload.timestamp, payload.message, payload.type);
        default:
          return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' }))
            .setMimeType(ContentService.MimeType.JSON);
      }
    })();

    return response.addHeader('Access-Control-Allow-Origin', '*')
      .addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .addHeader('Access-Control-Allow-Headers', 'Content-Type');
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader('Access-Control-Allow-Origin', '*');
  }
}

function getOrders() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ORDERS_SHEET);
  const data = sheet.getDataRange().getValues();

  const orders = [];
  // Row 1 はヘッダー、Row 2以降がデータ
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // IDがあるかチェック
      orders.push({
        id: row[0],
        name: row[1],
        customer: row[2],
        amount: row[3],
        orderDate: row[4],
        deliveryMonth: row[5],
        department: row[6],
        rank: row[7],
        remarks: row[8] || ''
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify(orders))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveOrder(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ORDERS_SHEET);
  const data = sheet.getDataRange().getValues();

  const orderId = payload.id;
  let found = false;

  // 既存の行を探す
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === orderId) {
      // 既存行を更新
      sheet.getRange(i + 1, 1, 1, 9).setValues([[
        orderId,
        payload.name,
        payload.customer,
        payload.amount,
        payload.orderDate,
        payload.deliveryMonth,
        payload.department,
        payload.rank,
        payload.remarks || ''
      ]]);
      found = true;
      break;
    }
  }

  if (!found) {
    // 新規行を追加
    sheet.appendRow([
      orderId,
      payload.name,
      payload.customer,
      payload.amount,
      payload.orderDate,
      payload.deliveryMonth,
      payload.department,
      payload.rank,
      payload.remarks || ''
    ]);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true, id: orderId }))
    .setMimeType(ContentService.MimeType.JSON);
}

function deleteOrder(orderId) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ORDERS_SHEET);
  const data = sheet.getDataRange().getValues();

  // 対象行を探して削除
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === orderId) {
      sheet.deleteRow(i + 1);
      break;
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getTargets() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TARGETS_SHEET);
  const data = sheet.getDataRange().getValues();

  const targets = {};
  // Row 1 はヘッダー、Row 2以降がデータ
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // 月がある場合
      targets[row[0]] = row[1];
    }
  }

  return ContentService.createTextOutput(JSON.stringify(targets))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveTarget(month, targetAmount) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TARGETS_SHEET);
  const data = sheet.getDataRange().getValues();

  let found = false;

  // 既存の行を探す
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === month) {
      // 既存行を更新
      sheet.getRange(i + 1, 1, 1, 2).setValues([[month, targetAmount]]);
      found = true;
      break;
    }
  }

  if (!found) {
    // 新規行を追加
    sheet.appendRow([month, targetAmount]);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function deleteTarget(month) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TARGETS_SHEET);
  const data = sheet.getDataRange().getValues();

  // 対象行を探して削除
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === month) {
      sheet.deleteRow(i + 1);
      break;
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getLog() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LOG_SHEET);
  const data = sheet.getDataRange().getValues();

  const logs = [];
  // Row 1 はヘッダー、Row 2以降がデータ
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // IDがあるかチェック
      logs.push({
        id: row[0],
        timestamp: row[1],
        message: row[2],
        type: row[3]
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify(logs))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveLog(logId, timestamp, message, type) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LOG_SHEET);

  // ログは追記のみ
  sheet.appendRow([logId, timestamp, message, type]);

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
