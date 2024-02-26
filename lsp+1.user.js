// ==UserScript==
// @name        LSP+1
// @namespace    https://github.com/inory121/tamperscript
// @version      0.1
// @match        https://www.lspsp.me/bonus
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/2.2.4/jquery.min.js
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @description  LSP+1自动领取
// @author       hiiro
// @match        https://www.lspsp.me/bonus
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lspsp.me
// ==/UserScript==

$(function () {
    "use strict"
    GM_registerMenuCommand("重新运行脚本", getGame);
    function getGame() {
        var activeBtns = $('.links>button:not([disabled]):not(.owned)')
        if (activeBtns.length!=0) {
            console.log(activeBtns.length);
            console.log('游戏可以领取啦！！！！！')
            GM_notification({
                title: 'LSP有信息！！',
                text: '游戏可以领取啦！！！！',
                image: 'file:///F:/23535/图片/1649185486400.PNG',
                timeout: 8000,
                // highlight: true,
                onclick: ()=>{alert('来自 onclick 事件')}
              })
            Array.from(activeBtns).forEach(e => {
                if ($(e).attr("data-goid") == 23) {
                    console.log(e, 111111)
                    e.click();
                    $('.actions>button[name=confirm]')?.click();
                } else {
                    console.log(e, 22222222)
                    e.click();
                    $('.actions>button[name=confirm]')?.click();
                }
            });
        }else{
            console.log("没有游戏可以领取");
        }
    }
    getGame();
    setInterval(()=>{
        console.log('定时器开始运行')
        document.location.reload();
    }, 5*60*1000);
})
