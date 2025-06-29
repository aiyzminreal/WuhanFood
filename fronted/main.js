// ==== 全局变量 ====
let map;                // 地图对象
let markerList = [];    // 存储当前的 markers
let markersMap = {};             // 保存 id → marker 的映射
let selectedMarker = null;       // 当前高亮的 marker

// ==== 初始化地图 & 首次加载 & 绑定搜索 ====
function init() {
  // 1. 初始化地图（注意：容器 ID 必须和 index.html 中的 id 完全一致）
  map = new AMap.Map('map-container', {
    center: [114.3055, 30.5928], // 武汉市中心
    zoom: 13
  });

  // 首次加载全部 POI
  loadAllPOI();
  // 绑定搜索表单提交
  bindSearch();

  //按钮绑定跳转
  // 随机按钮绑定跳转
  const randomBtn = document.getElementById('random-btn');
  randomBtn.addEventListener('click', () => {
    window.location.href = './random.html';
  });
  // 全局“我要评论”按钮
  document.getElementById('go-comment-btn')
    .addEventListener('click', () => {
      window.location.href = './comment_search.html';
    });
    // 全局“排行榜”按钮
    document.getElementById('go-ranking-btn')
    .addEventListener('click', () => {
      window.location.href = './ranking.html';
    });

}

// ==== 从后端获取所有 POI 点 ====
async function loadAllPOI() {
  try {
    const res = await fetch('http://localhost:3001/api/poi');
    const json = await res.json();
    if (json.success) {
      updateMapMarkers(json.data);
      updateRestaurantList(json.data);
    } else {
      console.warn('加载全部 POI 时后端返回失败：', json.error);
    }
  } catch (err) {
    console.error('加载全部 POI 出错：', err);
  }
}

// ==== 绑定搜索表单提交事件 ====
function bindSearch() {
  const form = document.getElementById('search-form');
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const params = new URLSearchParams();

    // 基本文本/下拉字段
    ['shop_name','category','region','business_hours','cuisine_type','recommend_level']
      .forEach(id => {
        const v = document.getElementById(id).value.trim();
        if (v) params.append(id, v);
      });

    // 人数 x → min_people & max_people
    const people = document.getElementById('people').value;
    if (people) {
      params.append('min_people', people);
      params.append('max_people', people);
    }

    // 价格范围 m~n
    const min_price = document.getElementById('min_price').value;
    const max_price = document.getElementById('max_price').value;
    if (min_price) params.append('min_price', min_price);
    if (max_price) params.append('max_price', max_price);

    const url = `http://localhost:3001/api/poi/search?${params.toString()}`;
    console.log('搜索 URL:', url);

    // 随机按钮绑定跳转
  const btn = document.getElementById('random-btn');
  btn.addEventListener('click', () => {
    // 跳转到同目录下的 random.html
    window.location.href = './random.html';
  });

// 点击后跳转到评论搜索页，并带上 query 参数 shop_name
document.querySelectorAll('.comment-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.name;
    window.location.href = `comment_search.html?shop_name=${encodeURIComponent(name)}`;
  });
});

    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        updateMapMarkers(json.data);
        updateRestaurantList(json.data);
      } else {
        console.warn('后端返回失败：', json.error);
      }
    } catch (err) {
      console.error('搜索出错：', err);
    }
  });
}

// ==== 更新地图 Marker ====
function updateMapMarkers(pois) {
  // 清除旧 markers
  markerList.forEach(m => m.setMap(null));
  markerList = [];
  markersMap = {};    // 同时重置映射

   // 对每个 poi 创建 marker，并存到 map 里
   pois.forEach(poi => {
    const marker = new AMap.Marker({
      position: [poi.longitude, poi.latitude],
      title: poi.shop_name,
      icon: 'http://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',  // 默认红点
      map
    });
    markerList.push(marker);
    markersMap[poi.id] = marker;
  });
}

// ==== 高亮marker函数 ====
function highlightMarkerAt(lng, lat, title) {
  // 清除之前的高亮marker
  if (highlightMarker) {
    highlightMarker.setMap(null);
  }

  // 新建一个marker，高亮样式
  highlightMarker = new AMap.Marker({
    position: [lng, lat],
    title: title,
    map: map,
    icon: new AMap.Icon({
      size: new AMap.Size(40, 50),
      image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
      imageSize: new AMap.Size(40, 50),
    }),
    zIndex: 9999, // 确保高亮marker在最上层
  });
}


// 更新侧边栏列表，给店铺名称绑定“定位 + 计数”逻辑
function updateRestaurantList(pois) {
  const container = document.getElementById('restaurant-list');
  container.innerHTML = '';
  pois.forEach(poi => {
    const div = document.createElement('div');
    div.className = 'shop-item';
    // 名称做一个按钮
    div.innerHTML = `
      <button type="button" class="locate-btn" 
        data-id="${poi.id}"
        data-lng="${poi.longitude}" 
        data-lat="${poi.latitude}">
        ${poi.shop_name}
      </button><br>
      <div class="info">
      分类：${poi.category} | 地区：${poi.region}<br>
      人数：${poi.min_people}-${poi.max_people} 人 |
      价格：¥${poi.min_price}-${poi.max_price}|
      时段：${poi.business_hours}<hr>
      </div>
    `;
    container.appendChild(div);
  });

  document.querySelectorAll('.locate-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id  = btn.dataset.id;
      const lng = parseFloat(btn.dataset.lng);
      const lat = parseFloat(btn.dataset.lat);
  
      // 地图定位
      map.setCenter([lng, lat]);
      map.setZoom(15);
  
      // 计数请求（保持不变）
      try {
        await fetch(`http://localhost:3001/api/poi/${id}/click`, { method: 'POST' });
      } catch (err) { console.error(err); }
  
      // 3. 变色：先把之前选中的 marker 恢复默认
      if (selectedMarker) {
        selectedMarker.setIcon('http://webapi.amap.com/theme/v1.3/markers/n/mark_b.png');
      }
  
      // 再把当前 marker 换成高亮（红色）
      const marker = markersMap[id];
      marker.setIcon('http://webapi.amap.com/theme/v1.3/markers/n/mark_r.png');
      selectedMarker = marker;
    });
  });
}

// ==== DOM 加载完毕后执行 init() ====
document.addEventListener('DOMContentLoaded', init);
