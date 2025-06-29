const API_BASE = 'http://localhost:3001/api/admin';

// tab切换
const tabs = {
  users: document.getElementById('tab-users'),
  comments: document.getElementById('tab-comments'),
  shops: document.getElementById('tab-shops'),
};
const panels = {
  users: document.getElementById('panel-users'),
  comments: document.getElementById('panel-comments'),
  shops: document.getElementById('panel-shops'),
};

function showPanel(name) {
  for (const key in panels) {
    panels[key].style.display = (key === name) ? 'block' : 'none';
    tabs[key].classList.toggle('active', key === name);
  }
  if (name === 'users') fetchUsers();
  else if (name === 'comments') fetchComments();
  else if (name === 'shops') fetchShops();
}

tabs.users.onclick = () => showPanel('users');
tabs.comments.onclick = () => showPanel('comments');
tabs.shops.onclick = () => showPanel('shops');

// 用户管理相关
async function fetchUsers() {
  const res = await fetch(`${API_BASE}/users`);
  const json = await res.json();
  if (!json.success) return alert('加载用户失败: ' + json.message);
  const tbody = document.getElementById('user-table-body');
  tbody.innerHTML = '';
  json.data.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${u.username}</td>
      <td>${u.role}</td>
      <td>${u.status}</td>
      <td>
        ${u.status === 'active' 
          ? `<button class="action-btn" onclick="blockUser(${u.id})">封禁</button>`
          : `<button class="action-btn" onclick="unblockUser(${u.id})">解封</button>`}
        <button class="action-btn" onclick="editUser(${u.id})">编辑</button>
        <button class="action-btn" onclick="deleteUser(${u.id})">删除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function blockUser(id) {
  await fetch(`${API_BASE}/users/${id}/block`, { method: 'PUT' });
  fetchUsers();
}

async function unblockUser(id) {
  await fetch(`${API_BASE}/users/${id}/unblock`, { method: 'PUT' });
  fetchUsers();
}

async function editUser(id) {
  const res = await fetch(`${API_BASE}/users`);
  const json = await res.json();
  if (!json.success) return alert('加载用户失败: ' + json.message);
  const user = json.data.find(u => u.id == id);
  if (!user) return alert('用户不存在');

  document.getElementById('edit-user-id').value = user.id;
  document.getElementById('edit-username').value = user.username;
  document.getElementById('edit-role').value = user.role;
  document.getElementById('edit-user-modal').style.display = 'block';
}

async function deleteUser(id) {
  if (!confirm('确定要删除此用户吗？')) return;
  try {
    const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      alert('用户已删除');
      fetchUsers();
    } else {
      alert('删除失败: ' + json.message);
    }
  } catch (err) {
    console.error('删除用户失败:', err);
    alert('删除失败: 网络错误');
  }
}

function closeEditUserModal() {
  document.getElementById('edit-user-modal').style.display = 'none';
}

document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-user-id').value;
  const username = document.getElementById('edit-username').value.trim();
  const role = document.getElementById('edit-role').value;

  if (!username) {
    alert('用户名不能为空');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, role })
    });
    const json = await res.json();
    if (json.success) {
      alert('用户信息已更新');
      closeEditUserModal();
      fetchUsers();
    } else {
      alert('更新失败: ' + json.message);
    }
  } catch (err) {
    console.error('更新用户失败:', err);
    alert('更新失败: 网络错误');
  }
});

