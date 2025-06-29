// random.js

let map;
let marker;

/**
 * 拉取一次随机餐馆并渲染
 */
async function fetchAndShowRandom() {
  const infoDiv = document.getElementById('info');
  infoDiv.innerText = '加载中…';

  try {
    const res = await fetch('http://localhost:3001/api/poi/random');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) {
      infoDiv.innerText = '随机抽取失败：' + json.error;
      return;
    }

    const poi = json.data;
    // 清除旧 marker
    if (marker) marker.setMap(null);
    // 新 marker
    marker = new AMap.Marker({
      position: [poi.longitude, poi.latitude],
      title: poi.shop_name,
      map
    });
    map.setCenter([poi.longitude, poi.latitude]);

    // 渲染信息
    infoDiv.innerHTML = `
      <h3>${poi.shop_name}</h3>
      <p>分类：${poi.category} | 地区：${poi.region}</p>
      <p>人数：${poi.min_people}-${poi.max_people} 人</p>
      <p>价格：¥${poi.min_price}-${poi.max_price}</p>
      <p>时段：${poi.business_hours}</p>
      <p>推荐：${poi.recommend_level}</p>
      <p>特色：${poi.specialty_dishes || '—'}</p>
      <p>地址：${poi.address}</p>
    `;
  } catch (err) {
    console.error('随机抽取失败：', err);
    infoDiv.innerText = '网络或服务器错误，请重试';
  }
}

/**
 * 页面入口
 */
function initRandomPage() {
  // 1. 初始化地图
  map = new AMap.Map('map-container', {
    center: [114.3055, 30.5928],
    zoom: 14
  });

  // 2. 第一次抽餐馆
  fetchAndShowRandom();

  // 3. 绑定“再来一发”按钮
  document.getElementById('rerandom-btn')
    .addEventListener('click', fetchAndShowRandom);
}

// DOM ready
document.addEventListener('DOMContentLoaded', initRandomPage);
