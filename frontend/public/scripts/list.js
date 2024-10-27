import { buildChart } from './charts/chart.js';
import { dbShopsData, initError, updateTabOpenerListeners } from './common.js';

function updateColor(colorChange, id, updateColorArr = null) {
  const table = document.getElementById(id);
  if (Array.isArray(colorChange)) {
    for (let i = 0; i < colorChange.length; i++) {
      const shop = colorChange[i];
      const tr = table.querySelectorAll(`tbody>tr`)[i];
      const td = tr.querySelectorAll(`td[data-shop="${shop}"]`)[0];
      td.style.backgroundColor = 'green';
    }
    table.getElementsByClassName('full-price')[0].style.backgroundColor =
      'green';
  } else {
    const tds = table.querySelectorAll(`td[data-shop="${colorChange}"]`);
    tds.forEach((td, index) => {
      updateColorArr.includes(index)
        ? (td.style.backgroundColor = 'green')
        : null;
      console.log(index, updateColorArr.includes(index));
    });
  }
}

function recount(resJSON, type) {
  const points = {
    0: [
      '*Результат - магазин де можна купити список товарів найдешевше;',
      '*Товари, яких немає в одному з магазинів, <b>виключаться</b> з розрахунку.',
    ],
    1: [
      '*Результат - розрахунок найдешевшої вартості для списку продуктів;',
      '*Товари, яких немає в одному з магазинів, <b>не виключаться</b> з розрахунку.',
    ],
  };

  const list = document.getElementsByClassName('list')[0];
  const tabDiv = document.createElement('div');
  tabDiv.innerHTML = `<p class="table-points">${points[+type].join(
    '<br>'
  )}</p>`;
  const tab = document.createElement('table');
  tabDiv.setAttribute('id', 'table-' + type);
  tabDiv.classList.add('tab-holder');
  tabDiv.classList.add('hidden');
  let shopsTH = '';
  Object.entries(dbShopsData).forEach(
    (shop) =>
      (shopsTH += `<th class="shop-title" data-id="${shop[0]}">${shop[1].title}</th>`)
  );

  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  thead.innerHTML = `<tr>
    <th>Товар</th>
    ${shopsTH}
    <th>Вигідніше купляти в</th>
  </tr>`;
  tab.appendChild(thead);
  tab.appendChild(tbody);
  tabDiv.appendChild(tab);
  list.appendChild(tabDiv);
  const priceTotal = {};
  const shopProductExists = [];
  let cheapestArr = [];

  for (const key in Object.keys(resJSON)) {
    const id = Object.keys(resJSON)[key];
    const product = resJSON[id];
    let productTr = `<tr><td><a href="/products/${id}">${product.title}</a></td>`;
    let minPrice = { price: Infinity, shop: null, shopI: null };
    const tableShopIgnore = product.tableShopIgnore;
    for (const [i, shopObj] of Object.entries(dbShopsData)) {
      const shop = shopObj.title;
      if (shop in product.shops) {
        const price = +product.shops[shop].price;
        productTr += `<td data-shop="${i}" title="Last updated ${product.shops[shop].date}">${price}</td>`;
        if (!(shop in priceTotal)) priceTotal[shop] = 0;
        if (minPrice.price > price) {
          minPrice = { price, shop, shopI: i };
        }
        if (type == 0 && !tableShopIgnore) {
          priceTotal[shop] += price;
          if (!shopProductExists.includes(+key)) shopProductExists.push(+key);
        }
      } else productTr += `<td data-shop="${i}">-</td>`;
    }
    if (type == 1) {
      priceTotal[minPrice.shop] += minPrice.price;
      cheapestArr.push(+minPrice.shopI);
    }
    productTr += `<td>${minPrice.shop ? minPrice.shop : '-'}</td></tr>`;
    tbody.innerHTML += productTr;
  }

  let resTr = '';
  let minPrice = Infinity;
  let minShop = '-';
  let iShop = 0;
  let fullPrice = 0;
  for (const [i, shopObj] of Object.entries(dbShopsData)) {
    const shop = shopObj.title;
    const price = priceTotal[shop];
    resTr += `<td data-shop="${i}">${Math.round(price * 100) / 100}</td>`;
    fullPrice += price;
    if (price < minPrice) {
      minPrice = price;
      minShop = shop;
      iShop = i;
      shopProductExists.push(Object.keys(resJSON).length);
    }
  }

  if (type == 0) {
    resTr += `<td>${minShop}</td>`;
    tbody.innerHTML += `<tr><td>Всього</td>${resTr}</tr>`;
    updateColor(iShop, 'table-' + type, shopProductExists);
  } else if (type == 1) {
    resTr += `<td class="full-price">${Math.round(fullPrice * 100) / 100}</td>`;
    tbody.innerHTML += `<tr><td>Всього</td>${resTr}</tr>`;
    updateColor(cheapestArr, 'table-' + type);
  }
}

