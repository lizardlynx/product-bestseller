import { buildCalendar } from './charts/calendar.js';
import { buildHeatmap } from './charts/heatmap.js';
import { initError, openTab } from './common.js';

let productValueSaved = '5902';

async function loadCorrelationMap() {
  const selector = document.getElementById('selector-supplement-data');
  const shopId = document.getElementById('shop-product-correlated');
  const res = await fetch(
    '/correlation?' +
      new URLSearchParams({ productId: selector.value, shopId: shopId.value }),
    {
      method: 'GET',
    }
  );
  if (!res.ok) return initError(await res.text());
  const resJSON = await res.json();
  const data = resJSON.matrix;
  const categories = resJSON.elements;

  buildHeatmap('chart-prices-correlation-heatmap', data, categories);
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
    <option value="daily-diff">Середня зміна ціни за день</option>
    `;
    element.addEventListener('input', loadCorrelationMap);
  }

  element.id = 'selector-supplement-data';
  selectorSupplement.append(element);
}

document.addEventListener('DOMContentLoaded', () => {
  loadCalendar();
  loadCorrelationMap();
  loadShops(productValueSaved);
  createInputSelectorSupplementListener();

  const tableButtons = document.getElementsByClassName('tab-opener-button');
  for (const btn of tableButtons) {
    btn.addEventListener('click', openTab);
  }

  const selector = document.getElementById('product-correlated');
  selector.addEventListener('click', async (e) => {
    selectorCorrelationUpdate(e);
    await loadCorrelationMap();
  });

  const shopSelector = document.getElementById('shop-product-correlated');
  shopSelector.addEventListener('click', loadCorrelationMap);
});
