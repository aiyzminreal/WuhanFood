
require('dotenv').config();
console.log('当前读取到的 DB_NAME:', process.env.DB_NAME);

// db.js
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});
console.log('已从', path.resolve(__dirname, '../.env'), '加载 DB_NAME =', process.env.DB_NAME);

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

pool.getConnection()
  .then(conn => {
    console.log('数据库连接成功');
    conn.release();
  })
  .catch(err => {
    console.error('数据库连接失败：', err);
  });

module.exports = pool;
