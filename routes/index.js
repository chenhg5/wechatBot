var express = require('express');
var router  = express.Router();
var Wechat  = require('../controllers/wechat.js');


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/wechat', Wechat.getQRcode);

router.get('/wechaty', Wechat.getQRcode_wechaty);

module.exports = router;
