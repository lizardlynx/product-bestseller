import { initError, openTab, dbShopsData } from './common.js';
import { buildChart } from './chart.js';

async function loadStats() {
  const res = await fetch('/shops/analysis', {
    method: 'GET',
  });
  if (!res.ok) return initError(await res.text());
  const resJSON = await res.json();

  const source = Object.values(resJSON).map((obj) => obj.name).join(', ');
  const sourceLink = Object.keys(resJSON).map((shopId) => dbShopsData[shopId].product_url).join(', ');

  buildChart('chart-compare-shop-prices', 'Порівняння цін магазинів', 
    source, sourceLink, 'Ціна, грн',
    'травень-червень, 2023',
    4,
    Object.values(resJSON)
    );

}

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
});
