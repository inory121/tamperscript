// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @connect      store.steampowered.com
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_xmlhttpRequest
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/2.2.4/jquery.min.js
// @require     file://F:\github project\tamperscript\steampy游戏拥有检测.js
// ==/UserScript==

$(function () {
    'use strict';
    function arrayToObject(array, key) {
        if (!key) {
            return array.reduce((obj, item) => Object.assign(obj, { [item]: 1 }), {});
        }

        return array.reduce((obj, item) => Object.assign(obj, { [item[key]]: item }), {});
    }

    function checkOwn(url) {
        let p = new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                "method": "GET",
                "url": url,
                "onload": (response) => {
                    let userdata = JSON.parse(response.responseText);
                    resolve(userdata);
                },
                "onerror": () => {
                    reject("请求失败")
                }
            });
        })
        return p;
    }

    function checkCard(url) {
        let p = new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                "method": "GET",
                "url": url,
                "timeout": 30000,
                "onload": (response) => {
                    let userdata = JSON.parse(response.responseText);
                    resolve(userdata);
                },
                "onerror": (err) => {
                    reject("请求失败",err)
                }
            });
        })
        return p;
    }

    // checkOwn('https://store.steampowered.com/dynamicstore/userdata').then((value) => {
    //     console.log(value);
    //     const ownedApps = arrayToObject(value.rgOwnedApps);
    //     console.log(ownedApps);
    // }, (reason) => {
    //     console.log(reason);
    // }).catch((err) => {
    //     console.log(err)
    // });

    checkCard('https://bartervg.com/browse/cards/json/').then((value) => {
        // console.log(value);
    }, (reason) => {
        console.log(reason);
    }).catch((err) => {
        console.log(err)
    });


})