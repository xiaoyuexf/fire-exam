/**
 * 题库 Word 导出（A4 纸质试卷排版）
 * --------------------------------------------------
 * 读取小程序题库 data/questions.js，生成可直接打印的 .docx：
 *   - A4 纸张、页边距
 *   - 标题居中、姓名/得分/日期横线
 *   - 按章节分块，单选题/多选题分别标注
 *   - 选项竖排（A. B. C. D.）
 *   - 文末附「参考答案」
 * 仅管理员可调用（服务端接口已做权限校验）。
 */
// docx 改为懒加载：仅在 buildExamDocx（管理员导出 Word）时才需要，
// 避免部署环境未安装 docx 时整个后端服务无法启动。

// 题库来自小程序 data/questions.js（CommonJS）：{ chapters: [{id,name,questions:[{...}]}] }
const BANK = require('../../data/questions.js')

function allQuestions () {
  const list = []
  ;(BANK.chapters || []).forEach(ch => {
    ;(ch.questions || []).forEach(q => list.push({ chapter: ch.name, ...q }))
  })
  return list
}

function optionText (opt) {
  const v = opt.value || opt.label || ''
  return `${v}. ${opt.text || ''}`
}

function correctLetters (q) {
  if (Array.isArray(q.correctAnswer)) return q.correctAnswer.join('')
  if (q.correctAnswer) return String(q.correctAnswer)
  // 兼容 options 里 isCorrect / correct 标记
  const arr = (q.options || []).filter(o => o.isCorrect || o.correct).map(o => o.value || o.label)
  return arr.join('')
}

/**
 * 生成试卷文档
 * @param {Object} opts
 * @param {string} opts.title  试卷标题
 * @param {string} [opts.direction] 方向过滤: monitor/maintain，默认全部
 * @param {boolean} [opts.withAnswer] 是否带参考答案（默认 true，附在文末）
 */
function buildExamDocx (opts = {}) {
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    AlignmentType, PageOrientation, convertInchesToTwip, LevelFormat
  } = require('docx')
  const title = opts.title || '中级消防设施操作员（理论）模拟试卷'
  const direction = opts.direction || null
  const withAnswer = opts.withAnswer !== false

  const questions = allQuestions().filter(q => {
    if (!direction) return true
    return !q.direction || q.direction === direction || q.direction === 'common'
  })

  const children = []

  // 标题
  children.push(new Paragraph({
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: title, bold: true, size: 36 })]
  }))

  // 考生信息横线
  children.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 200 },
    children: [
      new TextRun('姓名：___________    得分：___________    日期：___________'),
    ]
  }))

  // 按章节组织
  let serial = 0
  ;(BANK.chapters || []).forEach((ch, ci) => {
    const chQuestions = ch.questions.filter(q => {
      if (!direction) return true
      return !q.direction || q.direction === direction || q.direction === 'common'
    })
    if (chQuestions.length === 0) return

    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 160, after: 80 },
      children: [new TextRun({ text: `${'一二三四五六七八九十'[ci] || (ci + 1)}、${ch.name}`, bold: true, size: 24 })]
    }))

    chQuestions.forEach(q => {
      serial++
      const typeLabel = q.type === 'multiple' ? '【多选】' : '【单选】'
      children.push(new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [new TextRun({ text: `${serial}. ${typeLabel}${q.question}`, size: 22 })]
      }))
      ;(q.options || []).forEach(opt => {
        children.push(new Paragraph({
          indent: { left: 360 },
          spacing: { after: 20 },
          children: [new TextRun({ text: optionText(opt), size: 21 })]
        }))
      })
    })
  })

  // 参考答案
  if (withAnswer) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 280, after: 100 },
      children: [new TextRun({ text: '参考答案', bold: true, size: 24 })]
    }))
    const answerLines = []
    let n = 0
    questions.forEach(q => {
      n++
      answerLines.push(`${n}.${correctLetters(q)}`)
    })
    // 每行放 8 个，方便对照
    for (let i = 0; i < answerLines.length; i += 8) {
      children.push(new Paragraph({
        spacing: { after: 20 },
        children: [new TextRun({ text: answerLines.slice(i, i + 8).join('   '), size: 21 })]
      }))
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) }, // A4
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } // 1 inch
        }
      },
      children
    }]
  })

  return Packer.toBuffer(doc)
}

module.exports = { buildExamDocx, allQuestions, correctLetters }

// 直接运行可生成示例文件供预览
if (require.main === module) {
  const fs = require('fs')
  const path = require('path')
  const out = path.join(__dirname, '..', '导出题库示例.docx')
  buildExamDocx({ title: '中级消防设施操作员（理论）模拟试卷' }).then(buf => {
    fs.writeFileSync(out, buf)
    console.log('已生成示例试卷：', out, '字节数:', buf.length)
  })
}
