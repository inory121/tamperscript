// ==UserScript==
// @name         Steamgifts 自动点击工具
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  带可恢复最小化面板的自动点击工具
// @author       hiiro
// @match        https://www.steamgifts.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // 添加自定义样式
    GM_addStyle(`
        #sg-auto-click-panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            background: #2d3e50;
            color: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            font-family: Arial, sans-serif;
            min-width: 250px;
            max-width: 350px;
            transition: all 0.3s ease;
        }
        #sg-auto-click-panel.minimized {
            width: 40px;
            height: 40px;
            padding: 0;
            overflow: hidden;
        }
        #sg-auto-click-panel.minimized .panel-content {
            display: none;
        }
        #sg-auto-click-panel.minimized .restore-btn {
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            border: none;
            cursor: pointer;
        }
        .restore-btn {
            display: none;
        }
        .restore-btn::after {
            content: "⚙";
            font-size: 18px;
            color: white;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        #sg-auto-click-panel h3 {
            margin-top: 0;
            color: #f39c12;
            border-bottom: 1px solid #34495e;
            padding-bottom: 8px;
            display: flex;
            justify-content: space-between;
        }
        .panel-controls {
            display: flex;
            gap: 5px;
        }
        .panel-control-btn {
            background: transparent;
            color: white;
            border: none;
            width: 20px;
            height: 20px;
            border-radius: 3px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }
        .panel-control-btn:hover {
            background: rgba(255,255,255,0.2);
        }
        .sg-panel-btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 8px 12px;
            margin: 5px 0;
            border-radius: 3px;
            cursor: pointer;
            width: 100%;
            transition: background 0.3s;
        }
        .sg-panel-btn:hover {
            background: #2980b9;
        }
        .sg-panel-btn.warning {
            background: #e74c3c;
        }
        .sg-panel-btn.warning:hover {
            background: #c0392b;
        }
        .sg-stats {
            margin: 10px 0;
            font-size: 13px;
        }
        #sg-status-message {
            margin: 10px 0;
            padding: 8px;
            background: rgba(0,0,0,0.2);
            border-radius: 3px;
            font-size: 12px;
            min-height: 16px;
        }
        .highlight {
            animation: highlight 2s;
        }
        @keyframes highlight {
            0% { background: rgba(255,255,0,0.5); }
            100% { background: transparent; }
        }
    `);

    // 控制面板HTML
    const panelHTML = `
        <div id="sg-auto-click-panel">
            <button class="restore-btn" title="恢复面板"></button>
            <div class="panel-content">
                <h3>
                    <span>自动点击控制</span>
                    <div class="panel-controls">
                        <button class="panel-control-btn minimize-btn" title="最小化">−</button>
                        <button class="panel-control-btn close-btn" title="关闭">×</button>
                    </div>
                </h3>
                <div class="sg-stats">
                    <div>找到元素: <span id="sg-found-count">0</span></div>
                    <div>已点击: <span id="sg-clicked-count">0</span></div>
                </div>
                <div id="sg-status-message">准备就绪</div>
                <button id="sg-start-btn" class="sg-panel-btn">开始自动点击</button>
                <button id="sg-stop-btn" class="sg-panel-btn warning" disabled>停止</button>
                <button id="sg-test-btn" class="sg-panel-btn">测试查找元素</button>
            </div>
        </div>
    `;

    // 全局变量
    let clickInterval;
    let foundElements = [];
    let clickedCount = 0;
    let isRunning = false;

    // 显示状态消息
    function showStatusMessage(message, isHighlight = false) {
        const statusEl = document.getElementById('sg-status-message');
        statusEl.textContent = message;
        if (isHighlight) {
            statusEl.classList.add('highlight');
            setTimeout(() => statusEl.classList.remove('highlight'), 2000);
        }
    }

    // 检查元素可见性
    function isElementVisible(element) {
        if (!element) return false;

        if (window.getComputedStyle(element).display === 'none') {
            return false;
        }

        let parent = element.parentElement;
        while (parent && parent !== document.body) {
            if (window.getComputedStyle(parent).display === 'none') {
                return false;
            }
            parent = parent.parentElement;
        }

        return true;
    }

    // 查找目标元素
    function findTargetElements() {
        const allElements = document.querySelectorAll('.sidebar__entry-custom.sidebar__entry-insert');
        foundElements = Array.from(allElements).filter(element => {
            return element.classList.length === 2 &&
                   element.classList.contains('sidebar__entry-custom') &&
                   element.classList.contains('sidebar__entry-insert') &&
                   isElementVisible(element);
        });

        document.getElementById('sg-found-count').textContent = foundElements.length;
        document.getElementById('sg-clicked-count').textContent = clickedCount;

        return foundElements;
    }

    // 执行点击
    function performClick(index) {
        if (index >= foundElements.length) {
            stopAutoClick();
            showStatusMessage(`已完成所有点击 (共 ${clickedCount} 个)`, true);
            return;
        }

        foundElements[index].click();
        clickedCount++;
        document.getElementById('sg-clicked-count').textContent = clickedCount;
        showStatusMessage(`正在点击第 ${clickedCount}/${foundElements.length} 个元素`);
    }

    // 开始自动点击
    function startAutoClick() {
        if (isRunning) return;

        findTargetElements();
        if (foundElements.length === 0) {
            showStatusMessage("未找到符合条件的元素", true);
            return;
        }

        isRunning = true;
        clickedCount = 0;
        document.getElementById('sg-start-btn').disabled = true;
        document.getElementById('sg-stop-btn').disabled = false;

        showStatusMessage(`开始自动点击 ${foundElements.length} 个元素`, true);

        let currentIndex = 0;
        performClick(currentIndex);

        clickInterval = setInterval(() => {
            currentIndex++;
            performClick(currentIndex);
        }, 1000);
    }

    // 停止自动点击
    function stopAutoClick() {
        if (!isRunning) return;

        clearInterval(clickInterval);
        isRunning = false;
        document.getElementById('sg-start-btn').disabled = false;
        document.getElementById('sg-stop-btn').disabled = true;
        showStatusMessage(`已停止 (已点击 ${clickedCount} 个)`);
    }

    // 初始化控制面板
    function initControlPanel() {
        // 添加面板到页面
        document.body.insertAdjacentHTML('beforeend', panelHTML);

        // 获取面板元素
        const panel = document.getElementById('sg-auto-click-panel');
        const minimizeBtn = panel.querySelector('.minimize-btn');
        const closeBtn = panel.querySelector('.close-btn');
        const restoreBtn = panel.querySelector('.restore-btn');

        // 面板控制按钮事件
        minimizeBtn.addEventListener('click', () => {
            panel.classList.add('minimized');
        });

        restoreBtn.addEventListener('click', () => {
            panel.classList.remove('minimized');
        });

        closeBtn.addEventListener('click', () => {
            stopAutoClick();
            panel.style.display = 'none';
            showStatusMessage("面板已隐藏 - 刷新页面可重新显示");
        });

        // 功能按钮事件
        document.getElementById('sg-start-btn').addEventListener('click', startAutoClick);
        document.getElementById('sg-stop-btn').addEventListener('click', stopAutoClick);
        document.getElementById('sg-test-btn').addEventListener('click', () => {
            findTargetElements();
            if (foundElements.length > 0) {
                showStatusMessage(`找到 ${foundElements.length} 个元素，已高亮显示`, true);
                foundElements.forEach(el => {
                    el.style.outline = '2px solid red';
                    setTimeout(() => el.style.outline = '', 3000);
                });
            } else {
                showStatusMessage("未找到符合条件的元素", true);
            }
        });
    }

    // 页面加载完成后初始化
    if (document.readyState === 'complete') {
        initControlPanel();
    } else {
        window.addEventListener('load', initControlPanel);
    }
})();