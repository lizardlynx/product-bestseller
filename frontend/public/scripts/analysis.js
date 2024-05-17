import { initError, openTab, dbShopsData } from './common.js';
import { buildChart } from './chart.js';

async function loadStatsAvg() {

  const res = await fetch('/shops/analysis/avg', {
    method: 'GET',
  });
  if (!res.ok) return initError(await res.text());
  const resJSON = await res.json();
  const avgDiff = resJSON;

  const source = Object.values(dbShopsData).map((obj) => obj.title).join(', ');
  const sourceLink = Object.values(dbShopsData).map((obj) => obj.product_url).join(', ');
  
  buildChart('chart-compare-shop-avg-diff', 'Порівняння середніх різниць цін продуктів магазинів', 
    source, sourceLink, 'Ціна, грн',
    'травень-червень, 2023',
    4,
    [avgDiff]
    );
}

async function loadStatsFull() {
  const res = await fetch('/shops/analysis/full', {
    method: 'GET',
  });
  if (!res.ok) return initError(await res.text());
  const resJSON = await res.json();
  const sumPrice = resJSON;

  const source = Object.values(dbShopsData).map((obj) => obj.title).join(', ');
  const sourceLink = Object.values(dbShopsData).map((obj) => obj.product_url).join(', ');

  buildChart('chart-compare-shop-prices', 'Порівняння загальної різниці цін магазинів', 
    source, sourceLink, 'Ціна, грн',
    'травень-червень, 2023',
    4,
    [sumPrice]
    );

}

document.addEventListener('DOMContentLoaded', () => {
  loadStatsFull();
  loadStatsAvg();
  const tableButtons = document.getElementsByClassName('tab-opener-button');
  for (const btn of tableButtons) {
    btn.addEventListener('click', openTab);
  }
});
