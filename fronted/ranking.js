// ranking.js

let currentPage = 1;
const perPage = 10;

// 加载并渲染指定页
async function loadRanking(page) {
  try {
    const res = await fetch(`http://localhost:3001/api/poi/ranking?page=${page}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || '获取失败');

    const { data, pagination } = json;
    currentPage = pagination.page;
    const total = pagination.total;
    const totalPages = Math.ceil(Math.min(total, 50) / perPage);

    // 渲染列表
    const container = document.getElementById('ranking-list');
    container.innerHTML = data.map((poi, idx) => `
      <div>
        <strong>#${(currentPage - 1)*perPage + idx + 1} ${poi.shop_name}</strong>
        （${poi.click_count} 次）<br>
        分类：${poi.category} | 地区：${poi.region}
      </div><hr>
    `).join('');

    // 更新分页信息
    document.getElementById('page-info').innerText =
      `第 ${currentPage} / ${totalPages} 页`;

    // 按钮可用性
    document.getElementById('prev-btn').disabled = currentPage <= 1;
    document.getElementById('next-btn').disabled = currentPage >= totalPages;
  } catch (err) {
    console.error('加载排行榜失败', err);
    document.getElementById('ranking-list').innerText = '无法加载排行榜';
  }
}

function initRankingPage() {
  // 绑定翻页按钮
  document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentPage > 1) loadRanking(currentPage - 1);
  });
  document.getElementById('next-btn').addEventListener('click', () => {
    loadRanking(currentPage + 1);
  });

  // 首次加载
  loadRanking(1);
}

document.addEventListener('DOMContentLoaded', initRankingPage);