function createChart(
  chartId,
  chartName,
  tabId,
  source,
  sourceLink,
  data,
  point = '',
  type = 'line'
) {
  const listHolder = document.getElementsByClassName('list-holder')[0];
  const tabHolder = document.createElement('div');
  tabHolder.innerHTML = `<p class="table-points">${point}</p>`;
  const chartHolder = document.createElement('div');
  tabHolder.classList.add('tab-holder', 'hidden');
  chartHolder.setAttribute('id', chartId);
  tabHolder.setAttribute('id', tabId);
  tabHolder.appendChild(chartHolder);
  listHolder.appendChild(tabHolder);
  buildChart(
    chartId,
    chartName,
    source,
    sourceLink,
    'Ціна, грн',
    'травень-червень, 2023',
    4,
    data,
    type
  );
}

async function loadList(id) {
  const res = await fetch('/lists/' + id + '/data', {
    method: 'GET',
  });
  if (!res.ok) return initError(await res.text());

  const resJSON = await res.json();
  const listHolder = document.getElementsByClassName('list-holder')[0];
  listHolder.innerHTML = `
  <h1>${resJSON.list.list}</h1>
  <div class="tab-buttons">
    <button class="tab-opener-button" data-ref="table-0">За магазинами</button>
    <button class="tab-opener-button" data-ref="table-1">За продуктами</button>
    <button class="tab-opener-button" data-ref="chart-0">Динаміка зміни вартості</button>
  </div>
  <div class="list"></div>`;
  recount(resJSON.list.products, 0);
  recount(resJSON.list.products, 1);
  const source = resJSON.prices.keys
    .map((shopId) => dbShopsData[shopId].title)
    .join(', ');
  const sourceLink = resJSON.prices.keys
    .map((shopId) => dbShopsData[shopId].product_url)
    .join(', ');

  createChart(
    'price-compare-container',
    'Порівняння вартостей',
    `chart-0`,
    source,
    sourceLink,
    resJSON.prices.data,
    '*Графік порівняння вартостей <b>з виключенням</b> продуктів, яких немає в одному з магазинів'
  );

  const buttons = document.getElementsByClassName('tab-buttons')[0];
  for (const key of Object.keys(resJSON.byShop)) {
    const shopName = dbShopsData[key].title.toString();
    const btn = `<button class="tab-opener-button" data-ref="chart-shop-tab-${key}">Динаміка зміни цін ${shopName}</button>`;
    buttons.innerHTML += btn;
    createChart(
      `chart-shop-${key}`,
      'Порівняння цін',
      `chart-shop-tab-${key}`,
      shopName,
      dbShopsData[key].product_url,
      Object.values(resJSON.byShop[key]),
      '*Графік порівняння вартостей, <b>без виключення</b> продуктів, яких немає в одному з магазинів',
      'area'
    );
  }

  updateTabOpenerListeners();
}

document.addEventListener('DOMContentLoaded', () => {
  const pathname = new URL(location).pathname;
  const id = pathname.split('/')[2];

  loadList(id);
});
