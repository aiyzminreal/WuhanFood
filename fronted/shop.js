const API_BASE = 'http://localhost:3001/api';

// 获取当前登录的用户名
const username = localStorage.getItem('username');
if (!username) {
  alert('请先登录');
  window.location.href = 'login.html';
}

// 加载商家的店铺信息
async function fetchShops() {
  try {
    const res = await fetch(`${API_BASE}/poi/shop/${encodeURIComponent(username)}`);
    const json = await res.json();
    if (!json.success) {
      alert('加载店铺失败: ' + json.error);
      return;
    }
    const tbody = document.getElementById('shop-table-body');
    tbody.innerHTML = '';
    if (json.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">暂无店铺</td></tr>';
      return;
    }
    json.data.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.id}</td>
        <td>${s.shop_name}</td>
        <td>${s.address}</td>
        <td>${s.category}</td>
        <td>${s.click_count}</td>
        <td>
          <button class="action-btn" onclick="editShop(${s.id})">编辑</button>
          <button class="action-btn" onclick="viewComments(${s.id})">查看评论</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('加载店铺失败:', err);
    alert('加载店铺失败: 网络错误');
  }
}

// 打开添加店铺模态框
function openAddShopModal() {
  document.getElementById('add-shop-form').reset();
  document.getElementById('add-shop-modal').style.display = 'block';
}

// 关闭添加模态框
function closeAddModal() {
  document.getElementById('add-shop-modal').style.display = 'none';
}

// 编辑店铺
async function editShop(id) {
  try {
    const res = await fetch(`${API_BASE}/poi/search?id=${id}`);
    const json = await res.json();
    if (!json.success || json.data.length === 0) {
      alert('无法加载店铺信息');
      return;
    }
    const shop = json.data[0];

    document.getElementById('edit-shop-id').value = shop.id;
    document.getElementById('edit-shop-name').value = shop.shop_name || '';
    document.getElementById('edit-address').value = shop.address || '';
    document.getElementById('edit-category').value = shop.category || '';
    document.getElementById('edit-region').value = shop.region || '';
    document.getElementById('edit-business-hours').value = shop.business_hours || '';
    document.getElementById('edit-cuisine-type').value = shop.cuisine_type || '';
    document.getElementById('edit-specialty-dishes').value = shop.specialty_dishes || '';
    document.getElementById('edit-min-people').value = shop.min_people || '';
    document.getElementById('edit-max-people').value = shop.max_people || '';
    document.getElementById('edit-min-price').value = shop.min_price || '';
    document.getElementById('edit-max-price').value = shop.max_price || '';
    document.getElementById('edit-recommend-level').value = shop.recommend_level || '';

    document.getElementById('edit-shop-modal').style.display = 'block';
  } catch (err) {
    console.error('加载店铺信息失败:', err);
    alert('无法加载店铺信息: 网络错误');
  }
}

// 关闭编辑模态框
function closeEditModal() {
  document.getElementById('edit-shop-modal').style.display = 'none';
}

