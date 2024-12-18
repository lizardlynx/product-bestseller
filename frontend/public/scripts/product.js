import { buildChart } from './charts/chart.js';
import { initError, insertBreadcrumbs, firstToUpper, openTab, dbShopsData } from './common.js';

function createProductHTML(product) {
  const productDiv = document.createElement('div');
  productDiv.classList.add('product');
  productDiv.setAttribute('data-id', product.id);
  let html = '';
  html = `<img class="block1" src="${product.image}" width="400px" alt="${product.title}"><div class="block2"><div>
  <div class="title" >${product.title}</div>`;
  if (product.weight_g) html += `<div><span class="naming">Вага: </span>${product.weight_g} г</div>`;
  if (product.brand) html += `<div><span class="naming">Бренд: </span>${firstToUpper(product.brand)}</div>`;
  if (product.country) html += `<div><span class="naming">Країна: </span>${firstToUpper(product.country)}</div>`;
  const originalLinks = {};

  for (const shop of Object.keys(product.prices)) {
    const prices = product.prices[shop];
    html += `<div class="price-holder"><div class="shop-name" title="See Original Product" data-shop="${shop}">${dbShopsData[shop].title}</div>`;
    for (const price of prices) {
      html += `<div class="price ${
        price.comment == 'oldPrice' ? 'old-price' : ''
      }">${
        price.comment == 'priceOpt' ? 'Оптова ціна:' : ''
      }<span class="price-text">${price.price} грн</span></div>`;
    }
    html += '</div>';
  }
  html += '</div>';
  html += '<div class="shop-comparer">';
  for (const shop of Object.keys(product.features)) {
    const features = product.features[shop];
    let shopHTML = '';
    shopHTML += '<div class="shop">';
    shopHTML += `<div class="shop-title">Характеристики продукта ${dbShopsData[shop].title}</div>`;
    originalLinks[shop] = ''
    for (const feature of features) {
      if (feature.title == 'id' && dbShopsData[shop].title == 'Auchan') 
        originalLinks[shop] += ('-' + feature.value);
      else if (feature.title == 'url_key')
        originalLinks[
          shop
        ] = `${dbShopsData[shop].product_url}${feature.value}` + originalLinks[shop];
      else
      shopHTML += `<div class="feature"><div class="feature-description">${feature.title}</div><div class="price">${feature.value}</div></div>`;
    }
    shopHTML += '</div>';
    if (features.length > 2) html+= shopHTML;
  }
  html += '</div>';

  productDiv.innerHTML = html;
  const chartButtons = document.getElementsByClassName('tab-buttons')[0];
  const shopDivs = productDiv.getElementsByClassName('shop-name');
  const predictionSettings = document.getElementsByClassName('p-settings');
  for (let shopDiv of shopDivs) {
    const shop = shopDiv.getAttribute('data-shop');
    const title = dbShopsData[shop].title;
    const a = document.createElement('a');
    a.classList.add('shop-name');
    a.classList.add('shop-name-desc');
    a.classList.add(title);
    predictionSettings[0].innerHTML += `<option value="${shop}">${title}</option>`;
    a.setAttribute('title', 'Оригінальний товар');
    a.setAttribute('href', originalLinks[shop]);
    a.innerText = title;
    shopDiv.replaceWith(a);
    chartButtons.innerHTML += `<button class="tab-opener-button" data-ref="${shop}-container">${dbShopsData[shop].title} зміна ціни</button>`;
  }
  if (shopDivs.length > 1) chartButtons.innerHTML += `<button data-ref="price-compare-container" class="tab-opener-button">Порівняти ціни</button>`;
  return productDiv;
}

async function loadProduct(productId) {
  const productHolder = document.getElementsByClassName('product-holder')[0];

  const res = await fetch('/products/' + productId + '/data', {
    method: 'GET',
  });
  if (!res.ok) return initError(await res.text());

  const resJSON = await res.json();
  const product = resJSON.product;
  const breadcrumbs = resJSON.breadcrumbs;

  const productDiv = createProductHTML(product);
  productHolder.appendChild(productDiv);
  const chartButtons = document.getElementsByClassName('tab-opener-button');
  for (const btn of chartButtons) {
    btn.addEventListener('click', openTab);
  }
  insertBreadcrumbs(breadcrumbs);
}

