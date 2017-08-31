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
          request.default({encoding:null})
        }
      })
}

WechatApi.getUUID = async()=>{

}

WechatApi.qrCode = async()=>{
  
}

WechatApi.checklogin = async()=>{
  
}