// 查看评论
async function viewComments(foodId) {
  try {
    const res = await fetch(`${API_BASE}/poi/${foodId}/comments`);
    const json = await res.json();
    if (!json.success) {
      alert('加载评论失败: ' + json.error);
      return;
    }
    const commentList = document.getElementById('comment-list');
    commentList.innerHTML = '';
    if (json.data.length === 0) {
      commentList.innerHTML = '<p>暂无评论</p>';
    } else {
      json.data.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        commentDiv.innerHTML = `
          <p><strong>${comment.username}</strong> (${new Date(comment.create_time).toLocaleString()})</p>
          ${comment.rating ? `<p>评分：${'★'.repeat(comment.rating)}</p>` : ''}
          <p>${comment.content}</p>
          ${!comment.parent_id ? `
            <form class="reply-form" data-comment-id="${comment.id}">
              <textarea class="reply-content" placeholder="输入回复..." required></textarea>
              <button type="submit">回复</button>
            </form>
          ` : ''}
        `;
        // 添加回复
        comment.replies.forEach(reply => {
          const replyDiv = document.createElement('div');
          replyDiv.className = 'reply';
          replyDiv.innerHTML = `
            <p><strong>${reply.username}</strong> (${new Date(reply.create_time).toLocaleString()}) 回复:</p>
            <p>${reply.content}</p>
          `;
          commentDiv.appendChild(replyDiv);
        });
        commentList.appendChild(commentDiv);
      });
    }

    // 绑定回复表单的事件
    document.querySelectorAll('.reply-form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const commentId = form.getAttribute('data-comment-id');
        const content = form.querySelector('.reply-content').value.trim();
        if (!content) {
          alert('回复内容不能为空');
          return;
        }
        try {
          const res = await fetch(`${API_BASE}/poi/${foodId}/comments/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parent_id: commentId, username, content })
          });
          const json = await res.json();
          if (json.success) {
            alert('回复成功');
            viewComments(foodId); // 刷新评论列表
          } else {
            alert('回复失败: ' + json.error);
          }
        } catch (err) {
          console.error('回复评论失败:', err);
          alert('回复失败: 网络错误');
        }
      });
    });

    document.getElementById('comment-modal').style.display = 'block';
  } catch (err) {
    console.error('加载评论失败:', err);
    alert('加载评论失败: 网络错误');
  }
}

// 关闭评论模态框
function closeCommentModal() {
  document.getElementById('comment-modal').style.display = 'none';
}

// 提交添加店铺表单
document.getElementById('add-shop-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const shop_name = document.getElementById('add-shop-name').value.trim();
  const address = document.getElementById('add-address').value.trim();
  const category = document.getElementById('add-category').value;
  const region = document.getElementById('add-region').value;
  const business_hours = document.getElementById('add-business-hours').value;
  const cuisine_type = document.getElementById('add-cuisine-type').value.trim();
  const specialty_dishes = document.getElementById('add-specialty-dishes').value.trim();
  const min_people = document.getElementById('add-min-people').value;
  const max_people = document.getElementById('add-max-people').value;
  const min_price = document.getElementById('add-min-price').value;
  const max_price = document.getElementById('add-max-price').value;

  if (!shop_name || !address || !category || !region) {
    alert('店铺名称、地址、分类和地区不能为空');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/poi/shop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_name, address, category, region, business_hours,
        cuisine_type, specialty_dishes,
        min_people: min_people ? parseInt(min_people) : null,
        max_people: max_people ? parseInt(max_people) : null,
        min_price: min_price ? parseFloat(min_price) : null,
        max_price: max_price ? parseFloat(max_price) : null,
        updater: username
      })
    });
    const json = await res.json();
    if (json.success) {
      alert('店铺添加成功');
      closeAddModal();
      fetchShops();
    } else {
      alert('添加失败: ' + json.error);
    }
  } catch (err) {
    console.error('添加店铺失败:', err);
    alert('添加失败: 网络错误');
  }
});

// 提交编辑店铺表单
document.getElementById('edit-shop-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-shop-id').value;
  const shop_name = document.getElementById('edit-shop-name').value.trim();
  const address = document.getElementById('edit-address').value.trim();
  const category = document.getElementById('edit-category').value;
  const region = document.getElementById('edit-region').value;
  const business_hours = document.getElementById('edit-business-hours').value;
  const cuisine_type = document.getElementById('edit-cuisine-type').value.trim();
  const specialty_dishes = document.getElementById('edit-specialty-dishes').value.trim();
  const min_people = document.getElementById('edit-min-people').value;
  const max_people = document.getElementById('edit-max-people').value;
  const min_price = document.getElementById('edit-min-price').value;
  const max_price = document.getElementById('edit-max-price').value;
  const recommend_level = document.getElementById('edit-recommend-level').value.trim();

  if (!shop_name || !address || !category || !region) {
    alert('店铺名称、地址、分类和地区不能为空');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/poi/shop/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_name, address, category, region, business_hours,
        cuisine_type, specialty_dishes,
        min_people: min_people ? parseInt(min_people) : null,
        max_people: max_people ? parseInt(max_people) : null,
        min_price: min_price ? parseFloat(min_price) : null,
        max_price: max_price ? parseFloat(max_price) : null,
        recommend_level, updater: username
      })
    });
    const json = await res.json();
    if (json.success) {
      alert('店铺信息已更新');
      closeEditModal();
      fetchShops();
    } else {
      alert('更新失败: ' + json.error);
    }
  } catch (err) {
    console.error('更新店铺失败:', err);
    alert('更新失败: 网络错误');
  }
});

// 初始化页面
document.addEventListener('DOMContentLoaded', fetchShops);