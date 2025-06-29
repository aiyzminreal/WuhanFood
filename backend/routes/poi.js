const express = require('express');
const router = express.Router();
const {
  getAllPOIs, searchPOIs, randomPOI,
  getComments, addComment, replyComment, addUserReply,
  incrementClick, getRanking,
  getShopByUser, updateShopByUser, addShopByUser
} = require('../controllers/poiController');

// POI 相关路由
router.get('/poi', getAllPOIs);
router.get('/poi/search', searchPOIs);
router.get('/poi/random', randomPOI);

// 评论相关路由
router.get('/poi/:foodId/comments', getComments);
router.post('/poi/:foodId/comments', addComment);
router.post('/poi/:foodId/comments/reply', replyComment);
router.post('/poi/:foodId/comments/user-reply', addUserReply); // 用户回复评论

// 点击数相关路由
router.post('/poi/:foodId/click', incrementClick);

// 排行榜相关路由
router.get('/poi/ranking', getRanking);

// 商家相关路由
router.get('/poi/shop/:username', getShopByUser);
router.put('/poi/shop/:id', updateShopByUser);
router.post('/poi/shop', addShopByUser);

module.exports = router;