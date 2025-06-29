// fronted/login.js
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const role = document.getElementById('role').value;

  if (!username || !password) {
    alert('用户名和密码不能为空');
    return;
  }

  try {
    const response = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // 存储用户名到 localStorage
      localStorage.setItem('username', username);
      // 根据角色跳转不同页面
      if (role === 'admin') {
        window.location.href = 'admin.html';
      } else if (role === 'shop') {
        window.location.href = 'shop.html';
      } else {
        window.location.href = 'index.html';
      }
    } else {
      alert(data.message || '登录失败，请检查用户名密码或角色');
    }
  } catch (error) {
    console.error('登录错误:', error);
    alert('网络错误，请稍后重试');
  }
});