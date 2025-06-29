const express = require('express');
const router = express.Router();
const db = require('../db');

// --- 用户管理 ---
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username, role, status FROM users');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('查询用户失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/users/:id/block', async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('UPDATE users SET status = ? WHERE id = ?', ['blocked', id]);
    res.json({ success: true, message: '用户已封禁' });
  } catch (err) {
    console.error('封禁用户失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/users/:id/unblock', async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('UPDATE users SET status = ? WHERE id = ?', ['active', id]);
    res.json({ success: true, message: '用户已解封' });
  } catch (err) {
    console.error('解封用户失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/users/:id', async (req, res) => {
  const id = req.params.id;
  const { username, role } = req.body;
  try {
    const [existingUsers] = await db.query('SELECT * FROM users WHERE username = ? AND id != ?', [username, id]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }
    await db.query(
      'UPDATE users SET username = ?, role = ? WHERE id = ?',
      [username, role, id]
    );
    res.json({ success: true, message: '用户信息已更新' });
  } catch (err) {
    console.error('更新用户失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/users/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: '用户已删除' });
  } catch (err) {
    console.error('删除用户失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// --- 评论管理 ---
router.get('/comments/all', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.username AS user, f.shop_name AS shop, c.content, c.create_time AS time, c.approved 
       FROM food_comment c
       JOIN wuhan_food f ON c.food_id = f.id
       ORDER BY c.create_time DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('查询评论失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/comments/:id/approve', async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('UPDATE food_comment SET approved = TRUE WHERE id = ?', [id]);
    res.json({ success: true, message: '评论已通过审核' });
  } catch (err) {
    console.error('审核评论失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/comments/:id/reject', async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('UPDATE food_comment SET approved = FALSE WHERE id = ?', [id]);
    res.json({ success: true, message: '评论已取消通过' });
  } catch (err) {
    console.error('取消通过评论失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// --- 商家管理 ---
router.get('/shops', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id, 
        shop_name AS name, 
        address, 
        category AS category, 
        status 
      FROM wuhan_food
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('查询商家失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/shops/:id/block', async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('UPDATE wuhan_food SET status = ? WHERE id = ?', ['blocked', id]);
    res.json({ success: true, message: '商家已封禁' });
  } catch (err) {
    console.error('封禁商家失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/shops/:id/unblock', async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('UPDATE wuhan_food SET status = ? WHERE id = ?', ['active', id]);
    res.json({ success: true, message: '商家已解封' });
  } catch (err) {
    console.error('解封商家失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/shops/:id', async (req, res) => {
  const id = req.params.id;
  const {
    shop_name,
    address,
    category,
    business_hours,
    min_people,
    max_people,
    min_price,
    max_price,
    recommend_level,
    specialty_dishes
  } = req.body;

  try {
    await db.query(
      `UPDATE wuhan_food 
       SET shop_name = ?, address = ?, category = ?, business_hours = ?, 
           min_people = ?, max_people = ?, min_price = ?, max_price = ?, 
           recommend_level = ?, specialty_dishes = ? 
       WHERE id = ?`,
      [
        shop_name,
        address,
        category,
        business_hours,
        min_people,
        max_people,
        min_price,
        max_price,
        recommend_level,
        specialty_dishes,
        id
      ]
    );
    res.json({ success: true, message: '商家信息已更新' });
  } catch (err) {
    console.error('更新商家失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;