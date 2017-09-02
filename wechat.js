var request = require('request')
var querystring = require('querystring')
var Code = require('./models/code.js')
var Member = require('./models/member.js')

var WechatApi = function(){
  this.appid = 'wx782c26e4c19acffb' // wx782c26e4c19acffb wxeb7ec651dd0aefa9
  this.uuid = ''
  this.skey = ''
  this.wxsid = ''
  this.wxuin = ''
  this.deviceId = ''
  this.pass_ticket = ''
  this.cookies = ''
  this.isLogin = false
  this.username = ''
  this.BaseRequest = {}
  this.codeId = ''
  this.checkloginInterval = ''
}

WechatApi.prototype.request = (url,method='GET',postType='',data='',headers={},encoding='utf8') => {
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
WechatApi.prototype.getUUID = async() => {
  var timestamp = new Date().getTime();
  var url = "https://login.weixin.qq.com/jslogin?appid=" + this.appid + "&redirect_uri=https%3A%2F%2Flogin.weixin.qq.com%2Fcgi-bin%2Fmmwebwx-bin%2Fwebwxnewloginpage&fun=new&lang=zh_CN&_=" + timestamp
  console.log('getUUID url',url);
  console.log('request type',typeof(this.request));
  var result = await this.request(url)
  matches = result.data.match(/; window.QRLogin.uuid = "(.*?)"/)
  result.data = matches ? matches[1] : ''
  console.log('uuid result',result);

  this.uuid = result.data
  this.codeId = await Code.create(result.data)
  console.log('this.codeId: ',this.codeId);
  this.isLogin = false

  // 循环调用检查是否登录
  this.checkloginInterval = setInterval(()=>{
    this.checklogin(result.data)
  },1000)

  // setTimeout(()=>{
  //   console.log('clearInterval');
  //   clearInterval(checklogin);
  // },6000000)

  return result
}

// 微信确认登录
WechatApi.prototype.checklogin = async(uuid)=>{
  var timestamp = new Date().getTime();
  var url = "https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login?tip=0&_=" + timestamp + "&uuid=" + uuid
  var result = await this.request(url)
  // console.log('result: ',result);
  matches = result.data.match(/window.code=(.*?);/)
  code = matches ? matches[1] : ''
  console.log('result code: ',code);

  if (code=='200' && !this.isLogin) {
    this.isLogin = true

    clearInterval(this.checkloginInterval);

    // 储存数据库
    Code.set(uuid,'state','201')

    matches = result.data.match(/window.redirect_uri="(.*?)"/)
    url = matches ? matches[1] : ''
    console.log('result redirecturi: ',url);

    this.login(url)
  }
  return result
}

// 微信登录
WechatApi.prototype.login = async(url)=>{
  matches = url.match(/https:\/\/wx2.qq.com\/cgi-bin\/mmwebwx-bin\/webwxnewloginpage\?(.*)/)
  console.log('matches: ',matches[1]);
  var url = "https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxnewloginpage?version=2&fun=new&" + matches[1]
  var headers = {
    'Accept': ':application/json, text/plain, */*'
  }
  var result = await this.request(url,'GET','','',headers)
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
  this.deviceId = deviceId

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
  this.cookies = cookie

  console.log('set-cookie: ',cookie);

  Code.set(this.uuid,'wxuin',wxuin)
  Code.set(this.uuid,'wxsid',wxsid)
  Code.set(this.uuid,'skey',skey)
  Code.set(this.uuid,'deviceId',deviceId)
  Code.set(this.uuid,'pass_ticket',pass_ticket)
  Code.set(this.uuid,'cookie',cookie)

  try {

    await this.wxInit(skey,wxsid,wxuin,deviceId,pass_ticket,cookie);

    await this.getContacts(skey,pass_ticket,cookie)
  
  } catch(err) {
    console.error('err: ',err);
  }

  return result
}

// 微信初始化
WechatApi.prototype.wxInit = async(skey,wxsid,wxuin,deviceId,pass_ticket,cookie)=>{
  var data = { 
     'BaseRequest': { 
        'Uin': wxuin, 
        'Sid': wxsid, 
        'Skey': skey, 
        'DeviceID': deviceId, 
     }
  }

  this.BaseRequest = { 
    'Uin': wxuin, 
    'Sid': wxsid, 
    'Skey': skey, 
    'DeviceID': deviceId, 
  }

  console.log('Init data: ',JSON.stringify(data));

  var timestamp = new Date().getTime();
  var url = "https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxinit?r=" + timestamp + '&lang=zh_CN&pass_ticket=' + pass_ticket
  var result = await this.request(url,'POST','json',data)

  // console.log('wxInit result: ',result.data);

  this.username = result.data['User']['UserName']

  return result
}

// 获得联系人列表
WechatApi.prototype.getContacts = async(skey,pass_ticket,cookie) => {
  var timestamp = new Date().getTime();
  var url = "https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact?lang=zh_CN&pass_ticket="
          +pass_ticket+'&r='+timestamp+'&skey='+skey+'&seq=0'

  console.log('cookie: ',cookie);

  var headers = {
    'Cookie': cookie,
    'Accept': 'application/json, text/plain, */*'
  }

  var result = await this.request(url,'GET','','',headers)

  var friendList = JSON.parse(result.data)

  console.info('getContacts result: ',typeof(JSON.parse(result.data)));
  console.log('MemberList: ',friendList['MemberList'][0]);
  console.log('MemberList length: ',friendList['MemberList'].length);

  console.log('this.uuid: ',this.uuid);
  console.log('this.username: ',this.username);
  console.log('friendList.MemberList: ',friendList['MemberList'][0]['UserName']);

  for (var i = 0; i < friendList['MemberList'].length; i++) {
    Member.create(this.codeId,this.username,friendList['MemberList'][i]['UserName'])
  }

  return friendList
}

WechatApi.prototype.setNotify = async(BaseRequest,myId,cookie)=>{
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
  var result = await this.request(url,'POST','json',data,headers)
  console.log('setNotify result: ',result);
  return result
}


// 发信息给别人
WechatApi.prototype.sendMsgToFriend = async(BaseRequest,fromId,friendId,pass_ticket,cookie,text)=>{
  var timestamp = new Date().getTime();
  var clientId = timestamp + '' + Math.ceil(Math.random()*10000)

  var data = { 
    BaseRequest: BaseRequest,
    Msg: { 
         Type: 1, 
         Content: text, 
         FromUserName: fromId,
         ToUserName: friendId,
         LocalID: clientId,
         ClientMsgId: clientId
     },
     Scene:0
  }
  var url = "https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg?lang=zh_CN&pass_ticket=" + pass_ticket
  var headers = {
    'Cookie':cookie
  }

  console.log('send data: ',data);

  var result = await this.request(url,'POST','json',data,headers)
  console.log('sendMsgToFriend result: ',result);
  return result
}

module.exports = new WechatApi
