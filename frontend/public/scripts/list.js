import { initError, openTab, dbShopsData } from './common.js';
import { buildChart } from './chart.js';

function updateColor(colorChange, id) {
  const table = document.getElementById(id);
  if (Array.isArray(colorChange)) {
    for (let i = 0; i < colorChange.length; i++) {
      const shop = colorChange[i];
      const tr = table.querySelectorAll(`tbody>tr`)[i];
      const td = tr.querySelectorAll(`td[data-shop="${shop}"]`)[0];
      td.style.backgroundColor = 'green';
    };
    table.getElementsByClassName('full-price')[0].style.backgroundColor = 'green';
  } else {
    const tds = table.querySelectorAll(`td[data-shop="${colorChange}"]`);
    tds.forEach(td => td.style.backgroundColor = 'green');
  }
}

function recount(resJSON, type) {
  const list = document.getElementsByClassName('list')[0];
  const tab = document.createElement('table');
  tab.setAttribute('id', 'table-'+type);
  tab.classList.add('tab-holder');
  tab.classList.add('hidden');
  let shopsTH = '';
  Object.entries(dbShopsData).forEach(shop => shopsTH += `<th class="shop-title" data-id="${shop[0]}">${shop[1].title}</th>`);

  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  thead.innerHTML = `<tr>
    <th>Товар</th>
    ${shopsTH}
    <th>Вигідніше купляти в</th>
  </tr>`;
  tab.appendChild(thead);
  tab.appendChild(tbody);
  list.appendChild(tab);
  const priceTotal = {};
  let cheapestArr = [];

  for (const [id, product] of Object.entries(resJSON)) {
    let productTr = `<tr><td><a href="/products/${id}">${product.title}</a></td>`;
    let minPrice = {price: Infinity, shop: null, shopI: null};
    for (const [i, shopObj] of Object.entries(dbShopsData)) {
      const shop = shopObj.title;
      if (shop in product.shops) {
        const price = +product.shops[shop].price;
        productTr += `<td data-shop="${i}" title="Last updated ${product.shops[shop].date}">${price}</td>`;
        if (!(shop in priceTotal)) priceTotal[shop] = 0;
        if (minPrice.price > price) {
          minPrice = {price, shop, shopI: i};
        }
        if (type == 0) priceTotal[shop] += price;
      } 
      else productTr += `<td>-</td>`;
    }
    if (type == 1) priceTotal[minPrice.shop] += minPrice.price;
    cheapestArr.push(+(minPrice.shopI));
    productTr += `<td>${minPrice.shop?minPrice.shop:'-'}</td></tr>`;
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
    }
  }
  
  if (type == 0) {
    resTr += `<td>${minShop}</td>`;
    tbody.innerHTML += `<tr><td>Всього</td>${resTr}</tr>`;
    updateColor(iShop, 'table-'+type);
  } else if (type == 1) {
    resTr += `<td class="full-price">${Math.round(fullPrice * 100) / 100 }</td>`;
    tbody.innerHTML += `<tr><td>Всього</td>${resTr}</tr>`;
    updateColor(cheapestArr, 'table-'+type);
  }

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
    <button class="tab-opener-button" data-ref="price-compare-container">Динаміка зміни вартості</button>
  </div>
  <div class="list"></div>`;
  recount(resJSON.list.products, 0);
  recount(resJSON.list.products, 1);
  const tableButtons = document.getElementsByClassName('tab-opener-button');
  for (const btn of tableButtons) {
    btn.addEventListener('click', openTab);
  }

  const chartHolder = document.createElement('div');
  chartHolder.classList.add('tab-holder', 'hidden');
  chartHolder.setAttribute('id', `price-compare-container`);
  listHolder.appendChild(chartHolder);
  buildChart(
    'price-compare-container',
    'Порівняння вартостей',
    resJSON.prices.keys.map((shopId) => dbShopsData[shopId].title).join(', '),
    resJSON.prices.keys.map((shopId) => dbShopsData[shopId].product_url).join(', '),
    'Ціна, грн',
    'травень-червень, 2023',
    4,
    resJSON.prices.data
  );
}

document.addEventListener('DOMContentLoaded', () => {
  const pathname = new URL(location).pathname;
  const id = pathname.split('/')[2];

  loadList(id);
});
