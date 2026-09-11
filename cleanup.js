// フロントエンド再起動
const nodeProcess = require('child_process');
nodeProcess.exec('pkill -f "npm start"', () => {
  setTimeout(() => {
    nodeProcess.spawn('npm', ['start'], { cwd: 'C:\\Users\\yukit\\resource-allocation-app', stdio: 'inherit' });
  }, 2000);
});
