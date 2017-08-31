var http = require('http')
var https = require('https')
var request = require('request')
var querystring = require('querystring')

WechatApi = {}

WechatApi.appid = 'wx782c26e4c19acffb' // wx782c26e4c19acffb wxeb7ec651dd0aefa9
WechatApi.uuid = ''
WechatApi.skey = ''
WechatApi.wxsid = ''
WechatApi.wxuin = ''
WechatApi.deviceId = ''
WechatApi.pass_ticket = ''
WechatApi.cookies = ''
WechatApi.isLogin = false

WechatApi.request = (options,method='GET',data={},url='',encoding=null,cookie='') => {
  return new Promise((resolve, reject) => {
    if (options) {
      var postBody = ''
      if (method=='POST') {
        postBody = querystring.stringify(data);
        options['headers'] = {
           'Content-Type': 'application/x-www-form-urlencoded',
           'Content-Length': postBody.length
        }
      }

      var port = options.port == 443 ? https : http;
      var req = port.request(options, function(res)
      {
          var output = '';
          console.log(options.host + ':' + res.statusCode);
          res.setEncoding('utf8');

          res.on('data', function (chunk) {
              output += chunk;
          });

          res.on('end', function() {
              try {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: output
                });
              } catch (err){
                console.error('rest::end', err);
                reject(err);              
              }
          });
      });

      req.on('error', function(err) {
          console.error('rest::request', err);
          reject(err);
      });

      if (method=='POST') {
        req.write(postBody);
      }

      req.end();
    } else {
      request.defaults({encoding:encoding,headers: {cookie: cookie}}).post(url,{json:data},function (error, response, body) {
          if (!error && response.statusCode == 200) {
            resolve({
                statusCode: response.statusCode,
                headers: response.headers,
                data: body
            });
          } else {
            reject('errors')
          }
        }
      );
    }
  })
}

// 获得uuid
WechatApi.getUUID = async() => {
  var timestamp = new Date().getTime();
  var options = {
    host: "login.weixin.qq.com",
    path: "/jslogin?appid=" + WechatApi.appid + "&redirect_uri=https%3A%2F%2Flogin.weixin.qq.com%2Fcgi-bin%2Fmmwebwx-bin%2Fwebwxnewloginpage&fun=new&lang=zh_CN&_=" + timestamp,
    port: 443
  }
  var result = await WechatApi.request(options)
  matches = result.data.match(/; window.QRLogin.uuid = "(.*?)"/)
  result.data = matches ? matches[1] : ''
  console.log('uuid result',result);
  return result
}

// 获得二维码
WechatApi.getQrCode = async() => {
  var timestamp = new Date().getTime();
  var res = await WechatApi.getUUID()
  var uuid = res.data
  var url = 'https://login.weixin.qq.com/qrcode/' + uuid;
  var data = {
    't'   : 'webwx',
    '_' : timestamp
  }
  var result = await WechatApi.request(null,'POST',data,url)

  var base64prefix = 'data:' + result.headers['content-type'] + ';base64,'
  , image = result.data.toString('base64');
  result.data = base64prefix + image;

  // 循环调用检查是否登录
  var checklogin = setInterval(()=>{
    WechatApi.checklogin(uuid)
  },1000)

  setTimeout(()=>{
    console.log('clearInterval');
    clearInterval(checklogin);
  },10000)

  return result
}

// 微信确认登录
WechatApi.checklogin = async(uuid)=>{
  var timestamp = new Date().getTime();
  var options = {
    host: "login.weixin.qq.com",
    path: "/cgi-bin/mmwebwx-bin/login?tip=0&_=" + timestamp + "&uuid=" + uuid,
    port: 443
  }
  var result = await WechatApi.request(options)
  // console.log('result: ',result);
  matches = result.data.match(/window.code=(.*?);/)
  code = matches ? matches[1] : ''
  console.log('result code: ',code);

  if (code=='200' && !WechatApi.isLogin) {
    WechatApi.isLogin = true
    matches = result.data.match(/window.redirect_uri="(.*?)"/)
    url = matches ? matches[1] : ''
    console.log('result redirecturi: ',url);
    WechatApi.login(url)
  }
  return result
}

// 微信登录
WechatApi.login = async(url)=>{
  matches = url.match(/https:\/\/wx2.qq.com\/cgi-bin\/mmwebwx-bin\/webwxnewloginpage\?(.*)/)
  console.log('matches: ',matches[1]);
  var options = {
    host: "wx2.qq.com",
    path: "/cgi-bin/mmwebwx-bin/webwxnewloginpage?" + matches[1],
    port: 443
  }
  var result = await WechatApi.request(options)
  console.log('login result: ',result);

  skey_matches = result.data.match(/<skey>(.*?)<\/skey>/)
  wxsid_matches = result.data.match(/<wxsid>(.*?)<\/wxsid>/)
  wxuin_matches = result.data.match(/<wxuin>(.*?)<\/wxuin>/)
  pass_ticket_matches = result.data.match(/<pass_ticket>(.*?)<\/pass_ticket>/)

  skey = skey_matches[1];
  wxsid = wxsid_matches[1];
  wxuin = wxuin_matches[1];
  pass_ticket = pass_ticket_matches[1];

  var deviceId = "e" + Math.ceil(Math.random()*1000000000000000);
  WechatApi.deviceId = deviceId

  log_data = {
    skey:skey,
    wxsid:wxsid,
    wxuin:wxuin,
    pass_ticket:pass_ticket,
    deviceId:deviceId
  }
  console.log('log_data: ',log_data);

  cookie = JSON.stringify(result.headers['set-cookie']).replace('[','').replace(']','')
  WechatApi.cookies = cookie

  console.log('set-cookie: ',cookie);

  WechatApi.wxInit(skey,wxsid,wxuin,deviceId,pass_ticket,cookie);

  return result
}

// 微信初始化
WechatApi.wxInit = async(skey,wxsid,wxuin,deviceId,pass_ticket,cookie)=>{
  var data = { 
     'BaseRequest': { 
        'Uin': wxuin, 
        'Sid': wxsid, 
        'Skey': skey, 
        'DeviceID': deviceId, 
     }
  }

  console.log('Init data: ',JSON.stringify(data));

  var timestamp = new Date().getTime();
  var url = "https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxinit?r=" + timestamp + '&lang=zh_CN&pass_ticket=' + pass_ticket
  var result = await WechatApi.request(null,'POST',data,url,'utf8',cookie)

  console.log('wxInit result: ',result);

  // var contacts = WechatApi.getContacts(skey,wxsid,wxuin,deviceId,cookie)
  // contacts.then((res)=>{
  //   console.log('getContacts result: ',res);
  // })

  return result
}

// 获得联系人列表
WechatApi.getContacts = async(skey,wxsid,wxuin,deviceId,cookie) => {
  var data = { 
     BaseRequest: { 
        Uin: wxuin, 
        Sid: wxsid, 
        Skey: skey, 
        DeviceID: deviceId, 
     }
  }
  var url = "https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact"
  var result = await WechatApi.request(null,'POST',data,url,'utf8',cookie)
  return result
}

// 

module.exports = WechatApi
