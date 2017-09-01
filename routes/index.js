var express = require('express');
var router  = express.Router();
var Wechat  = require('../controllers/wechat.js');


router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/qrcode', Wechat.getQRcode);
router.get('/gift/:code', function(req, res, next){
  res.render('gift',{code:req.params.code});
});

router.post('/getCodeStatus', Wechat.getCodeState);

router.post('/sendAllFriends', Wechat.sendAllFriends);

module.exports = router;
