/**
 * 网页版数据层
 * --------------------------------------------------
 * 优先请求本地全栈服务 API（/api/...），失败则回退到内置 mock。
 * 上线时：把 fetch('/api/...') 换成 wx.cloud.callFunction（见 cloudfunctions/）。
 * 字段结构与云数据库保持一致，前端无需改动。
 */

const MOCK_QUESTIONS = [
  { id: 'w001', direction: 'monitor', free: true, type: 'single',
    question: '火灾自动报警系统中，感烟探测器一般在试验烟条件下多少秒内应发出报警信号？',
    options: [ {label:'A',text:'10秒',correct:false},{label:'B',text:'30秒',correct:true},{label:'C',text:'60秒',correct:false},{label:'D',text:'120秒',correct:false} ],
    explanation: '感烟火灾探测器在试验烟条件下，响应时间应在30秒内发出火灾报警信号。' },
  { id: 'w002', direction: 'monitor', free: true, type: 'single',
    question: '消防控制室应当实行几小时值班制度？',
    options: [ {label:'A',text:'8小时',correct:false},{label:'B',text:'12小时',correct:false},{label:'C',text:'24小时',correct:true},{label:'D',text:'16小时',correct:false} ],
    explanation: '消防控制室必须实行24小时值班制度，每班不少于2人，值班人员须持证上岗。' },
  // 维保方向免费试做题 1 道（占位，正式上线后从 bank_maintain 抽）
  { id: 'w101', direction: 'maintain', free: true, type: 'single',
    question: '消防设施维保中，对喷淋泵进行年度检查时，下列哪项不属于必查内容？',
    options: [ {label:'A',text:'主回路绝缘电阻',correct:false},{label:'B',text:'流量/压力测试',correct:false},{label:'C',text:'泵房温湿度记录',correct:true},{label:'D',text:'手动启停按钮',correct:false} ],
    explanation: '泵房温湿度属于日常巡检项，不属于年度深度维保必查内容；其余三项均为《消防设施操作员》维保教材必查项。' }
]

// 套餐：监控 / 维保 两个方向各自独立，均为 ¥9.9 / 3 个月；正式版由后端 /api/packages 下发
const MOCK_PLANS = [
  { id:'p_monitor',  name:'监控方向',   direction:'monitor',  price:9.9,  months:3, unit:'/3个月', per:'含全部题型+模拟考', popular:false, desc:'监控方向题库 · 3 个月' },
  { id:'p_maintain', name:'维保方向',   direction:'maintain', price:9.9,  months:3, unit:'/3个月', per:'含全部题型+模拟考', popular:false, desc:'维保方向题库 · 3 个月' }
]
// 激活码校验：网页与小程序共用 lib/code.js 的 verifyCode（纯前端，方向独立：M监控/K维保/B双方向），无需服务器
const MOCK_CONTACT = { wechat:'', phone:'', qrHint:'扫码添加老师微信，领取试听名额',
  offline:'云南线下实操培训班招生中，小班教学，手把手带练消防设施操作，通过率更有保障。' }

const API_BASE = '' // 同源：前后端同域名部署时留空；本地联调若前后端不同端口再填完整地址（如 http://localhost:8088）

async function api (path, opts) {
  try {
    const url = API_BASE + path
    const r = await fetch(url, opts)
    if (!r.ok) throw new Error('http ' + r.status)
    return await r.json()
  } catch (e) {
    return null // 回退 mock
  }
}

const WebData = {
  async getFreeQuestions (direction) {
    return MOCK_QUESTIONS.filter(function (q) { return !direction || q.direction === direction })
  },
  async getPlans () {
    const r = await api('/api/packages')
    return r && r.ok ? r.data : MOCK_PLANS
  },
  async verifyUnlockCode (code) {
    // 纯前端校验：与小程序同一套激活码算法（lib/code.js 已挂到 window.Code）
    const r = (window.Code ? Code.verifyCode(code) : { ok: false, msg: '校验模块未加载' })
    return r
  },
  async getContact () {
    const r = await api('/api/contact')
    return r && r.ok ? r.data : MOCK_CONTACT
  }
}
window.WebData = WebData
