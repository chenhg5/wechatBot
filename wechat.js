var http = require('http')
var https = require('https')
var request = require('request')
var querystring = require('querystring')
var zlib = require('zlib')

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

// method json get image post
WechatApi.request = (url,method='GET',postType='',data='',headers={},encoding='utf8') => {
  return new Promise((resolve, reject) => {

    request({
      method: method,
      encoding: encoding,
      headers: headers,
      url: url,
      json: postType=='json',
      form: postType=='form',
      body: data
    },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
          // console.log('response: ',body);
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

  })
}

// 获得uuid
WechatApi.getUUID = async() => {
  var timestamp = new Date().getTime();
  var url = "https://login.weixin.qq.com/jslogin?appid=" + WechatApi.appid + "&redirect_uri=https%3A%2F%2Flogin.weixin.qq.com%2Fcgi-bin%2Fmmwebwx-bin%2Fwebwxnewloginpage&fun=new&lang=zh_CN&_=" + timestamp
  var result = await WechatApi.request(url)
  matches = result.data.match(/; window.QRLogin.uuid = "(.*?)"/)
  result.data = matches ? matches[1] : ''
  console.log('uuid result',result);

  // 循环调用检查是否登录
  var checklogin = setInterval(()=>{
    WechatApi.checklogin(result.data)
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
  var url = "https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login?tip=0&_=" + timestamp + "&uuid=" + uuid
  var result = await WechatApi.request(url)
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
  var url = "https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxnewloginpage?version=2&fun=new&" + matches[1]
  var headers = {
    'Accept': ':application/json, text/plain, */*'
  }
  var result = await WechatApi.request(url,'GET','','',headers)
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

  // 非常关键
  cookie = JSON.stringify(result.headers['set-cookie'])
               .replace('[','').replace(']','')
               .replace(/Domain=(.*?)"/g,'')
               .replace(/,/g,'')
               .replace(/"/g,'')
  WechatApi.cookies = cookie

  console.log('set-cookie: ',cookie);

  try {

    await WechatApi.wxInit(skey,wxsid,wxuin,deviceId,pass_ticket,cookie);

    await WechatApi.getContacts(skey,pass_ticket,cookie)
  
  } catch(err) {
    console.error('err: ',err);
  }

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
  var result = await WechatApi.request(url,'POST','json',data)

  console.log('wxInit result: ',result.data);

  // WechatApi.setNotify(data['BaseRequest'],result.data['User']['UserName'],cookie)

  // setTimeout(()=>{
  //   WechatApi.getContacts(skey,pass_ticket,cookie)
  // },3000)

  return result
}

// 获得联系人列表
WechatApi.getContacts = async(skey,pass_ticket,cookie) => {
  var timestamp = new Date().getTime();
  var url = "https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact?lang=zh_CN&pass_ticket="
          +pass_ticket+'&r='+timestamp+'&skey='+skey+'&seq=0'

  console.log('cookie: ',cookie);

  var headers = {
    'Cookie': cookie,
    'Accept': 'application/json, text/plain, */*'
  }

  var result = await WechatApi.request(url,'GET','','',headers)

  var friendList = JSON.parse(result.data)

  console.info('getContacts result: ',typeof(JSON.parse(result.data)));
  console.log('MemberList: ',friendList['MemberList'][0]);

  return result
}

WechatApi.setNotify = async(BaseRequest,myId,cookie)=>{
  var ClientMsgId = new Date().getTime();
  var data = {
    BaseRequest: BaseRequest,
    FromUserName: myId,
    ToUserName: myId,
    ClientMsgId: ClientMsgId,
    Code: 3,
  }
  var url = 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxstatusnotify'
  var headers = {
    'Cookie':cookie
  }
  var result = await WechatApi.request(url,'POST','json',data,headers)
  console.log('setNotify result: ',result);
  return result
}


// 发信息给所有人
// WechatApi.sendMsgToAll = async(pass_ticket,myId,BaseRequest)=>{
//   var timestamp = new Date().getTime();

//   var data = { 
//     BaseRequest: BaseRequest,
//     Msg: { 
//          Type: 1, 
//          Content: '你好', 
//          FromUserName: , 
//          ToUserName: , 
//          LocalID: , 
//          ClientMsgId:  
//      } 
//   }
//   var url = "https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg?pass_ticket=" + pass_ticket
//   var headers = {
//     'Cookie':cookie
//   }
//   var result = await WechatApi.request(url,'POST','json',data,headers)
//   return result  
// }

module.exports = WechatApi
