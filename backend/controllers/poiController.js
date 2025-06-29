const db = require('../db');

// 获取所有 POI
async function getAllPOIs(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT
       id, shop_name, category, region,
       min_people, max_people,
       min_price, max_price,
       business_hours,
       longitude, latitude
      FROM wuhan_food
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('获取所有 POI 失败:', error);
    res.status(500).json({ success: false, error: '数据库查询失败' });
  }
}

// 随机获取一个 POI
async function randomPOI(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM wuhan_food WHERE status = ? ORDER BY RAND() LIMIT 1', ['active']);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: '没有可供随机抽取的餐馆' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('随机抽取 POI 错误：', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
}

// 搜索 POI
async function searchPOIs(req, res) {
  try {
    const {
      shop_name, category, region, business_hours, cuisine_type,
      min_people, max_people, min_price, max_price, recommend_level, id
    } = req.query;

    let sql = 'SELECT * FROM wuhan_food WHERE status = ?';
    const params = ['active'];

    if (shop_name) {
      sql += ' AND shop_name LIKE ?';
      params.push(`%${shop_name}%`);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (region) {
      sql += ' AND region = ?';
      params.push(region);
    }
    if (business_hours) {
      let keyword = '';
      if (business_hours === '早餐') keyword = '早';
      else if (business_hours === '午餐') keyword = '午';
      else if (business_hours === '晚餐') keyword = '晚';
      else if (business_hours === '夜宵') keyword = '夜';
      if (keyword) {
        sql += ' AND business_hours LIKE ?';
        params.push(`%${keyword}%`);
      }
    }
    if (cuisine_type) {
      sql += ' AND cuisine_type LIKE ?';
      params.push(`%${cuisine_type}%`);
    }
    if (min_people) {
      sql += ' AND (min_people <= ? + 1)';
      params.push(min_people);
    }
    if (max_people) {
      sql += ' AND (max_people >= ? - 1)';
      params.push(max_people);
    }
    if (min_price) {
      sql += ' AND (min_price <= ? + 10)';
      params.push(min_price);
    }
    if (max_price) {
      sql += ' AND (max_price >= ? - 10)';
      params.push(max_price);
    }
    if (recommend_level) {
      sql += ' AND recommend_level LIKE ?';
      params.push(`%${recommend_level}%`);
    }
    if (id) {
      sql += ' AND id = ?';
      params.push(id);
    }

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('搜索 POI 失败:', err);
    res.status(500).json({ success: false, error: '数据库查询错误' });
  }
}

// 获取评论（包含回复，仅返回 approved = 1 的评论和回复）
async function getComments(req, res) {
  try {
    const { foodId } = req.params;
    const [comments] = await db.query(
      `SELECT id, username, rating, content, create_time, parent_id, approved
       FROM food_comment 
       WHERE food_id = ? AND approved = TRUE
       ORDER BY parent_id ASC, create_time DESC`,
      [foodId]
    );
    // 构建评论树：将回复附加到对应的父评论
    const commentTree = [];
    const commentMap = {};

    comments.forEach(comment => {
      comment.replies = [];
      commentMap[comment.id] = comment;
      if (!comment.parent_id) {
        commentTree.push(comment);
      } else {
        if (commentMap[comment.parent_id]) {
          commentMap[comment.parent_id].replies.push(comment);
        }
      }
    });

    res.json({ success: true, data: commentTree });
  } catch (err) {
    console.error('获取评论失败:', err);
    res.status(500).json({ success: false, error: '获取评论失败' });
  }
}

// 添加评论
async function addComment(req, res) {
  try {
    const { food_id, username, rating, content } = req.body;
    await db.query(
      'INSERT INTO food_comment (food_id, username, rating, content, approved) VALUES (?, ?, ?, ?, FALSE)',
      [food_id, username, rating, content]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('添加评论失败:', err);
    res.status(500).json({ success: false, error: '添加评论失败' });
  }
}

// 商家回复评论
async function replyComment(req, res) {
  try {
    const { foodId } = req.params;
    const { parent_id, username, content } = req.body;

    // 验证店铺是否属于该用户
    const [shops] = await db.query(
      'SELECT updater FROM wuhan_food WHERE id = ?',
      [foodId]
    );
    if (shops.length === 0) {
      return res.status(404).json({ success: false, error: '店铺不存在' });
    }
    if (shops[0].updater !== username) {
      return res.status(403).json({ success: false, error: '无权回复此店铺的评论' });
    }

    // 验证父评论是否存在
    const [parentComments] = await db.query(
      'SELECT id FROM food_comment WHERE id = ? AND food_id = ?',
      [parent_id, foodId]
    );
    if (parentComments.length === 0) {
      return res.status(404).json({ success: false, error: '父评论不存在' });
    }

    await db.query(
      'INSERT INTO food_comment (food_id, username, content, parent_id, approved) VALUES (?, ?, ?, ?, TRUE)',
      [foodId, username, content, parent_id]
    );
    res.json({ success: true, message: '回复成功' });
  } catch (err) {
    console.error('回复评论失败:', err);
    res.status(500).json({ success: false, error: '回复评论失败' });
  }
}

// 用户回复评论
async function addUserReply(req, res) {
  try {
    const { foodId } = req.params;
    const { parent_id, username, content } = req.body;

    // 验证父评论是否存在
    const [parentComments] = await db.query(
      'SELECT id FROM food_comment WHERE id = ? AND food_id = ?',
      [parent_id, foodId]
    );
    if (parentComments.length === 0) {
      return res.status(404).json({ success: false, error: '父评论不存在' });
    }

    await db.query(
      'INSERT INTO food_comment (food_id, username, content, parent_id, approved) VALUES (?, ?, ?, ?, FALSE)',
      [foodId, username, content, parent_id]
    );
    res.json({ success: true, message: '回复提交成功，待审核' });
  } catch (err) {
    console.error('用户回复评论失败:', err);
    res.status(500).json({ success: false, error: '回复评论失败' });
  }
}

// 增加点击量
async function incrementClick(req, res) {
  try {
    const { foodId } = req.params;
    await db.query(
      'UPDATE wuhan_food SET click_count = click_count + 1 WHERE id = ?',
      [foodId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('记录点击失败:', err);
    res.status(500).json({ success: false, error: '记录点击失败' });
  }
}

// 获取排行榜
async function getRanking(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const perPage = 10;
    const offset = (page - 1) * perPage;

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM wuhan_food'
    );
    const [rows] = await db.query(
      'SELECT id, shop_name, category, region, longitude, latitude, click_count ' +
      'FROM wuhan_food ' +
      'ORDER BY click_count DESC, id ASC ' +
      'LIMIT ? OFFSET ?',
      [perPage, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: { total, page, perPage }
    });
  } catch (err) {
    console.error('获取排行榜失败:', err);
    res.status(500).json({ success: false, error: '获取排行榜失败' });
  }
}

// 获取商家自己的店铺信息
async function getShopByUser(req, res) {
  try {
    const { username } = req.params;
    const [rows] = await db.query(
      `SELECT 
        id, shop_name, category, region, address, 
        business_hours, cuisine_type, specialty_dishes, 
        min_people, max_people, min_price, max_price, 
        recommend_level, longitude, latitude, click_count 
       FROM wuhan_food 
       WHERE updater = ? AND status = ?`,
      [username, 'active']
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('获取商家店铺失败:', err);
    res.status(500).json({ success: false, error: '数据库查询失败' });
  }
}

// 更新商家自己的店铺信息
async function updateShopByUser(req, res) {
  const { id } = req.params;
  const {
    shop_name, address, category, region, business_hours, cuisine_type,
    specialty_dishes, min_people, max_people, min_price, max_price, recommend_level, updater
  } = req.body;

  try {
    // 验证店铺是否属于该用户
    const [shops] = await db.query(
      'SELECT updater FROM wuhan_food WHERE id = ?',
      [id]
    );
    if (shops.length === 0) {
      return res.status(404).json({ success: false, error: '店铺不存在' });
    }
    if (shops[0].updater !== updater) {
      return res.status(403).json({ success: false, error: '无权编辑此店铺' });
    }

    await db.query(
      `UPDATE wuhan_food 
       SET shop_name = ?, address = ?, category = ?, region = ?, 
           business_hours = ?, cuisine_type = ?, specialty_dishes = ?, 
           min_people = ?, max_people = ?, min_price = ?, 
           max_price = ?, recommend_level = ?, update_time = CURDATE()
       WHERE id = ?`,
      [
        shop_name, address, category, region, business_hours || null,
        cuisine_type || null, specialty_dishes || null,
        min_people ? parseInt(min_people) : null,
        max_people ? parseInt(max_people) : null,
        min_price ? parseFloat(min_price) : null,
        max_price ? parseFloat(max_price) : null,
        recommend_level || null, id
      ]
    );
    res.json({ success: true, message: '店铺信息已更新' });
  } catch (err) {
    console.error('更新店铺失败:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
}

// 新增店铺
async function addShopByUser(req, res) {
  const {
    shop_name, address, category, region, business_hours, cuisine_type,
    specialty_dishes, min_people, max_people, min_price, max_price, updater
  } = req.body;

  // 验证必填字段
  if (!shop_name || !address || !category || !region || !updater) {
    return res.status(400).json({ success: false, error: '店铺名称、地址、分类、地区和创建者为必填字段' });
  }

  // 验证 category、region 和 business_hours 的有效性
  const validCategories = ['五谷杂粮', '早餐', '烧烤', '面包甜点'];
  const validRegions = ['武昌', '汉口', '汉阳', '青山', '蔡甸', '硚口', '江夏'];
  const validBusinessHours = ['早餐', '午餐', '晚餐', '夜宵'];

  if (!validCategories.includes(category)) {
    return res.status(400).json({ success: false, error: '无效的分类' });
  }
  if (!validRegions.includes(region)) {
    return res.status(400).json({ success: false, error: '无效的地区' });
  }
  if (business_hours && !validBusinessHours.includes(business_hours)) {
    return res.status(400).json({ success: false, error: '无效的营业时段' });
  }

  try {
    // 检查店铺名称是否已存在
    const [existingShops] = await db.query(
      'SELECT id FROM wuhan_food WHERE shop_name = ?',
      [shop_name]
    );
    if (existingShops.length > 0) {
      return res.status(400).json({ success: false, error: '店铺名称已存在' });
    }

    // 插入新店铺
    await db.query(
      `INSERT INTO wuhan_food (
        shop_name, address, category, region, business_hours, cuisine_type,
        specialty_dishes, min_people, max_people, min_price, max_price,
        updater, update_time, status, click_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'active', 0)`,
      [
        shop_name, address, category, region, business_hours || null,
        cuisine_type || null, specialty_dishes || null,
        min_people ? parseInt(min_people) : null,
        max_people ? parseInt(max_people) : null,
        min_price ? parseFloat(min_price) : null,
        max_price ? parseFloat(max_price) : null,
        updater
      ]
    );
    res.json({ success: true, message: '店铺添加成功' });
  } catch (err) {
    console.error('添加店铺失败:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
}

module.exports = {
  getAllPOIs, searchPOIs, randomPOI, getComments, addComment, replyComment, addUserReply,
  incrementClick, getRanking, getShopByUser, updateShopByUser, addShopByUser
};