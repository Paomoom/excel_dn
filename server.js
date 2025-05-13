const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'excel-draw-secret-key';
const SESSION_SECRET = process.env.SESSION_SECRET || 'excel-draw-session-secret';

// 检查环境并设置适当的路径
const isProd = process.env.NODE_ENV === 'production';
const DATA_DIR = isProd ? '/tmp/server-data' : path.join(__dirname, 'server-data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const USER_DATA_DIR = path.join(DATA_DIR, 'user_data');

fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(USER_DATA_DIR);

// 如果用户文件不存在，创建空文件
if (!fs.existsSync(USERS_FILE)) {
  fs.writeJsonSync(USERS_FILE, {});
}

// 中间件
app.use(cors({
  origin: isProd ? [/\.vercel\.app$/, /localhost/] : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: isProd, // 在生产环境中设置为true
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));

// 验证Token中间件
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }
  
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: '无效的令牌' });
  }
};

// 用户注册
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 验证用户名和密码是英文
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ message: '用户名只能包含英文字母、数字和下划线' });
    }
    
    // 读取现有用户
    const users = await fs.readJson(USERS_FILE);
    
    // 检查用户名是否已存在
    if (users[username]) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    // 存储新用户 (简单存储密码，生产环境应使用bcrypt等加密)
    users[username] = {
      password,
      createdAt: new Date().toISOString()
    };
    
    await fs.writeJson(USERS_FILE, users, { spaces: 2 });
    
    // 创建用户数据目录
    const userDir = path.join(USER_DATA_DIR, username);
    fs.ensureDirSync(userDir);
    
    // 创建用户模板和图表文件
    fs.writeJsonSync(path.join(userDir, 'templates.json'), [], { spaces: 2 });
    fs.writeJsonSync(path.join(userDir, 'charts.json'), [], { spaces: 2 });
    
    res.status(201).json({ message: '注册成功' });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 用户登录
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 读取用户数据
    const users = await fs.readJson(USERS_FILE);
    
    // 验证用户
    const user = users[username];
    if (!user || user.password !== password) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    // 创建JWT令牌
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    
    // 设置cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24小时
      sameSite: isProd ? 'none' : 'strict', // 跨站请求在生产环境使用none
      secure: isProd // 在生产环境中设置为true
    });
    
    res.json({ 
      message: '登录成功',
      user: { username },
      token 
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 用户登出
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: '登出成功' });
});

// 获取当前用户
app.get('/api/me', authenticateToken, (req, res) => {
  res.json({ user: { username: req.user.username } });
});

// 获取用户模板
app.get('/api/templates', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const templatesFile = path.join(USER_DATA_DIR, username, 'templates.json');
    
    if (!fs.existsSync(templatesFile)) {
      return res.json([]);
    }
    
    const templates = await fs.readJson(templatesFile);
    res.json(templates);
  } catch (error) {
    console.error('获取模板失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 保存用户模板
app.post('/api/templates', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const templatesFile = path.join(USER_DATA_DIR, username, 'templates.json');
    const templates = req.body;
    
    await fs.writeJson(templatesFile, templates, { spaces: 2 });
    res.json({ message: '模板保存成功' });
  } catch (error) {
    console.error('保存模板失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户锁定图表
app.get('/api/charts', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const chartsFile = path.join(USER_DATA_DIR, username, 'charts.json');
    
    if (!fs.existsSync(chartsFile)) {
      return res.json([]);
    }
    
    const charts = await fs.readJson(chartsFile);
    res.json(charts);
  } catch (error) {
    console.error('获取图表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 保存用户锁定图表
app.post('/api/charts', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const chartsFile = path.join(USER_DATA_DIR, username, 'charts.json');
    const charts = req.body;
    
    await fs.writeJson(chartsFile, charts, { spaces: 2 });
    res.json({ message: '图表保存成功' });
  } catch (error) {
    console.error('保存图表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// Vercel serverless需要导出应用实例
module.exports = app;

// 仅在非Vercel环境下启动服务器
if (!isProd) {
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
} 