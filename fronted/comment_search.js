// 搜索并列出匹配店铺
async function doSearch(name) {
    const res = await fetch(`http://localhost:3001/api/poi/search?shop_name=${encodeURIComponent(name)}`);
    const json = await res.json();
    const list = document.getElementById('shop-results');
    list.innerHTML = '';
  
    if (!json.success || json.data.length === 0) {
      list.innerHTML = '<li>无匹配店铺</li>';
      return;
    }
  
    json.data.forEach(shop => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="comment_detail.html?food_id=${shop.id}">${shop.shop_name}</a>`;
      list.appendChild(li);
    });
  }
  
  function initSearchPage() {
    const input = document.getElementById('search-shop');
    const btn   = document.getElementById('search-btn');
  
    btn.addEventListener('click', () => {
      doSearch(input.value.trim());
    });
  
    // 页面加载时可不自动搜索，也可默认加载全部
    // doSearch('');
  }
  
  document.addEventListener('DOMContentLoaded', initSearchPage);
  