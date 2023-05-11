import { buildChart } from './chart.js';

let dbShopsData = null;

async function loadShops() {
  const res = await fetch('/shops', {
    method: 'GET',
  });
  const resJSON = await res.json();
  dbShopsData = resJSON;
}

function createProductHTML(product) {
  const productDiv = document.createElement('div');
  productDiv.classList.add('product');
  productDiv.setAttribute('data-id', product.id);
  let html = '';
  html = `<img class="block1" src="${product.image}" width="400px" alt="${product.title}"><div class="block2"><div>
  <div class="title" >${product.title}</div>
  <div>${product.weight_g} г</div><div>${product.brand}</div><div>${product.country}</div>`;
  const originalLinks = {};

  for (const shop of Object.keys(product.prices)) {
    const prices = product.prices[shop];
    html += `<div class="price-holder"><div class="shop-name" title="See Original Product" data-shop="${shop}">${dbShopsData[shop].title}</div>`;
    for (const price of prices) {
      html += `<div class="price ${
        price.comment == 'oldPrice' ? 'old-price' : ''
      }">${
        price.comment == 'priceOpt' ? 'Оптова ціна:' : ''
      }<span class="price">${price.price}</span></div>`;
    }
    html += '</div>';
  }
  html += '</div>';
  html += '<div class="shop-comparer">';
  for (const shop of Object.keys(product.features)) {
    html += '<div class="shop">';
    const features = product.features[shop];
    html += `<div>${dbShopsData[shop].title}</div>`;
    for (const feature of features) {
      if (feature.title == 'id') continue;
      else if (feature.title == 'url_key')
        originalLinks[
          shop
        ] = `${dbShopsData[shop].product_url}${feature.value}`;
      else
        html += `<div class="feature"><div class="feature-description">${feature.title}</div><div class="price">${feature.value}</div></div>`;
    }
    html += '</div>';
  }
  html += '</div>';

  productDiv.innerHTML = html;
  const shopDivs = productDiv.getElementsByClassName('shop-name');
  for (let shopDiv of shopDivs) {
    const shop = shopDiv.getAttribute('data-shop');
    const a = document.createElement('a');
    a.classList.add('shop-name');
    a.setAttribute('title', 'See Original Product');
    a.setAttribute('href', originalLinks[shop]);
    a.innerText = dbShopsData[shop].title;
    shopDiv.replaceWith(a);
  }
  return productDiv;
}

async function loadProduct(productId) {
  const productHolder = document.getElementsByClassName('product-holder')[0];

  const res = await fetch('/products/' + productId + '/data', {
    method: 'GET',
  });
  if (!res.ok) return (productHolder.innerText = await res.text());

  const resJSON = await res.json();
  const productDiv = createProductHTML(resJSON);
  productHolder.appendChild(productDiv);
}

async function loadPrices(productId) {
  const res = await fetch('/products/' + productId + '/prices', {
    method: 'GET',
  });
  const resJSON = await res.json();
  for (const shopId in resJSON) {
    const shop = dbShopsData[shopId].title;
    const shopUrl = dbShopsData[shopId].product_url;
    buildChart(
      shop + '-container',
      'Зміна ціни',
      shop,
      shopUrl,
      'Ціна, грн',
      'травень-червень, 2023',
      4,
      resJSON[shopId]
    );
    console.log(resJSON[shopId], shopId);
  }
  // const productDiv = createProductHTML(resJSON);
  // productHolder.appendChild(productDiv);
}

document.addEventListener('DOMContentLoaded', () => {
  const pathname = new URL(location).pathname;
  const productId = pathname.split('/')[2];

  loadShops();
  loadProduct(productId);
  loadPrices(productId);
});
