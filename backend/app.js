// backend/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const poiRoutes = require('./routes/poi');
const userRoutes = require('./routes/user');        // 用户相关接口
const adminRoutes = require('./routes/admin');      // 管理员审核接口

const app = express();

// 允许的请求源，前端地址列表
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://localhost:3000'
];

// 配置 CORS，支持跨域访问
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 解析JSON请求体
app.use(express.json());

// 挂载路由
app.use('/api', poiRoutes);         // 业务点POI接口，如查询店铺
app.use('/api', userRoutes);        // 用户注册、登录等接口
app.use('/api/admin', adminRoutes); // 管理员相关接口，路径统一前缀为 /api/admin

// 启动服务，监听端口
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`后端服务已启动：http://localhost:${PORT}`);
  console.log(`允许来源：${allowedOrigins.join(', ')}`);
});
