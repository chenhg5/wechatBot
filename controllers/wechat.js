var WechatApi = require('../wechat.js');
var Code = require('../models/code.js')
var Member = require('../models/member.js')


module.exports = {
  getQRcode : function(req, res, next) {
    console.log('WechatApi type: ',WechatApi);
    var qrcode = WechatApi.getUUID();
    qrcode.then((code)=>{
      var src = 'https://login.weixin.qq.com/qrcode/'+code.data
      res.render('qrcode', { data: src, code: code.data });
    })
  },
  getCodeState : async(req, res, next) => {
    code = await Code.get(req.body.code)
    console.log('getCodeState state: ',code[0].state);
    res.json({'state':code[0].state});
  },
  sendAllFriends : async(req, res, next) => {
    var code = await Code.get(req.body.code)
    var BaseRequest = { 
      'Uin': code[0].wxuin, 
      'Sid': code[0].wxsid, 
      'Skey': code[0].skey, 
      'DeviceID': code[0].deviceId, 
    }
    var cookie = code[0].cookie
    var pass_ticket = code[0].pass_ticket
    var text = 'woshiyigeshabi nishishui?'

    // 获取所有朋友
    var friends = await Member.getFriends(code[0].id)
    console.log('sendAllFriends friends: ',friends);

    for (var i = 0; i < friends.length; i++) {
      console.log('sendingMsg');
      WechatApi.sendMsgToFriend(BaseRequest,friends[i].myId,friends[i].memberId,pass_ticket,cookie,text)
    }

    res.json({'ack':true});
  }
}
