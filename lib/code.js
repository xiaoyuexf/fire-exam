/**
 * 网页端激活码算法（与小程序 utils/code.js 同一套，禁止修改 SALT / checksum）
 * --------------------------------------------------
 * 码格式：方向(1位) + 月数 + "-" + YYYYMMDD(到期日) + "-" + 校验4位
 *   例：M2-20261026-193S
 *   方向：M=监控(monitor)  K=维保(maintain)  B=双方向(both)
 * 校验位仅防手误/瞎填，非加密。码自带到期日，学员端本地校验，不依赖服务器。
 * 纯前端：浏览器挂到 window.Code；Node 端走 module.exports（老师工具/测试复用）。
 */
(function (root, factory) {
  var api = factory()
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  if (typeof window !== 'undefined') window.Code = api
  if (typeof root !== 'undefined' && root) root.Code = api
})(typeof self !== 'undefined' ? self : this, function () {
  var SALT = 'FXMINI2026'
  var DIR_RMAP = { monitor: 'M', maintain: 'K', both: 'B' }
  var DIR_MAP = { M: 'monitor', K: 'maintain', B: 'both' }

  function checksum(str) {
    var h = 0
    for (var i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) & 0xffff
    }
    for (var j = 0; j < SALT.length; j++) {
      h = (h * 31 + SALT.charCodeAt(j)) & 0xffff
    }
    return h.toString(36).toUpperCase().padStart(4, '0').slice(-4)
  }

  function pad2(n) {
    return String(n).padStart(2, '0')
  }

  // 生成激活码（老师工具/Node 调用）。baseDate 可选，默认按生成当天 + months 算到期日。
  function genCode(direction, months, baseDate) {
    var dir = DIR_RMAP[direction] || 'M'
    var monthsNum = parseInt(months, 10) || 1
    var base = baseDate ? new Date(baseDate) : new Date()
    var expire = new Date(base.getFullYear(), base.getMonth() + monthsNum, base.getDate())
    var ymd = '' + expire.getFullYear() + pad2(expire.getMonth() + 1) + pad2(expire.getDate())
    var body = dir + monthsNum + '-' + ymd
    return body + '-' + checksum(body)
  }

  // 校验激活码（学员端调用），返回 { ok, direction, months, expireAt, msg }
  function verifyCode(raw) {
    var code = (raw || '').trim().toUpperCase()
    var m = code.match(/^([MKB])(\d{1,2})-(\d{8})-([0-9A-Z]{4})$/)
    if (!m) return { ok: false, msg: '激活码格式不正确' }
    var dir = m[1]
    var months = parseInt(m[2], 10)
    var ymd = m[3]
    var sum = m[4]
    var body = dir + months + '-' + ymd
    if (checksum(body) !== sum) return { ok: false, msg: '激活码无效' }
    var y = +ymd.slice(0, 4)
    var mo = +ymd.slice(4, 6)
    var da = +ymd.slice(6, 8)
    var expire = new Date(y, mo - 1, da, 23, 59, 59)
    var expireAt = expire.getTime()
    if (!(expireAt > Date.now())) return { ok: false, msg: '激活码已过期，请联系老师重新发放' }
    return { ok: true, direction: DIR_MAP[dir], months: months, expireAt: expireAt }
  }

  return { genCode: genCode, verifyCode: verifyCode, checksum: checksum }
})