// 评论管理相关
async function fetchComments() {
  const res = await fetch(`${API_BASE}/comments/all`);
  const json = await res.json();
  if (!json.success) return alert('加载评论失败: ' + json.message);
  const tbody = document.getElementById('comment-table-body');
  tbody.innerHTML = '';
  json.data.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${c.user}</td>
      <td>${c.shop}</td>
      <td>${c.content}</td>
      <td>${new Date(c.time).toLocaleString()}</td>
      <td>${c.approved ? '已通过' : '未通过'}</td>
      <td>
        ${c.approved 
          ? `<button class="action-btn" onclick="rejectComment(${c.id})">取消通过</button>`
          : `<button class="action-btn" onclick="approveComment(${c.id})">通过</button>`}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function approveComment(id) {
  try {
    const res = await fetch(`${API_BASE}/comments/${id}/approve`, { method: 'PUT' });
    const json = await res.json();
    if (json.success) {
      fetchComments();
    } else {
      alert('通过评论失败: ' + json.message);
    }
  } catch (err) {
    console.error('通过评论失败:', err);
    alert('通过评论失败: 网络错误');
  }
}

async function rejectComment(id) {
  try {
    const res = await fetch(`${API_BASE}/comments/${id}/reject`, { method: 'PUT' });
    const json = await res.json();
    if (json.success) {
      fetchComments();
    } else {
      alert('取消通过评论失败: ' + json.message);
    }
  } catch (err) {
    console.error('取消通过评论失败:', err);
    alert('取消通过评论失败: 网络错误');
  }
}

// 商家管理相关
async function fetchShops() {
  const res = await fetch(`${API_BASE}/shops`);
  const json = await res.json();
  if (!json.success) return alert('加载商家失败: ' + json.message);
  const tbody = document.getElementById('shop-table-body');
  tbody.innerHTML = '';
  json.data.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.id}</td>
      <td>${s.name}</td>
      <td>${s.address}</td>
      <td>${s.category}</td>
      <td>${s.status}</td>
      <td>
        <button class="action-btn" onclick="blockShop(${s.id})">封禁</button>
        <button class="action-btn" onclick="unblockShop(${s.id})">解封</button>
        <button class="action-btn" onclick="editShop(${s.id})">编辑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function blockShop(id) {
  await fetch(`${API_BASE}/shops/${id}/block`, { method: 'PUT' });
  fetchShops();
}

async function unblockShop(id) {
  await fetch(`${API_BASE}/shops/${id}/unblock`, { method: 'PUT' });
  fetchShops();
}

async function editShop(id) {
  const res = await fetch(`http://localhost:3001/api/poi/search?id=${id}`);
  const json = await res.json();
  if (!json.success || json.data.length === 0) {
    alert('无法加载商家信息');
    return;
  }
  const shop = json.data[0];

  document.getElementById('edit-shop-id').value = shop.id;
  document.getElementById('edit-shop-name').value = shop.shop_name;
  document.getElementById('edit-address').value = shop.address || '';
  document.getElementById('edit-category').value = shop.category || '';
  document.getElementById('edit-business-hours').value = shop.business_hours || '';
  document.getElementById('edit-min-people').value = shop.min_people || '';
  document.getElementById('edit-max-people').value = shop.max_people || '';
  document.getElementById('edit-min-price').value = shop.min_price || '';
  document.getElementById('edit-max-price').value = shop.max_price || '';
  document.getElementById('edit-recommend-level').value = shop.recommend_level || '';
  document.getElementById('edit-specialty-dishes').value = shop.specialty_dishes || '';

  document.getElementById('edit-shop-modal').style.display = 'block';
}

function closeEditModal() {
  document.getElementById('edit-shop-modal').style.display = 'none';
}

document.getElementById('edit-shop-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-shop-id').value;
  const shop_name = document.getElementById('edit-shop-name').value.trim();
  const address = document.getElementById('edit-address').value.trim();
  const category = document.getElementById('edit-category').value.trim();
  const business_hours = document.getElementById('edit-business-hours').value.trim();
  const min_people = document.getElementById('edit-min-people').value;
  const max_people = document.getElementById('edit-max-people').value;
  const min_price = document.getElementById('edit-min-price').value;
  const max_price = document.getElementById('edit-max-price').value;
  const recommend_level = document.getElementById('edit-recommend-level').value.trim();
  const specialty_dishes = document.getElementById('edit-specialty-dishes').value.trim();

  if (!shop_name || !address || !category) {
    alert('店铺名称、地址和分类不能为空');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/shops/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_name,
        address,
        category,
        business_hours,
        min_people: min_people ? parseInt(min_people) : null,
        max_people: max_people ? parseInt(max_people) : null,
        min_price: min_price ? parseFloat(min_price) : null,
        max_price: max_price ? parseFloat(max_price) : null,
        recommend_level,
        specialty_dishes
      })
    });
    const json = await res.json();
    if (json.success) {
      alert('商家信息已更新');
      closeEditModal();
      fetchShops();
    } else {
      alert('更新失败: ' + json.message);
    }
  } catch (err) {
    console.error('更新商家失败:', err);
    alert('更新失败: 网络错误');
  }
});

// 初始化显示第一个tab
showPanel('users');