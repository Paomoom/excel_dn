const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

// 确保数据目录存在
const dataDir = path.join(__dirname, 'data');
const userDataDir = path.join(dataDir, 'user_data');

// 创建必要的目录
fs.ensureDirSync(dataDir);
fs.ensureDirSync(userDataDir);

// 确保users.json文件存在
const usersFile = path.join(dataDir, 'users.json');
if (!fs.existsSync(usersFile)) {
  fs.writeJsonSync(usersFile, []);
}

console.log('启动Excel绘图应用...');

// 启动后端服务器
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true
});

// 启动前端开发服务器
const client = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true
});

// 处理进程关闭
process.on('SIGINT', () => {
  console.log('正在关闭服务...');
  server.kill();
  client.kill();
  process.exit();
});

console.log('服务已启动！');
console.log('前端运行在: http://localhost:3000');
console.log('后端API运行在: http://localhost:3001');
console.log('按Ctrl+C可停止所有服务'); 