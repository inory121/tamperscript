// ==UserScript==
// @name         Steam 许可证分页显示
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  保证数据全部加载后再分页，彻底解决数据缺失问题
// @author       You
// @match        https://store.steampowered.com/account/licenses/
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 添加自定义CSS样式，三列宽度固定为12%:68%:20%
    GM_addStyle(`
        .tm-pagination {
            margin: 20px 0;
            padding: 15px;
            background: rgba(42, 71, 94, 0.7);
            border-radius: 4px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        .tm-page-btn {
            margin: 0;
            padding: 8px 12px;
            background: #1a9fff;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
            min-width: 40px;
        }
        .tm-page-btn.active {
            background: #0e5a8a;
            font-weight: bold;
        }
        .tm-page-btn:hover {
            background: #0e7ccc;
        }
        .tm-page-btn:disabled {
            background: #4a5a6a;
            cursor: not-allowed;
        }
        .tm-page-info {
            color: #c6d4df;
            margin: 0 15px;
            font-size: 14px;
        }
        .tm-items-per-page {
            margin-left: 15px;
            color: #c6d4df;
            font-size: 14px;
        }
        .tm-items-per-page select {
            background: rgba(42, 71, 94, 0.7);
            color: #c6d4df;
            border: 1px solid #1a9fff;
            border-radius: 3px;
            padding: 5px;
        }
        .account_table {
            width: 100% !important;
            table-layout: fixed !important;
        }
        .account_table th.license_date_col,
        .account_table td.license_date_col {
            width: 12%;
        }
        .account_table th.license_acquisition_col,
        .account_table td.license_acquisition_col {
            width: 20%;
        }
        .account_table th,
        .account_table td {
            word-break: break-all;
        }
    `);

    window.addEventListener('DOMContentLoaded', function() {
        // 检查tbody和tr数量，确认数据已加载
        const table = document.querySelector('.account_table');
        const tbody = table && table.querySelector('tbody');
        if (!tbody || tbody.children.length === 0) return;
        // 缓存表头和数据行（Steam页面表头就在tbody第一个tr）
        const allRows = Array.from(tbody.querySelectorAll('tr'));
        const headerRow = allRows[0];
        const dataRows = allRows.slice(1);
        // 清空tbody
        tbody.innerHTML = '';
        initPagination(table, tbody, headerRow, dataRows);
    });

    function initPagination(licenseTable, tbody, headerRow, dataRows) {
        let itemsPerPage = GM_getValue('itemsPerPage', 15);
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'tm-pagination';
        const firstBtn = document.createElement('button');
        firstBtn.className = 'tm-page-btn';
        firstBtn.innerHTML = 'first';
        firstBtn.title = '第一页';
        paginationDiv.appendChild(firstBtn);
        const prevBtn = document.createElement('button');
        prevBtn.className = 'tm-page-btn';
        prevBtn.innerHTML = '&laquo;';
        prevBtn.title = '上一页';
        paginationDiv.appendChild(prevBtn);
        const pageBtnsContainer = document.createElement('div');
        pageBtnsContainer.style.display = 'flex';
        pageBtnsContainer.style.gap = '5px';
        paginationDiv.appendChild(pageBtnsContainer);
        const nextBtn = document.createElement('button');
        nextBtn.className = 'tm-page-btn';
        nextBtn.innerHTML = '&raquo;';
        nextBtn.title = '下一页';
        paginationDiv.appendChild(nextBtn);
        const lastBtn = document.createElement('button');
        lastBtn.className = 'tm-page-btn';
        lastBtn.innerHTML = 'last';
        lastBtn.title = '最后一页';
        paginationDiv.appendChild(lastBtn);
        const pageInfo = document.createElement('span');
        pageInfo.className = 'tm-page-info';
        paginationDiv.appendChild(pageInfo);
        const itemsPerPageContainer = document.createElement('div');
        itemsPerPageContainer.className = 'tm-items-per-page';
        itemsPerPageContainer.innerHTML = `
            每页显示: 
            <select id="tm-items-per-page-select">
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="50">50</option>
                <option value="100">100</option>
            </select>
        `;
        const itemsPerPageSelect = itemsPerPageContainer.querySelector('select');
        itemsPerPageSelect.value = itemsPerPage;
        paginationDiv.appendChild(itemsPerPageContainer);
        licenseTable.parentNode.insertBefore(paginationDiv, licenseTable);
        let currentPage = 1;
        let totalPages = Math.ceil(dataRows.length / itemsPerPage);
        const updatePaginationButtons = () => {
            pageBtnsContainer.innerHTML = '';
            let startPage = Math.max(1, currentPage - 3);
            let endPage = Math.min(totalPages, currentPage + 3);
            if (endPage - startPage < 6) {
                if (currentPage < 4) {
                    endPage = Math.min(7, totalPages);
                } else {
                    startPage = Math.max(totalPages - 6, 1);
                }
            }
            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'tm-page-btn';
                if (i === currentPage) pageBtn.classList.add('active');
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => showPage(i));
                pageBtnsContainer.appendChild(pageBtn);
            }
            prevBtn.disabled = currentPage === 1;
            nextBtn.disabled = currentPage === totalPages;
            firstBtn.disabled = currentPage === 1;
            lastBtn.disabled = currentPage === totalPages;
            const startItem = (currentPage - 1) * itemsPerPage + 1;
            const endItem = Math.min(currentPage * itemsPerPage, dataRows.length);
            pageInfo.textContent = `显示 ${startItem}-${endItem} 条，共 ${dataRows.length} 条`;
        };
        const showPage = (pageNum) => {
            currentPage = Math.max(1, Math.min(pageNum, totalPages));
            tbody.innerHTML = '';
            // 每一页都插入表头（cloneNode保证不会丢失）
            tbody.appendChild(headerRow.cloneNode(true));
            const startIndex = (pageNum - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, dataRows.length);
            for (let i = startIndex; i < endIndex; i++) {
                tbody.appendChild(dataRows[i]);
            }
            updatePaginationButtons();
        };
        itemsPerPageSelect.addEventListener('change', () => {
            itemsPerPage = parseInt(itemsPerPageSelect.value);
            GM_setValue('itemsPerPage', itemsPerPage);
            totalPages = Math.ceil(dataRows.length / itemsPerPage);
            currentPage = Math.min(currentPage, totalPages);
            showPage(currentPage);
        });
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) showPage(currentPage - 1);
        });
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) showPage(currentPage + 1);
        });
        firstBtn.addEventListener('click', () => {
            if (currentPage !== 1) showPage(1);
        });
        lastBtn.addEventListener('click', () => {
            if (currentPage !== totalPages) showPage(totalPages);
        });
        showPage(1);
    }
})();