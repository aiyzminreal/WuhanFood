function getParam(key) {
  const params = new URLSearchParams(location.search);
  const value = params.get(key);
  return value ? value.trim() : null;
}

let selectedParentId = null;

async function loadDetail() {
  // 更严格的参数验证
  const foodId = getParam('food_id');
  if (!foodId || isNaN(parseInt(foodId)) || parseInt(foodId) <= 0) {
    alert('无效的店铺 ID，请从有效链接进入');
    window.location.href = 'index.html';
    return;
  }

  // 1. 加载店铺信息
  try {
    const shopRes = await fetch(`http://localhost:3001/api/poi/search?id=${foodId}`);
    if (!shopRes.ok) throw new Error(`HTTP error! status: ${shopRes.status}`);
    
    const shopJson = await shopRes.json();
    if (!shopJson?.success || !shopJson.data?.length) {
      alert('无法找到店铺信息，可能店铺不存在');
      window.location.href = 'index.html';
      return;
    }
    
    const shop = shopJson.data[0];
    // 确保店铺有ID字段
    if (!shop.id) {
      console.error('店铺数据缺少ID字段:', shop);
      alert('店铺数据不完整');
      return;
    }

    document.getElementById('shop-name').innerText = shop.shop_name || '未知店铺';
    document.getElementById('shop-info').innerHTML = `
      分类：${shop.category || '未知'} | 地区：${shop.region || '未知'}<br>
      人数：${shop.min_people || '未知'}-${shop.max_people || '未知'} 人 | 价格：¥${shop.min_price || '未知'}-${shop.max_price || '未知'}<br>
      时段：${shop.business_hours || '未知'} | 推荐：${shop.recommend_level || '无'}
    `;
  } catch (err) {
    console.error('加载店铺信息失败:', err);
    alert('加载店铺信息失败: ' + (err.message || '网络错误'));
    window.location.href = 'index.html';
    return;
  }

  // 2. 加载历史评论
  await loadComments(foodId);

  // 3. 设置评论表单
  setupCommentForm(foodId);
}

async function loadComments(foodId) {
  try {
    const comRes = await fetch(`http://localhost:3001/api/poi/${foodId}/comments`);
    if (!comRes.ok) throw new Error(`HTTP error! status: ${comRes.status}`);
    
    const comJson = await comRes.json();
    const list = document.getElementById('comment-list');
    if (!list) throw new Error('未找到 comment-list 元素');

    if (!comJson?.success) {
      list.innerHTML = '<li>加载评论失败: ' + (comJson?.error || '未知错误') + '</li>';
      return;
    }

    list.innerHTML = comJson.data?.length > 0 
      ? comJson.data.map(renderComment).join('')
      : '<li>暂无评论</li>';

    setupReplyButtons();
  } catch (err) {
    console.error('加载评论失败:', err);
    const list = document.getElementById('comment-list');
    if (list) {
      list.innerHTML = '<li>加载评论失败: ' + (err.message || '网络错误') + '</li>';
    }
  }
}

function renderComment(comment) {
  return `
    <li>
      <strong>${escapeHtml(comment.username)}</strong>
      <span>(${new Date(comment.create_time).toLocaleString()})</span>
      <button class="reply-btn" data-comment-id="${comment.id}">回复</button><br>
      ${comment.rating ? `评分：${'★'.repeat(Math.min(5, Math.max(1, comment.rating)))}<br>` : ''}
      ${escapeHtml(comment.content)}
      ${comment.replies?.length > 0 ? `
        <ul class="sub-comments">
          ${comment.replies.map(reply => renderComment(reply)).join('')}
        </ul>
      ` : ''}
    </li>
  `;
}

function setupReplyButtons() {
  document.querySelectorAll('.reply-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.reply-btn').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      selectedParentId = button.getAttribute('data-comment-id');
      const contentInput = document.getElementById('content');
      if (contentInput) {
        const username = button.closest('li').querySelector('strong')?.innerText || '用户';
        contentInput.placeholder = `回复 ${username}...`;
        contentInput.focus();
      }
    });
  });
}

function setupCommentForm(foodId) {
  const commentForm = document.getElementById('comment-form');
  if (!commentForm) {
    console.error('未找到 comment-form 元素');
    return;
  }

  commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username')?.value?.trim();
    const rating = document.getElementById('rating')?.value;
    const content = document.getElementById('content')?.value?.trim();

    if (!username || !content) {
      alert('请填写昵称和评论内容');
      return;
    }

    try {
      const url = selectedParentId 
        ? `http://localhost:3001/api/poi/${foodId}/comments/user-reply`
        : `http://localhost:3001/api/poi/${foodId}/comments`;

      const body = selectedParentId
        ? JSON.stringify({ parent_id: selectedParentId, username, content })
        : JSON.stringify({ food_id: foodId, username, rating: rating ? parseInt(rating) : 0, content });

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error || '提交失败');

      alert(selectedParentId ? '回复提交成功，待审核' : '评论提交成功，待审核');
      resetCommentForm();
      await loadComments(foodId);
    } catch (err) {
      console.error('提交失败:', err);
      alert('提交失败: ' + (err.message || '网络错误'));
    }
  });
}

function resetCommentForm() {
  selectedParentId = null;
  const form = document.getElementById('comment-form');
  if (form) form.reset();
  const contentInput = document.getElementById('content');
  if (contentInput) contentInput.placeholder = '输入评论...';
  document.querySelectorAll('.reply-btn').forEach(btn => btn.classList.remove('active'));
}

// 简单的HTML转义函数防止XSS
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', loadDetail);