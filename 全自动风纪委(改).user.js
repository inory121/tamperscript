// ==UserScript==
// @name         全自动风纪委(改)
// @description  进入评价界面自动开始提交风纪委评价
// @namespace    http://tampermonkey.net
// @supportURL   https://github.com/ZiuChen/userscript
// @version      0.7.1
// @author       ZiuChen
// @match        https://www.bilibili.com/judgement*
// @match        https://limestart.cn/
// @icon         https://fastly.jsdelivr.net/gh/ZiuChen/ZiuChen@main/avatar.jpg
// @require     https://cdn.bootcdn.net/ajax/libs/jquery/2.2.4/jquery.min.js
// @grant        GM_registerMenuCommand
// @license      MIT
// ==/UserScript==

/* 原理：DOM操作模拟点击，不会被检测异常 */
/* 使用方法：进入第一个案件后按下Enter，后续无需人工干预自动完成所有风纪委任务 */
/* 仅供学习交流使用，安装后请于24小时内删除 */
$(function () {
  'use strict';
  const isBLPage = (window.location.href.toString().indexOf('https://www.bilibili.com/') != -1)
  const date = new Date().getDate()
  function SetDateStore() {
    localStorage.setItem('BL-SCRIPT-LAST-RUN', date)
  }
  function CompareDateStore() {
    return localStorage.getItem('BL-SCRIPT-LAST-RUN') == date
  }

  const CONFIG = {
    是否合适: 0, // 0合适 好 | 1一般 普通 | 2不合适 差 | 3无法判断 无法判断
    会观看吗: 1, // 0会观看 | 1不会观看
    是否匿名: true // true匿名 | false非匿名
  }

  const randInt = (min, max) => {
    return parseInt(Math.random() * (max - min + 1) + min, 10)
  }

  const sleep = async (timeout) => {
    timeout += randInt(500, 1000) // 随机延迟
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, timeout)
    })
  }

  const btnClick = (selector, index = 0) => $(selector)[index]?.click()

  const callBackFn = async () => {
    // TODO: 添加跳出递归的条件
    return await sleep(2000)
      .then(() => {
        btnClick('.vote-btns .btn-group button', [CONFIG['是否合适']])
        btnClick('.vote-btns .will-you-watch button', [CONFIG['会观看吗']])
        CONFIG['是否匿名'] && btnClick('.vote-anonymous .v-check-box__label')
      })
      .then(() => btnClick('.vote-submit button')) // 提交
      .then(() => sleep(5000))
      .then(() => btnClick('.vote-result button')) // 跳转下一题
      .then(() => callBackFn())
      .catch((err) => confirm(`[全自动风纪委] 出错: ${err}, 点击确定刷新`) && location.reload())
  }

  if (CompareDateStore()) {
    return
  }
  if (!isBLPage) {
    SetDateStore()
    window.open('https://www.bilibili.com/judgement')
  }

  let text = $('.item-button')[0]?.innerText
  if (text === '投票次数已用完' || text === '无新任务') {
    console.log('[风纪自动投票]没有众议次数');
    return
  } else if (text === '开始众议') {
    btnClick('.item-button button', [0])
    callBackFn()
  }
})