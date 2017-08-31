var http = require('http')
var https = require('https')
var request = require('request')
var querystring = require('querystring')

WechatApi = {}

WechatApi.request = (options,method='GET',data={},url='') => {
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
          request.defaults({encoding:null}).post(url,{json:data},function (error, response, body) {
              if (!error && response.statusCode == 200) {
                var base64prefix = 'data:' + response.headers['content-type'] + ';base64,'
                , image = body.toString('base64');
                resolve({
                    statusCode: response.statusCode,
                    headers: response.headers,
                    data: base64prefix+image
                });
              } else {
                reject('errors')
              }
            }
          );
        }
      })
}

WechatApi.getUUID = async() => {
  var timestamp = new Date().getTime();
  var options = {
    host: "login.weixin.qq.com",
    path: "/jslogin?appid=wx782c26e4c19acffb&fun=new&lang=zh_CN&_=" + timestamp,
    port: 443
  }
  var result = await WechatApi.request(options)
  matches = result.data.match(/; window.QRLogin.uuid = "(.*?)"/)
  result.data = matches ? matches[1] : ''
  return result
}

WechatApi.getQrCode = async() => {
  var timestamp = new Date().getTime();
  var uuid = await WechatApi.getUUID()
  var url = ' https://login.weixin.qq.com/qrcode/' + uuid.data;
  var data = {
    't'   : 'webwx',
    '_' : timestamp
  }
  var result = await WechatApi.request(null,'POST',data,url)
  return result
}

WechatApi.checklogin = async()=>{
  
}

module.exports = WechatApi
