// backend/controllers/userController.js
const db = require('../db');

exports.login = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ? AND password = ? AND role = ?',
      [username, password, role]
    );
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: '用户名、密码或角色错误' });
    }
    const user = users[0];
    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, message: '用户已被封禁，无法登录' });
    }
    res.json({
      success: true,
      message: '登录成功',
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

exports.register = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    await db.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, password, role]
    );
    res.json({ success: true, message: '注册成功' });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};