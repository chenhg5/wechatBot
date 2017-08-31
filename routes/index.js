var express = require('express');
var router  = express.Router();
var Wechat  = require('../controllers/wechat.js');


router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/qrcode', Wechat.getQRcode);
router.get('/gift', function(req, res, next){
  res.render('gift');
});

module.exports = router;
