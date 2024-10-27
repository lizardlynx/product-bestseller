import { buildCalendar } from './charts/calendar.js';
import { buildChart } from './charts/chart.js';
import { buildHeatmap } from './charts/heatmap.js';
import {
  deleteExtraCache,
  getDate,
  initError,
  updateTabOpenerListeners,
} from './common.js';

let productValueSaved = '5902';

async function loadCorrelationMap() {
  const selector = document.getElementById('selector-supplement-data');
  const shopId = document.getElementById('shop-product-correlated');
  const key = [getDate(), selector.value, shopId.value].join(' | ');
  const item = localStorage.getItem(key);
  let resJSON = item ? JSON.parse(item) : null;
  if (!resJSON) {
    const res = await fetch(
      '/correlation?' +
        new URLSearchParams({
          productId: selector.value,
          shopId: shopId.value,
        }),
      {
        method: 'GET',
      }
    );
    if (!res.ok) return initError(await res.text());
    resJSON = await res.json();
    localStorage.setItem(key, JSON.stringify(resJSON));
  }

  const data = resJSON.matrix;
  const categories = resJSON.elements;
  const chart = resJSON.chart;

  buildHeatmap('chart-prices-correlation-heatmap', data, categories);
  buildChart(
    'chart-prices-correlation',
    'Графік значень',
    '',
    '',
    '',
    'травень-червень, 2023',
    4,
    chart
  );

  const wrapperTableDiv = document.getElementById('prices-percent-change');
  wrapperTableDiv.innerHTML = '';
  if (resJSON.bigPriceChange) {
    let currDate = null;
    let tbody = null;
    const postfix = '-table';
    const dates = Object.keys(resJSON.bigPriceChange).sort();
    for (const date of dates) {
      const arr = resJSON.bigPriceChange[date];
      if (currDate != date) {
        let tableHolder = document.createElement('div');
        tableHolder.classList.add('tab-holder' + postfix);
        tableHolder.classList.add('hidden');
        let currTable = document.createElement('table');
        const tableId = `price-percent-change-table-${date}`;
        tableHolder.id = tableId;
        const thead = document.createElement('thead');
        thead.innerHTML = `
        <tr>
          <th>Продукт</th>
          <th>Зміна ціни з попереднього дня, %</th>
        </tr>`;
        currTable.appendChild(thead);
        tbody = document.createElement('tbody');
        currTable.appendChild(tbody);
        wrapperTableDiv.innerHTML += `<h3 class="tab-opener-button${postfix}" data-ref="${tableId}">${date} (${arr.length})</h3>`;
        tableHolder.appendChild(currTable);
        wrapperTableDiv.appendChild(tableHolder);
      }

      for (const { product_id, changePercent, title } of arr) {
        tbody.innerHTML += `
        <tr>
          <td>
            <a href="/products/${product_id}">${title}</a>
          </td>
          <td>
            ${changePercent.toFixed(2)}
          </td>
        </tr>`;
      }
    }
    updateTabOpenerListeners(postfix);
  }
}

async function loadCalendar() {
  // const res = await fetch('/calendar', {
  //   method: 'GET',
  // });
  // if (!res.ok) return initError(await res.text());
  // const resJSON = await res.json();
  // const sumPrice = resJSON;

  const data = [
    {
      date: '2023-07-01',
      temperature: 19.1,
    },
    {
      date: '2023-07-02',
      temperature: 15.3,
    },
  ];

  buildCalendar('chart-prices-diff-calendar', data);
}

async function loadShops(id) {
  const selector = document.getElementById('shop-product-correlated');
  const res = await fetch('/product/' + id, {
    method: 'GET',
  });
  if (!res.ok) return initError(await res.text());
  const resJSON = await res.json();
  selector.innerHTML = '';
  if (resJSON.length > 1) {
    selector.innerHTML = `<option value="all">Всі</option>`;
  }
  for (const shop of resJSON) {
    let text = 'Сільпо';
    if (shop.title === 'auchan') text = 'Ашан';
    selector.innerHTML += `<option value="${shop.id}">${text}</option>`;
  }
}

function createInputSelectorSupplementListener(element = undefined) {
  if (!element) {
    element = document.getElementById('selector-supplement-data');
  }
  if (!element) return;
  element.addEventListener('input', async (e) => {
    await loadShops(e.target.value);
    await loadCorrelationMap();
  });
}

function selectorCorrelationUpdate(e) {
  const value = e.target.value;
  const selectorSupplement = document.getElementById('selector-supplement');
  selectorSupplement.innerHTML = '';
  let element;
  if (value === 'product') {
    element = document.createElement('input');
    element.type = 'number';
    element.value = productValueSaved;
    element.min = '1';
    createInputSelectorSupplementListener(element);
  } else {
    element = document.createElement('select');
    element.innerHTML = `
      <option value="daily-diff">Відносно попереднього дня</option>
      <option value="first-day-diff">Відносно першого дня</option>
      <option value="avg-day">Середня ціна</option>
    `;
    element.addEventListener('input', loadCorrelationMap);
  }

  element.classList.add('p-settings');
  element.style = 'margin: 10px 0;';
  element.id = 'selector-supplement-data';
  selectorSupplement.append(element);
}

document.addEventListener('DOMContentLoaded', () => {
  loadCalendar();
  loadCorrelationMap();
  loadShops(productValueSaved);
  createInputSelectorSupplementListener();

  updateTabOpenerListeners();

  const selector = document.getElementById('product-correlated');
  selector.addEventListener('input', async (e) => {
    selectorCorrelationUpdate(e);
    await loadCorrelationMap();
  });

  const shopSelector = document.getElementById('shop-product-correlated');
  shopSelector.addEventListener('input', loadCorrelationMap);
  deleteExtraCache(getDate());
});
