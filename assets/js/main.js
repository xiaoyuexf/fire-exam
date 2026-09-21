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

  // 首页「去解锁」入口的落点（监控 / 维保 按方向独立判断）：
  //   两个方向都已解锁 → 一律改成「去刷题」，避免重复输码
  //   只解锁了一个方向 → 仍要能进解锁页（否则买不了另一个方向），并带上未解锁方向，让页面明确提示
  //   一个都没解锁   → 保持原样
  function dirActive(d) {
    try { var u = JSON.parse(localStorage.getItem('xf_unlock_' + d) || 'null'); return !!(u && u.untilTs && new Date().getTime() < u.untilTs) } catch (e) { return false }
  }
  var missDirs = []
  if (!dirActive('monitor')) missDirs.push('monitor')
  if (!dirActive('maintain')) missDirs.push('maintain')
  // 匹配所有指向解锁页的入口（含原本已带 ?direction= 的，统一改写；老师专用 ?teacher=1 的链接不动）
  var unlockLinks = []
  document.querySelectorAll('a[href^="unlock.html"]').forEach(function (a) {
    if (a.getAttribute('href').indexOf('teacher=') === -1) unlockLinks.push(a)
  })
  if (!missDirs.length) {
    unlockLinks.forEach(function (a) { a.href = 'practice.html' })
  } else if (missDirs.length === 1) {
    unlockLinks.forEach(function (a) { a.href = 'unlock.html?direction=' + missDirs[0] })
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
