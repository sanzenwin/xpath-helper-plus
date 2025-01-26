import Bar from './bar'
import {clearHighlights, evaluateQuery, makeQueryForElement} from './xpath'

const bar = new Bar()


// 鼠标移动事件处理函数
let currentEl: any = null
let xpathShort: boolean = true
let xpathBatch: boolean = false
let outputCss: boolean = true

function handleMouseMove(e: any) {
    if (currentEl === e.toElement) return
    currentEl = e.toElement
    if (e.shiftKey) {
        clearHighlights()
        const query = currentEl ? makeQueryForElement(currentEl, xpathShort, xpathBatch, outputCss) : ''
        window.parent.postMessage(JSON.stringify({msg: 'xh-query', query: query, uid: window.xh_uid}), '*')
    }
}

window.xh_uid = Date.now().toString(36) + Math.random().toString(36).substring(2, 12).padStart(12, '0')

window.addEventListener('message', e => {
    let event = {msg: null, query: '', uid: ''}
    try {
        event = JSON.parse(e.data)
    } catch (e) {
    }
    if (event.msg === 'xh-query') {
        if (e.source === window) {
            chrome.runtime.sendMessage({
                type: 'query',
                query: event.query,
                css: outputCss,
                uid: event.uid,
            }).then(() => {
            })
        } else {
            document.querySelectorAll('iframe').forEach(el => {
                if (el.contentWindow === e.source) {
                    event.query = makeQueryForElement(el, xpathShort, xpathBatch, outputCss) + '\n\n' + event.query
                    window.parent.postMessage(JSON.stringify(event), '*')
                }
            })
        }
    }
})


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.cmd === 'xpath') {
        if (request.uid === '' && window.parent === window || window.xh_uid === request.uid) {
            clearHighlights()
            const items = request.value.split('\n\n')
            const res = evaluateQuery(items[items.length - 1], request.css)
            sendResponse(res)
        }
    }
    if (request.cmd === 'short') {
        xpathShort = request.value
    }
    if (request.cmd === 'css') {
        outputCss = request.value
    }
    if (request.cmd === 'batch') {
        xpathBatch = request.value
    }

    if (request.cmd === 'position') {
        bar.moveBar()
    }

    if (request.cmd === 'toggleBar') {
        const isShow = bar.toggleBar()
        if (!isShow) {
            document.removeEventListener('mousemove', handleMouseMove)
        } else {
            document.addEventListener('mousemove', handleMouseMove)
            clearHighlights()
        }
    }
});


