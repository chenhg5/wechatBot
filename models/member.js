var mysql = require('../lib/mysql.js')


module.exports = {
  create: (code,myId,memberId) => {
    mysql.setMemberList(code,myId,memberId)
  },
  getFriends: (code) => {
    return mysql.getFriends(code)
  }
}
