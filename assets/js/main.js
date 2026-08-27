/* 网页版交互逻辑 */
(function () {
  // 判断是否在微信内打开（信任提示）
  var ua = navigator.userAgent.toLowerCase()
  if (ua.indexOf('micromessenger') !== -1) {
    document.getElementById('wxTip').style.display = 'block'
  }

  // 老师微信二维码弹窗（不展示任何价格/套餐，仅引导加微信领码）
  function openQr() {
    var m = document.getElementById('qrModal')
    var sub = document.getElementById('qrSub')
    var go = document.getElementById('qrGo')
    if (sub) sub.textContent = '长按或扫码添加老师微信，私聊领取解锁码后激活即可刷题'
    if (go) go.setAttribute('href', 'unlock.html')
    m.classList.add('show')
  }
  (function bindQrClose() {
    var m = document.getElementById('qrModal')
    if (!m) return
    document.getElementById('qrClose').addEventListener('click', function () { m.classList.remove('show') })
    document.getElementById('qrMask').addEventListener('click', function () { m.classList.remove('show') })
  })()

  // 已解锁时：把所有「去解锁」入口直接改为「去刷题」，避免重复输码（按方向独立判断）
  function dirActive(d) {
    try { var u = JSON.parse(localStorage.getItem('xf_unlock_' + d) || 'null'); return !!(u && u.untilTs && new Date().getTime() < u.untilTs) } catch (e) { return false }
  }
  function isUnlocked() { return dirActive('monitor') || dirActive('maintain') }
  if (isUnlocked()) {
    document.querySelectorAll('a[href="unlock.html"]').forEach(function (a) { a.href = 'practice.html' })
  }

  // 联系方式（微信号、电话可选显示，默认隐藏；有内容时自动渲染在二维码下方）
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
    })
  }
  WebData.getContact().then(function (c) {
    var qrHint = document.getElementById('qrHint')
    var offline = document.getElementById('offline')
    var qrImg = document.getElementById('qrImg')
    var tw = document.getElementById('teacherWechat')
    var tp = document.getElementById('teacherPhone')
    if (qrImg) qrImg.src = 'assets/images/qr-wechat.png?v=2'
    if (qrHint) qrHint.textContent = c.qrHint
    if (offline) offline.textContent = c.offline
    if (tw && c.wechat) tw.textContent = escapeHtml(c.wechat)
    if (tp && c.phone) tp.textContent = escapeHtml(c.phone)
  })
})()
