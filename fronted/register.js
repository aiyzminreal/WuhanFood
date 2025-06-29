// fronted/register.js
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const role = document.getElementById('role').value;

  // 客户端验证
  if (password !== confirmPassword) {
    alert('两次输入的密码不一致');
    return;
  }

  try {
    const response = await fetch('http://localhost:3001/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    const data = await response.json();

    if (response.ok) {
      alert('注册成功！请登录');
      window.location.href = 'login.html';
    } else {
      alert(data.message || '注册失败');
    }
  } catch (error) {
    console.error('注册错误:', error);
    alert('网络错误，请重试');
  }
});