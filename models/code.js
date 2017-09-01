var mysql = require('../lib/mysql.js')


module.exports = {
  create: (code) => {
    return mysql.createCode(code)
  },
  set: (code,property,value) => {
    mysql.updateCodeState(code,property,value)
  },
  get: (code) => {
    return mysql.getCode(code)
  }
}
