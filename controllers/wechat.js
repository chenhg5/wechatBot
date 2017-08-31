var WechatApi = require('../wechat.js');
var https = require('https');
var async = require('async');
var querystring = require('querystring');
var {Wechaty} = require('wechaty')

var glcode ='';
var glurl = '';

// var bot = Wechaty.instance();

// bot 
// .on('scan', (url, code) => {
//    console.log(`Scan QR Code to login: ${code}\n${url}`)
// })
// .on('login', user => {
//    console.log(`User ${user} logined`)}
//  )
// .on('message', message => {
//   console.log(`Message: ${message}`)
//  })
// .init()


module.exports.getQRcode = function(req, res, next) {
  var qrcode = WechatApi.getUUID();
  qrcode.then((code)=>{
    var src = 'https://login.weixin.qq.com/qrcode/'+code.data
    res.render('qrcode', { data: src });
  })
}

module.exports.getQRcode_wechaty = function(req, res, next) {
  res.render('qrcode', { data: glurl });
}
