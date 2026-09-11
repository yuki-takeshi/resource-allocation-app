#!/usr/bin/env node
// シンプルなサーバー起動スクリプト（PowerShell 不要）

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 サーバーを起動します...\n');

const serverDir = path.join(__dirname);
const npmProcess = spawn('npm', ['start'], {
  cwd: serverDir,
  stdio: 'inherit',
  shell: true
});

npmProcess.on('error', (error) => {
  console.error('❌ エラー:', error);
  process.exit(1);
});

npmProcess.on('close', (code) => {
  console.log(`プロセス終了: コード ${code}`);
  process.exit(code);
});
