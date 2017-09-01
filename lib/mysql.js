var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'wechatBot'
});

module.exports = {

  createCode: (code) => {
    return new Promise((resolve, reject) => {
      var sql = "INSERT INTO usercode (code,state) VALUES ('"+ code +"',0)"
      connection.connect(function(err, callback){
        connection.query(sql, function (error, results, fields) {
          if (error) {
            reject(error);
          }
          // console.log('createCode results: ',results);
          resolve(results['insertId'])
          // connection.end();
        });
      });
    });
  },
  updateCodeState: (code,property,value) => {
    var sql = "UPDATE usercode SET `"+property+"` = "+"'"+value+"'"+" WHERE `code` = "+"'"+code+"'"
    connection.connect(function(err, callback){
      connection.query(sql, function (error, results, fields) {
        if (error) throw error;
        // connection.end();
      });
    });
  },
  getCode: (code) => {
    console.log('getCodeState code: ',code);
    return new Promise((resolve, reject) => {
      var sql = "SELECT * FROM usercode WHERE `code` = '" + code + "'"
      connection.connect(function(err, callback){
        connection.query(sql, function (error, results, fields) {
          if (error){
            reject(error);
          }
          // console.log('getCodeState results: ',results);
          resolve(results)
          // connection.end();
        });
      });
    });
  },
  setMemberList: (codeId,myId,memberId) => {
    var sql = "INSERT INTO memberlist (codeId,myId,memberId) VALUES ('"+ codeId +"','"+myId+"','"+memberId+"')"
    connection.connect(function(err, callback){
      connection.query(sql, function (error, results, fields) {
        if (error) throw error
        // console.log('setMemberList results: ',results);
        // connection.end();
      });
    });
  },
  getFriends: (codeId) => {
    console.log('getFriends codeId: ',codeId);
    return new Promise((resolve, reject) => {
      var sql = "SELECT * FROM memberlist WHERE `codeId` = '" + codeId + "'"
      connection.connect(function(err, callback){
        connection.query(sql, function (error, results, fields) {
          if (error){
            reject(error);
          }
          console.log('getCodeState results: ',results);
          resolve(results)
          // connection.end();
        });
      });
    });
  }

}
