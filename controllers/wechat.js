var WechatApi = require('../wechat.js');
var https = require('https');
var async = require('async');
var querystring = require('querystring');

module.exports.getIndex = function(req, res, next) {
  var qrcode = WechatApi.getQrCode();
  qrcode.then((code)=>{
    console.log('WechatApi code: ',typeof(code));
    res.render('qrcode', { data: code.data });
  })
}