async function loadPrices(productId) {
  const res = await fetch('/products/' + productId + '/prices', {
    method: 'GET',
  });
  if (!res.ok) return initError(await res.text());

  const resJSON = await res.json();
  const chartsHolder = document.getElementsByClassName('charts-holder')[0];
  const shopsPrices = [];
  for (const shopId in resJSON) {
    const shop = dbShopsData[shopId].title;
    const shopUrl = dbShopsData[shopId].product_url;
    const chartHolder = document.createElement('div');
    chartHolder.classList.add('tab-holder', 'hidden');
    chartHolder.setAttribute('id', `${shopId}-container`);
    chartsHolder.appendChild(chartHolder);
    const data = resJSON[shopId];
    const currentPrice = data.filter(item => item.name=='price')[0];
    shopsPrices.push({name: shop, dates: currentPrice.dates, data: currentPrice.data});
    buildChart(
      shopId + '-container',
      'Зміна ціни',
      shop,
      shopUrl,
      'Ціна, грн',
      'травень-червень, 2023',
      4,
      data
    );
  }

  const shopKeys = Object.keys(resJSON);
  if (shopKeys.length > 1) {
    const chartHolder = document.createElement('div');
    chartHolder.classList.add('tab-holder', 'hidden');
    chartHolder.setAttribute('id', `price-compare-container`);
    chartsHolder.appendChild(chartHolder);
    console.log('shopsPrices', shopsPrices);
    buildChart(
      'price-compare-container',
      'Порівняння цін',
      shopKeys.map((shopId) => dbShopsData[shopId].title).join(', '),
      shopKeys.map((shopId) => dbShopsData[shopId].product_url).join(', '),
      'Ціна, грн',
      'травень-червень, 2023',
      4,
      shopsPrices
    );
  }
}

async function loadMethods() {
  const res = await fetch('/predictions/methods', {
    method: 'GET',
  });
  if (!res.ok) return initError(await res.text());

  const methods = await res.json();
  const methodsSelect = document.getElementById('method-dropdown');
  for (const [value, name] of Object.entries(methods)) {
    methodsSelect.innerHTML += `<option value="${value}">${name}</option>`;
  }
}

async function loadPredictions(productId) {
  const method = document.getElementById('method-dropdown').value;
  const shopId = document.getElementById('shop-dropdown').value;
  const period = document.getElementById('period').value;
  const res = await fetch('/predictions/' + method + '?' + new URLSearchParams({ id: productId, shopId, period, priceComment: 'price' }), {
    method: 'GET',
  });
  if (!res.ok) return initError(await res.text());
  const json = await res.json();

  const periodInput = document.getElementById('period');
  const predictionsWrapper = document.getElementsByClassName('predictions-wrapper')[0];
  predictionsWrapper.classList.remove('hidden');

  periodInput.setAttribute('min', json.period.min);

  if (json.period.max === null) {
    periodInput.removeAttribute('max');
  } else {
    periodInput.setAttribute('max', json.period.max);
    if (period > json.period.max || period < json.period.min) {
      periodInput.value = json.period.max ?? 10;
    }
  }



  buildChart(
    'predictions',
    'Аналіз цін',
    'shop',
    'shop_url',
    'Ціна, грн',
    'травень-червень, 2023',
    4,
    json.chart
  );
  
}

document.addEventListener('DOMContentLoaded', async () => {
  const pathname = new URL(location).pathname;
  const productId = pathname.split('/')[2];

  await loadProduct(productId);
  await loadPrices(productId);
  await loadMethods();
  await loadPredictions(productId);

  [...document.getElementsByClassName('p-settings')].forEach(el => el.addEventListener('input', async () => {
    await loadPredictions(productId);
  }));

  [...document.getElementsByClassName('p-settings')].forEach(el => el.addEventListener('click', async () => {
    document.getElementById('predictions').classList.remove('hidden');
  }));

});
